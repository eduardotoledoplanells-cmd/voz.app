-- SQL SCHEMA FOR VOZ DOUBLE-ENTRY LEDGER SYSTEM (VERSION 2 - ARITMÉTICA DE ENTEROS EN MICROCOINS)
-- Paste and run this script in your Supabase SQL Editor.

-- Note: 1 Coin = 1000 Microcoins. All amounts are stored as BIGINT (integers).

-- ====================================================================
-- 1. Table Definitions
-- ====================================================================

-- 1.1 Wallets Table (Stores balances in microcoins)
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL UNIQUE,
    user_handle TEXT UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('USER', 'SYSTEM')),
    name TEXT NOT NULL UNIQUE,
    available_balance BIGINT DEFAULT 0, -- Stored in microcoins
    pending_balance BIGINT DEFAULT 0,   -- Stored in microcoins
    lifetime_earned BIGINT DEFAULT 0,   -- Stored in microcoins
    lifetime_spent BIGINT DEFAULT 0,    -- Stored in microcoins
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1.2 Ledger Transactions Table
CREATE TABLE IF NOT EXISTS public.ledger_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    reference_id UUID,
    total_amount BIGINT NOT NULL, -- Stored in microcoins
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
    amount BIGINT NOT NULL, -- Stored in microcoins (negative for debits, positive for credits)
    before_balance BIGINT NOT NULL,
    after_balance BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- 2. System Wallets Initialization
-- ====================================================================

INSERT INTO public.wallets (id, type, name, available_balance, pending_balance)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'SYSTEM', 'SYSTEM_WALLET_VOZ', 0, 0),
    ('00000000-0000-0000-0000-000000000002', 'SYSTEM', 'SYSTEM_WALLET_MINT', 0, 0),
    ('00000000-0000-0000-0000-000000000003', 'SYSTEM', 'SYSTEM_WALLET_HACIENDA', 0, 0),
    ('00000000-0000-0000-0000-000000000004', 'SYSTEM', 'SYSTEM_WALLET_EXTERNAL_WORLD', 0, 0)
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- 3. Triggers & Functions
-- ====================================================================

-- 3.1 Sync Wallet Balances to app_users (Converting microcoins to decimal coins for UI)
CREATE OR REPLACE FUNCTION public.sync_wallet_to_user()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id IS NOT NULL THEN
        UPDATE public.app_users
        SET wallet_balance = (NEW.available_balance::numeric / 1000.0),
            earnings_balance = (NEW.pending_balance::numeric / 1000.0)
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
        COALESCE((NEW.wallet_balance * 1000.0)::bigint, 0), 
        COALESCE((NEW.earnings_balance * 1000.0)::bigint, 0)
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
    v_wallet_available BIGINT;
    v_wallet_pending BIGINT;
BEGIN
    -- Look up current wallet balances
    SELECT available_balance, pending_balance 
    INTO v_wallet_available, v_wallet_pending
    FROM public.wallets 
    WHERE user_id = NEW.id;

    -- If a wallet exists, override manual updates with the values from wallets table
    IF FOUND THEN
        NEW.wallet_balance := (v_wallet_available::numeric / 1000.0);
        NEW.earnings_balance := (v_wallet_pending::numeric / 1000.0);
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
    COALESCE((wallet_balance * 1000.0)::bigint, 0), 
    COALESCE((earnings_balance * 1000.0)::bigint, 0)
FROM public.app_users
ON CONFLICT (user_id) DO NOTHING;

-- ====================================================================
-- 5. Atomic Double-Entry Ledger Transaction Engine (Stored Function)
-- ====================================================================

