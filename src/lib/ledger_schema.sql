-- SQL SCHEMA FOR VOZ DOUBLE-ENTRY LEDGER SYSTEM
-- Paste and run this script in your Supabase SQL Editor.

-- ====================================================================
-- 1. Table Definitions
-- ====================================================================

-- 1.1 Wallets Table
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
    user_handle TEXT UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('USER', 'SYSTEM')),
    name TEXT NOT NULL UNIQUE,
    available_balance DECIMAL(15, 2) DEFAULT 0.00,
    pending_balance DECIMAL(15, 2) DEFAULT 0.00,
    lifetime_earned DECIMAL(15, 2) DEFAULT 0.00,
    lifetime_spent DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1.2 Ledger Transactions Table
CREATE TABLE IF NOT EXISTS public.ledger_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    reference_id UUID,
    total_amount DECIMAL(15, 2) NOT NULL,
    idempotency_key TEXT UNIQUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1.3 Ledger Entries Table
CREATE TABLE IF NOT EXISTS public.ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES public.ledger_transactions(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES public.wallets(id),
    entry_type TEXT NOT NULL CHECK (entry_type IN ('AVAILABLE', 'PENDING')),
    amount DECIMAL(15, 2) NOT NULL,
    before_balance DECIMAL(15, 2) NOT NULL,
    after_balance DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- 2. System Wallets Initialization
-- ====================================================================

INSERT INTO public.wallets (id, type, name, available_balance, pending_balance)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'SYSTEM', 'SYSTEM_WALLET_VOZ', 0.00, 0.00),
    ('00000000-0000-0000-0000-000000000002', 'SYSTEM', 'SYSTEM_WALLET_MINT', 0.00, 0.00),
    ('00000000-0000-0000-0000-000000000003', 'SYSTEM', 'SYSTEM_WALLET_HACIENDA', 0.00, 0.00),
    ('00000000-0000-0000-0000-000000000004', 'SYSTEM', 'SYSTEM_WALLET_EXTERNAL_WORLD', 0.00, 0.00)
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- 3. Triggers & Functions
-- ====================================================================

-- 3.1 Sync Wallet Balances to app_users
CREATE OR REPLACE FUNCTION public.sync_wallet_to_user()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id IS NOT NULL THEN
        UPDATE public.app_users
        SET wallet_balance = NEW.available_balance,
            earnings_balance = NEW.pending_balance
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_wallet_to_user ON public.wallets;
CREATE TRIGGER trg_sync_wallet_to_user
AFTER UPDATE OF available_balance, pending_balance ON public.wallets
FOR EACH ROW
EXECUTE FUNCTION public.sync_wallet_to_user();

-- 3.2 Auto-create Wallet for New app_users
CREATE OR REPLACE FUNCTION public.create_wallet_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.wallets (user_id, user_handle, type, name, available_balance, pending_balance)
    VALUES (
        NEW.id, 
        NEW.handle, 
        'USER', 
        'WALLET_' || COALESCE(NEW.handle, NEW.id::text), 
        COALESCE(NEW.wallet_balance, 0.00), 
        COALESCE(NEW.earnings_balance, 0.00)
    )
    ON CONFLICT (user_id) DO UPDATE 
    SET user_handle = EXCLUDED.user_handle;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_create_wallet_for_new_user ON public.app_users;
CREATE TRIGGER trg_create_wallet_for_new_user
AFTER INSERT ON public.app_users
FOR EACH ROW
EXECUTE FUNCTION public.create_wallet_for_new_user();

-- 3.3 Protect app_users Balances from Direct/Manual Manipulation
CREATE OR REPLACE FUNCTION public.protect_user_balances()
RETURNS TRIGGER AS $$
DECLARE
    v_wallet_available DECIMAL(15,2);
    v_wallet_pending DECIMAL(15,2);
BEGIN
    -- Look up current wallet balances
    SELECT available_balance, pending_balance 
    INTO v_wallet_available, v_wallet_pending
    FROM public.wallets 
    WHERE user_id = NEW.id;

    -- If a wallet exists, override manual updates with the values from wallets table
    IF FOUND THEN
        NEW.wallet_balance := v_wallet_available;
        NEW.earnings_balance := v_wallet_pending;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_user_balances ON public.app_users;
