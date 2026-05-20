import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, { 
    auth: { persistSession: false } 
});

// Official system wallets UUIDs
export const SYSTEM_WALLETS = {
    VOZ: {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'SYSTEM_WALLET_VOZ'
    },
    MINT: {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'SYSTEM_WALLET_MINT'
    },
    HACIENDA: {
        id: '00000000-0000-0000-0000-000000000003',
        name: 'SYSTEM_WALLET_HACIENDA'
    },
    EXTERNAL_WORLD: {
        id: '00000000-0000-0000-0000-000000000004',
        name: 'SYSTEM_WALLET_EXTERNAL_WORLD'
    }
};

/**
 * Get or create the wallet for a user by their user ID or user handle.
 */
export async function getOrCreateUserWallet(userHandleOrId: string): Promise<string> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userHandleOrId);
    
    let query = supabaseAdmin.from('wallets').select('id');
    if (isUuid) {
        query = query.eq('user_id', userHandleOrId);
    } else {
        const cleanHandle = userHandleOrId.replace('@', '');
        query = query.or(`user_handle.eq.${cleanHandle},user_handle.eq.@${cleanHandle}`);
    }

    const { data: wallets, error: wError } = await query;
    if (wError) {
        console.error('[LEDGER] Error searching wallet:', wError);
    }

    if (wallets && wallets.length > 0) {
        return wallets[0].id;
    }

    console.log(`[LEDGER] Wallet not found for user: ${userHandleOrId}. Creating wallet...`);
    let userQuery = supabaseAdmin.from('app_users').select('id, handle, wallet_balance, earnings_balance');
    if (isUuid) {
        userQuery = userQuery.eq('id', userHandleOrId);
    } else {
        const cleanHandle = userHandleOrId.replace('@', '');
        userQuery = userQuery.or(`handle.ilike.${cleanHandle},handle.ilike.@${cleanHandle}`);
    }

    const { data: users, error: uError } = await userQuery;
    if (uError || !users || users.length === 0) {
        throw new Error(`User not found: ${userHandleOrId}`);
    }

    const user = users[0];
    const walletName = `WALLET_${user.handle || user.id}`;
    
    const { data: newWallet, error: insError } = await supabaseAdmin
        .from('wallets')
        .insert([{
            user_id: user.id,
            user_handle: user.handle,
            type: 'USER',
            name: walletName,
            available_balance: user.wallet_balance || 0.00,
            pending_balance: user.earnings_balance || 0.00
        }])
        .select('id')
        .single();

    if (insError || !newWallet) {
        const { data: retryWallets } = await supabaseAdmin
            .from('wallets')
            .select('id')
            .eq('user_id', user.id);
            
        if (retryWallets && retryWallets.length > 0) {
            return retryWallets[0].id;
        }
        
        throw new Error(`Failed to create wallet for user ${userHandleOrId}: ${JSON.stringify(insError)}`);
    }

    return newWallet.id;
}

/**
 * Execute a financial transaction through the database PL/pgSQL function.
 */
export async function executeLedgerTransaction(
    type: string,
    entries: Array<{ wallet_id: string; entry_type: 'AVAILABLE' | 'PENDING'; amount: number }>,
    referenceId: string | null = null,
    idempotencyKey: string | null = null,
    metadata: any = null
) {
    const cleanEntries = entries.map(e => ({
        wallet_id: e.wallet_id,
        entry_type: e.entry_type,
        amount: Math.round(e.amount)
    }));

    const { data, error } = await supabaseAdmin.rpc('execute_ledger_transaction', {
        p_type: type,
        p_entries: cleanEntries,
        p_reference_id: referenceId,
        p_idempotency_key: idempotencyKey,
        p_metadata: metadata || {}
    });

    if (error) {
        console.error(`[LEDGER TRANSACTION ERROR] Type: ${type}, Key: ${idempotencyKey}. Error:`, error);
        throw new Error(error.message);
    }

    return data;
}