CREATE OR REPLACE FUNCTION public.execute_ledger_transaction(
    p_type TEXT,
    p_entries JSONB, -- Array of {wallet_id: uuid, entry_type: text, amount: bigint}
    p_reference_id UUID DEFAULT NULL,
    p_idempotency_key TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
    v_tx_id UUID;
    v_total_amount BIGINT := 0;
    v_entries_sum BIGINT := 0;
    v_entry RECORD;
    v_wallet RECORD;
    v_before_balance BIGINT;
    v_after_balance BIGINT;
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
    FOR v_entry IN SELECT * FROM jsonb_to_recordset(p_entries) AS x(wallet_id UUID, entry_type TEXT, amount BIGINT) LOOP
        v_entries_sum := v_entries_sum + v_entry.amount;
        IF v_entry.amount > 0 THEN
            v_total_amount := v_total_amount + v_entry.amount;
        END IF;
    END LOOP;

    IF v_entries_sum <> 0 THEN
        RAISE EXCEPTION 'Accounting validation failed: SUM(entries.amount) is %, must be exactly 0.', v_entries_sum;
    END IF;

    -- 5.3 Lock all target wallets in deterministic order of IDs to prevent deadlocks
    PERFORM id 
    FROM public.wallets 
    WHERE id IN (
        SELECT DISTINCT (x.wallet_id) 
        FROM jsonb_to_recordset(p_entries) AS x(wallet_id UUID)
    )
    ORDER BY id 
    FOR UPDATE;

    -- 5.4 Insert Ledger Transaction
    v_tx_id := gen_random_uuid();
    INSERT INTO public.ledger_transactions (id, type, status, reference_id, total_amount, idempotency_key, metadata)
    VALUES (v_tx_id, p_type, 'COMPLETED', p_reference_id, v_total_amount, p_idempotency_key, p_metadata)
    RETURNING * INTO v_existing_tx;

    -- 5.5 Process Each Entry (wallets are already locked by key order)
    FOR v_entry IN SELECT * FROM jsonb_to_recordset(p_entries) AS x(wallet_id UUID, entry_type TEXT, amount BIGINT) LOOP
        -- Select the wallet row (already locked above)
        SELECT * INTO v_wallet FROM public.wallets WHERE id = v_entry.wallet_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Wallet not found: %', v_entry.wallet_id;
        END IF;

        v_is_system := (v_wallet.type = 'SYSTEM');

        IF v_entry.entry_type = 'AVAILABLE' THEN
            v_before_balance := v_wallet.available_balance;
            v_after_balance := v_before_balance + v_entry.amount;

            -- Check for negative available balance on user wallets
            IF v_after_balance < 0 AND NOT v_is_system THEN
                RAISE EXCEPTION 'Insufficient funds: Wallet % available balance is %, transaction requires %.', 
                    v_entry.wallet_id, v_before_balance, v_entry.amount;
            END IF;

            -- Update wallet
            IF v_entry.amount > 0 THEN
                UPDATE public.wallets 
                SET available_balance = v_after_balance,
                    lifetime_earned = lifetime_earned + v_entry.amount
                WHERE id = v_entry.wallet_id;
            ELSE
                UPDATE public.wallets 
                SET available_balance = v_after_balance,
                    lifetime_spent = lifetime_spent + ABS(v_entry.amount)
                WHERE id = v_entry.wallet_id;
            END IF;
        ELSIF v_entry.entry_type = 'PENDING' THEN
            v_before_balance := v_wallet.pending_balance;
            v_after_balance := v_before_balance + v_entry.amount;

            -- Check for negative pending balance on user wallets
            IF v_after_balance < 0 AND NOT v_is_system THEN
                RAISE EXCEPTION 'Insufficient pending funds: Wallet % pending balance is %, transaction requires %.', 
                    v_entry.wallet_id, v_before_balance, v_entry.amount;
            END IF;

            -- Update wallet
            IF v_entry.amount > 0 THEN
                UPDATE public.wallets 
                SET pending_balance = v_after_balance,
                    lifetime_earned = lifetime_earned + v_entry.amount
                WHERE id = v_entry.wallet_id;
            ELSE
                UPDATE public.wallets 
                SET pending_balance = v_after_balance,
                    lifetime_spent = lifetime_spent + ABS(v_entry.amount)
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
    USING (type = 'USER' AND user_id = auth.uid());

DROP POLICY IF EXISTS select_own_entries ON public.ledger_entries;
CREATE POLICY select_own_entries ON public.ledger_entries
    FOR SELECT TO authenticated 
    USING (wallet_id IN (SELECT id FROM public.wallets WHERE type = 'USER' AND user_id = auth.uid()));

-- ====================================================================
-- 7. Reconciliation Logs Table
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.reconciliation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reconciled_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    total_wallet_available TEXT NOT NULL,
    total_wallet_pending TEXT NOT NULL,
    total_ledger_available TEXT NOT NULL,
    total_ledger_pending TEXT NOT NULL,
    available_drift TEXT NOT NULL,
    pending_drift TEXT NOT NULL,
    double_entry_imbalance TEXT NOT NULL,
    total_minted TEXT NOT NULL,
    coins_in_circulation TEXT NOT NULL,
    status TEXT NOT NULL
);

ALTER TABLE public.reconciliation_logs ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.reconciliation_logs TO service_role;
GRANT SELECT ON public.reconciliation_logs TO authenticated;

DROP POLICY IF EXISTS select_reconciliation_logs ON public.reconciliation_logs;
CREATE POLICY select_reconciliation_logs ON public.reconciliation_logs
    FOR SELECT TO authenticated
    USING (true); -- Allow authenticated users (like employees) to view health check logs

-- ====================================================================
-- 8. Atomic Double-Entry Balance Verification Trigger (Deferred Constraint)
-- ====================================================================

CREATE OR REPLACE FUNCTION public.check_transaction_atomic_sum()
RETURNS TRIGGER AS $$
DECLARE
    v_sum BIGINT;
    v_tx_id UUID;