CREATE TRIGGER trg_protect_user_balances
BEFORE UPDATE OF wallet_balance, earnings_balance ON public.app_users
FOR EACH ROW
EXECUTE FUNCTION public.protect_user_balances();

-- ====================================================================
-- 4. Backfill Wallets for Existing Users
-- ====================================================================

INSERT INTO public.wallets (user_id, user_handle, type, name, available_balance, pending_balance)
SELECT 
    id, 
    handle, 
    'USER', 
    'WALLET_' || COALESCE(handle, id::text), 
    COALESCE(wallet_balance, 0.00), 
    COALESCE(earnings_balance, 0.00)
FROM public.app_users
ON CONFLICT (user_id) DO NOTHING;

-- ====================================================================
-- 5. Atomic Double-Entry Ledger Transaction Engine (Stored Function)
-- ====================================================================

CREATE OR REPLACE FUNCTION public.execute_ledger_transaction(
    p_type TEXT,
    p_entries JSONB, -- Array of {wallet_id: uuid, entry_type: text, amount: numeric}
    p_reference_id UUID DEFAULT NULL,
    p_idempotency_key TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
    v_tx_id UUID;
    v_total_amount DECIMAL(15, 2) := 0.00;
    v_entries_sum DECIMAL(15, 2) := 0.00;
    v_entry RECORD;
    v_wallet RECORD;
    v_before_balance DECIMAL(15, 2);
    v_after_balance DECIMAL(15, 2);
    v_inserted_entries JSONB := '[]'::jsonb;
    v_existing_tx RECORD;
    v_is_system BOOLEAN;
BEGIN
    -- 5.1 Idempotency Check
    IF p_idempotency_key IS NOT NULL THEN
        SELECT * INTO v_existing_tx FROM public.ledger_transactions WHERE idempotency_key = p_idempotency_key;
        IF FOUND THEN
            -- Retrieve entries associated with existing transaction
            SELECT jsonb_agg(to_jsonb(e)) INTO v_inserted_entries 
            FROM public.ledger_entries e 
            WHERE transaction_id = v_existing_tx.id;
            
            RETURN jsonb_build_object(
                'transaction', to_jsonb(v_existing_tx),
                'entries', COALESCE(v_inserted_entries, '[]'::jsonb),
                'isDuplicate', TRUE
            );
        END IF;
    END IF;

    -- 5.2 Validate Double-Entry Sum to Zero
    FOR v_entry IN SELECT * FROM jsonb_to_recordset(p_entries) AS x(wallet_id UUID, entry_type TEXT, amount DECIMAL(15, 2)) LOOP
        v_entries_sum := v_entries_sum + v_entry.amount;
        IF v_entry.amount > 0 THEN
            v_total_amount := v_total_amount + v_entry.amount;
        END IF;
    END LOOP;

    IF v_entries_sum <> 0.00 THEN
        RAISE EXCEPTION 'Accounting validation failed: SUM(entries.amount) is %, must be exactly 0.00.', v_entries_sum;
    END IF;

    -- 5.3 Insert Ledger Transaction
    v_tx_id := gen_random_uuid();
    INSERT INTO public.ledger_transactions (id, type, status, reference_id, total_amount, idempotency_key, metadata)
    VALUES (v_tx_id, p_type, 'COMPLETED', p_reference_id, v_total_amount, p_idempotency_key, p_metadata)
    RETURNING * INTO v_existing_tx;

    -- 5.4 Process Each Entry & Lock Rows to prevent race conditions
    FOR v_entry IN SELECT * FROM jsonb_to_recordset(p_entries) AS x(wallet_id UUID, entry_type TEXT, amount DECIMAL(15, 2)) LOOP
        -- Select FOR UPDATE locks the specific row in this transaction
        SELECT * INTO v_wallet FROM public.wallets WHERE id = v_entry.wallet_id FOR UPDATE;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Wallet not found: %', v_entry.wallet_id;
        END IF;

        v_is_system := (v_wallet.type = 'SYSTEM');

        IF v_entry.entry_type = 'AVAILABLE' THEN
            v_before_balance := v_wallet.available_balance;
            v_after_balance := v_before_balance + v_entry.amount;

            -- Check for negative available balance on user wallets
            IF v_after_balance < 0.00 AND NOT v_is_system THEN
                RAISE EXCEPTION 'Insufficient funds: Wallet % available balance is %, transaction requires %.', 
                    v_entry.wallet_id, v_before_balance, v_entry.amount;
            END IF;

            -- Update wallet
            IF v_entry.amount > 0 THEN
                UPDATE public.wallets 
                SET available_balance = v_after_balance,
                    lifetime_earned = ROUND(lifetime_earned + v_entry.amount, 2)
                WHERE id = v_entry.wallet_id;
            ELSE
                UPDATE public.wallets 
                SET available_balance = v_after_balance,
                    lifetime_spent = ROUND(lifetime_spent + ABS(v_entry.amount), 2)
                WHERE id = v_entry.wallet_id;
            END IF;
        ELSIF v_entry.entry_type = 'PENDING' THEN
            v_before_balance := v_wallet.pending_balance;
            v_after_balance := v_before_balance + v_entry.amount;

            -- Check for negative pending balance on user wallets
            IF v_after_balance < 0.00 AND NOT v_is_system THEN
                RAISE EXCEPTION 'Insufficient pending funds: Wallet % pending balance is %, transaction requires %.', 
                    v_entry.wallet_id, v_before_balance, v_entry.amount;
            END IF;

            -- Update wallet
            IF v_entry.amount > 0 THEN
                UPDATE public.wallets 
                SET pending_balance = v_after_balance,
                    lifetime_earned = ROUND(lifetime_earned + v_entry.amount, 2)
                WHERE id = v_entry.wallet_id;
            ELSE
                UPDATE public.wallets 
                SET pending_balance = v_after_balance,
                    lifetime_spent = ROUND(lifetime_spent + ABS(v_entry.amount), 2)
                WHERE id = v_entry.wallet_id;
            END IF;
        ELSE
            RAISE EXCEPTION 'Invalid entry_type: %. Must be AVAILABLE or PENDING.', v_entry.entry_type;
        END IF;

        -- Insert Ledger Entry
        INSERT INTO public.ledger_entries (transaction_id, wallet_id, entry_type, amount, before_balance, after_balance)
        VALUES (v_tx_id, v_entry.wallet_id, v_entry.entry_type, v_entry.amount, v_before_balance, v_after_balance)
        RETURNING * INTO v_entry;

        v_inserted_entries := v_inserted_entries || to_jsonb(v_entry);
    END LOOP;

    RETURN jsonb_build_object(
        'transaction', to_jsonb(v_existing_tx),
        'entries', v_inserted_entries,
        'isDuplicate', FALSE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- 6. Permissions and Row Level Security
-- ====================================================================

-- Enable RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT ALL ON public.wallets TO service_role;
GRANT SELECT ON public.wallets TO authenticated;

GRANT ALL ON public.ledger_transactions TO service_role;
GRANT SELECT ON public.ledger_transactions TO authenticated;

GRANT ALL ON public.ledger_entries TO service_role;
GRANT SELECT ON public.ledger_entries TO authenticated;

-- Policies
DROP POLICY IF EXISTS select_own_wallet ON public.wallets;
CREATE POLICY select_own_wallet ON public.wallets
    FOR SELECT TO authenticated 
    USING (user_id = auth.uid() OR user_handle = (SELECT handle FROM public.app_users WHERE id = auth.uid()));

DROP POLICY IF EXISTS select_own_entries ON public.ledger_entries;
CREATE POLICY select_own_entries ON public.ledger_entries
    FOR SELECT TO authenticated 
    USING (wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid() OR user_handle = (SELECT handle FROM public.app_users WHERE id = auth.uid())));
