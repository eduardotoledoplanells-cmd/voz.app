-- SQL UPDATE FOR VOZ LEDGER SYSTEM
-- 1. Create public.coin_sales if not exists
CREATE TABLE IF NOT EXISTS public.coin_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_handle TEXT NOT NULL,
    pack_type TEXT NOT NULL,
    price DECIMAL NOT NULL,
    coins INTEGER NOT NULL,
    stripe_payment_intent_id TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'succeeded',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS and grant permissions
ALTER TABLE public.coin_sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_coin_sales ON public.coin_sales;
CREATE POLICY select_coin_sales ON public.coin_sales
    FOR SELECT TO authenticated
    USING (true); -- Allow authenticated users (like admins) to view sales

GRANT ALL ON public.coin_sales TO service_role;
GRANT SELECT ON public.coin_sales TO authenticated;

-- 2. Update execute_ledger_transaction PL/pgSQL function to atomically record coin sales
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

    -- Special verification: For COIN_PURCHASE, we make sure p_metadata has the required purchase details
    IF p_type = 'COIN_PURCHASE' THEN
        IF p_metadata IS NULL OR NOT (p_metadata ? 'user_handle') OR NOT (p_metadata ? 'pack_type') OR NOT (p_metadata ? 'price') OR NOT (p_metadata ? 'coins') THEN
            RAISE EXCEPTION 'COIN_PURCHASE metadata is missing required fields (user_handle, pack_type, price, coins).';
        END IF;
        
        -- Insert into coin_sales inside the same transaction
        -- If this fails (e.g. unique constraint on stripe_payment_intent_id), the transaction will abort.
        INSERT INTO public.coin_sales (user_handle, pack_type, price, coins, stripe_payment_intent_id, status)
        VALUES (
            (p_metadata->>'user_handle'),
            (p_metadata->>'pack_type'),
            (p_metadata->>'price')::NUMERIC,
            (p_metadata->>'coins')::INTEGER,
            p_idempotency_key,
            COALESCE(p_metadata->>'status', 'succeeded')
        );
    END IF;

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