BEGIN
    -- Determine the transaction_id based on operation
    IF TG_OP = 'DELETE' THEN
        v_tx_id := OLD.transaction_id;
    ELSE
        v_tx_id := NEW.transaction_id;
    END IF;

    -- Sum of all entries for the transaction being committed
    SELECT SUM(amount) INTO v_sum 
    FROM public.ledger_entries 
    WHERE transaction_id = v_tx_id;

    IF v_sum IS NOT NULL AND v_sum <> 0 THEN
        RAISE EXCEPTION 'Ledger transaction % is unbalanced. Total sum of entries is %, must be exactly 0.', 
            v_tx_id, v_sum;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Constraint trigger that is deferred until the transaction COMMIT
DROP TRIGGER IF EXISTS trg_enforce_double_entry ON public.ledger_entries;
CREATE CONSTRAINT TRIGGER trg_enforce_double_entry
AFTER INSERT OR UPDATE OR DELETE ON public.ledger_entries
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION public.check_transaction_atomic_sum();

-- ====================================================================
-- 7. Atomic Video Interaction RPCs
-- ====================================================================

CREATE OR REPLACE FUNCTION public.increment_video_likes(vid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.videos 
    SET likes = COALESCE(likes, 0) + 1 
    WHERE id = vid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrement_video_likes(vid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.videos 
    SET likes = GREATEST(0, COALESCE(likes, 0) - 1) 
    WHERE id = vid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ====================================================================
-- 8. DB-Side Reconciliation Engine
-- ====================================================================
CREATE OR REPLACE FUNCTION public.reconcile_balances()
RETURNS JSON AS $$
DECLARE
    v_total_wallet_available BIGINT;
    v_total_wallet_pending BIGINT;
    v_total_ledger_available BIGINT;
    v_total_ledger_pending BIGINT;
    v_total_ledger_sum BIGINT;
    v_total_minted_amount BIGINT;
    v_coins_in_circulation BIGINT;
    v_available_drift BIGINT;
    v_pending_drift BIGINT;
    v_double_entry_imbalance BIGINT;
    v_is_healthy BOOLEAN;
    v_mint_wallet_id UUID := '00000000-0000-0000-0000-000000000002';
BEGIN
    -- 1. Calculate sum of wallets balances
    SELECT COALESCE(SUM(available_balance::BIGINT), 0), COALESCE(SUM(pending_balance::BIGINT), 0)
    INTO v_total_wallet_available, v_total_wallet_pending
    FROM public.wallets;

    -- 2. Calculate sum of ledger entries grouped by type
    SELECT COALESCE(SUM(CASE WHEN entry_type = 'AVAILABLE' THEN amount::BIGINT ELSE 0 END), 0),
           COALESCE(SUM(CASE WHEN entry_type = 'PENDING' THEN amount::BIGINT ELSE 0 END), 0),
           COALESCE(SUM(amount::BIGINT), 0)
    INTO v_total_ledger_available, v_total_ledger_pending, v_total_ledger_sum
    FROM public.ledger_entries;

    -- 3. Calculate drift
    v_available_drift := v_total_wallet_available - v_total_ledger_available;
    v_pending_drift := v_total_wallet_pending - v_total_ledger_pending;
    v_double_entry_imbalance := v_total_ledger_sum;

    -- 4. Calculate mint and coin circulation
    SELECT COALESCE(SUM(amount::BIGINT), 0) * -1
    INTO v_total_minted_amount
    FROM public.ledger_entries
    WHERE wallet_id = v_mint_wallet_id;

    SELECT COALESCE(SUM(available_balance::BIGINT + pending_balance::BIGINT), 0)
    INTO v_coins_in_circulation
    FROM public.wallets
    WHERE id NOT IN (
        v_mint_wallet_id,
        '00000000-0000-0000-0000-000000000004',
        '00000000-0000-0000-0000-000000000003'
    );

    v_is_healthy := (v_available_drift = 0 AND v_pending_drift = 0 AND v_double_entry_imbalance = 0);

    RETURN json_build_object(
        'totalWalletAvailable', v_total_wallet_available::TEXT,
        'totalWalletPending', v_total_wallet_pending::TEXT,
        'totalLedgerAvailable', v_total_ledger_available::TEXT,
        'totalLedgerPending', v_total_ledger_pending::TEXT,
        'availableDrift', v_available_drift::TEXT,
        'pendingDrift', v_pending_drift::TEXT,
        'doubleEntryImbalance', v_double_entry_imbalance::TEXT,
        'totalMinted', v_total_minted_amount::TEXT,
        'coinsInCirculation', v_coins_in_circulation::TEXT,
        'isHealthy', v_is_healthy
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


