import { createClient } from '@supabase/supabase-js';
import { Money } from './money';
import { logSystemAlert } from './alerts';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';


export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, { 
    auth: { persistSession: false } 
});

// Re-export Money class for easy access
export { Money };

// Math round utility to prevent floating point inaccuracies (Legacy support)
export function roundToTwo(num: number): number {
    return Math.round((num + Number.EPSILON) * 100) / 100;
}

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
    },
    WITHDRAWALS_PENDING: {
        id: '00000000-0000-0000-0000-000000000005',
        name: 'SYSTEM_WALLET_WITHDRAWALS_PENDING'
    }
};

/**
 * Get or create the wallet for a user by their user ID or user handle.
 * This acts as a fallback to ensure every user has an active wallet.
 */
export async function getOrCreateUserWallet(userHandleOrId: string): Promise<string> {
    // 1. Try to find the wallet first
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userHandleOrId);
    
    let query = supabaseAdmin.from('wallets').select('id');
    if (isUuid) {
        query = query.eq('user_id', userHandleOrId);
    } else {
        const cleanHandle = userHandleOrId.replace('@', '');
        query = query.in('user_handle', [cleanHandle, `@${cleanHandle}`]);
    }

    const { data: wallets, error: wError } = await query;
    if (wError) {
        console.error('[LEDGER] Error searching wallet:', wError);
    }

    if (wallets && wallets.length > 0) {
        return wallets[0].id;
    }

    // 2. Wallet not found, lookup user in app_users to create it
    console.log(`[LEDGER] Wallet not found for user: ${userHandleOrId}. Creating wallet...`);
    let userQuery = supabaseAdmin.from('app_users').select('id, handle, wallet_balance, earnings_balance');
    if (isUuid) {
        userQuery = userQuery.eq('id', userHandleOrId);
    } else {
        const cleanHandle = userHandleOrId.replace('@', '');
        userQuery = userQuery.in('handle', [cleanHandle, `@${cleanHandle}`]);
    }

    const { data: users, error: uError } = await userQuery;
    if (uError || !users || users.length === 0) {
        throw new Error(`User not found: ${userHandleOrId}`);
    }

    const user = users[0];
    const walletName = `WALLET_${user.handle || user.id}`;
    
    // Scale balances correctly into microcoins (BIGINT) using Money class
    const initialAvailable = Money.fromCoins(user.wallet_balance || 0).toMicrocoinsNumber();
    const initialPending = Money.fromCoins(user.earnings_balance || 0).toMicrocoinsNumber();

    const { data: newWallet, error: insError } = await supabaseAdmin
        .from('wallets')
        .insert([{
            user_id: user.id,
            user_handle: user.handle,
            type: 'USER',
            name: walletName,
            available_balance: initialAvailable,
            pending_balance: initialPending
        }])
        .select('id')
        .single();

    if (insError || !newWallet) {
        // Handle race conditions where another request created the wallet in the meantime
        const { data: retryWallets } = await supabaseAdmin
            .from('wallets')
            .select('id')
            .eq('user_id', user.id);
            
        if (retryWallets && retryWallets.length > 0) {
            return retryWallets[0].id;
        }
        
        const errMsg = `Failed to create wallet for user ${userHandleOrId}: ${JSON.stringify(insError)}`;
        await logSystemAlert('Ledger', errMsg);
        throw new Error(errMsg);
    }

    return newWallet.id;
}

/**
 * Execute a financial transaction through the database PL/pgSQL function.
 * This runs atomically on Supabase with row locking and auto-rollback.
 */
export async function executeLedgerTransaction(
    type: string,
    entries: Array<{ wallet_id: string; entry_type: 'AVAILABLE' | 'PENDING'; amount: number | bigint }>,
    referenceId: string | null = null,
    idempotencyKey: string | null = null,
    metadata: any = null
) {
    const cleanEntries = entries.map(e => ({
        wallet_id: e.wallet_id,
        entry_type: e.entry_type,
        amount: typeof e.amount === 'bigint' ? Number(e.amount) : Math.round(e.amount)
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
        await logSystemAlert('Ledger', `Ledger transaction error (Type: ${type}, Reference ID: ${referenceId}, Key: ${idempotencyKey}): ${error.message} (${error.details || ''})`);
        throw new Error(error.message);
    }

    // Sincronizar saldos de los wallets hacia app_users
    try {
        const userWalletIds = cleanEntries
            .map(e => e.wallet_id)
            .filter(id => !Object.values(SYSTEM_WALLETS).map(sw => sw.id).includes(id));
        
        const uniqueUserWalletIds = [...new Set(userWalletIds)];

        if (uniqueUserWalletIds.length > 0) {
            const { data: updatedWallets } = await supabaseAdmin
                .from('wallets')
                .select('user_id, available_balance, pending_balance')
                .in('id', uniqueUserWalletIds);

            if (updatedWallets) {
                for (const w of updatedWallets) {
                    if (w.user_id) {
                        await supabaseAdmin.from('app_users').update({
                            wallet_balance: Number(w.available_balance) / 1000,
                            earnings_balance: Number(w.pending_balance) / 1000
                        }).eq('id', w.user_id);
                    }
                }
            }
        }
    } catch (syncError) {
        console.error('[LEDGER SYNC ERROR] Fallo sincronizando saldos a app_users:', syncError);
    }

    return data;
}

/**
 * Coin Purchase Operation (Stripe split).
 * User buys coins pack. Value: 1 coin = 1 EUR.
 * Pack buys include VAT split (21% España).
 * Values processed in microcoins via Money class.
 */
export async function processCoinPurchase(
    userHandleOrId: string,
    coinsAmount: number,
    idempotencyKey: string,
    purchaseMetadata?: {
        userHandle?: string;
        packType?: string;
        price?: number;
        status?: string;
    }
) {
    const userWalletId = await getOrCreateUserWallet(userHandleOrId);
    
    // Normalize coins and calculate VAT using Money class to prevent float drift
    const coins = Money.fromCoins(coinsAmount);
    const tax = Money.fromMicrocoins(Math.round(coins.toMicrocoinsNumber() * 0.21)); // 21% VAT
    const totalFiat = coins.add(tax);

    const entries = [
        // 1. External World source (fiat cash inflow)
        {
            wallet_id: SYSTEM_WALLETS.EXTERNAL_WORLD.id,
            entry_type: 'AVAILABLE' as const,
            amount: -totalFiat.toMicrocoinsNumber()
        },
        // 2. Hacienda VAT tax collection (liability)
        {
            wallet_id: SYSTEM_WALLETS.HACIENDA.id,
            entry_type: 'AVAILABLE' as const,
            amount: tax.toMicrocoinsNumber()
        },
        // 3. VOZ Platform Net Revenue
        {
            wallet_id: SYSTEM_WALLETS.VOZ.id,
            entry_type: 'AVAILABLE' as const,
            amount: coins.toMicrocoinsNumber()
        },
        // 4. MINT token liability (creates the coins)
        {
            wallet_id: SYSTEM_WALLETS.MINT.id,
            entry_type: 'AVAILABLE' as const,
            amount: -coins.toMicrocoinsNumber()
        },
        // 5. User Wallet receives coins
        {
            wallet_id: userWalletId,
            entry_type: 'AVAILABLE' as const,
            amount: coins.toMicrocoinsNumber()
        }
    ];

    // Build metadata for ledger transaction, which will also write to coin_sales atomically
    const userHandle = purchaseMetadata?.userHandle || userHandleOrId.replace('@', '');
    const packType = purchaseMetadata?.packType || 'custom';
    const price = purchaseMetadata?.price !== undefined ? purchaseMetadata.price : totalFiat.toCoins();

    return executeLedgerTransaction(
        'COIN_PURCHASE',
        entries,
        null,
        idempotencyKey,
        { 
            coins: coins.toCoins(), 
            tax: tax.toCoins(), 
            total_fiat: totalFiat.toCoins(),
            user_handle: userHandle,
            pack_type: packType,
            price: price,
            status: purchaseMetadata?.status || 'succeeded'
        }
    );
}

/**
 * Premium Message (PM) Operation.
 * Cost: 5 coins = 5000 microcoins.
 * Split: 40% VOZ platform (+2000 microcoins), 60% Creator (+3000 microcoins in pending hold).
 */
export async function processPremiumMessage(
    senderHandleOrId: string,
    receiverHandleOrId: string,
    idempotencyKey: string
) {
    const senderWalletId = await getOrCreateUserWallet(senderHandleOrId);
    const receiverWalletId = await getOrCreateUserWallet(receiverHandleOrId);

    const total = Money.fromCoins(5); // Fixed cost: 5 coins
    const [vozShare, creatorShare] = total.calculateSplit(0.40); // 40% VOZ, 60% Creator

    const entries = [
        // User pays coins
        {
            wallet_id: senderWalletId,
            entry_type: 'AVAILABLE' as const,
            amount: -total.toMicrocoinsNumber()
        },
        // VOZ Platform revenue (available immediately)
        {
            wallet_id: SYSTEM_WALLETS.VOZ.id,
            entry_type: 'AVAILABLE' as const,
            amount: vozShare.toMicrocoinsNumber()
        },
        // Creator holds coins in pending (fraud protection)
        {
            wallet_id: receiverWalletId,
            entry_type: 'PENDING' as const,
            amount: creatorShare.toMicrocoinsNumber()
        }
    ];

    return executeLedgerTransaction(
        'PREMIUM_MESSAGE',
        entries,
        null,
        idempotencyKey,
        { 
            cost: total.toCoins(), 
            voz_share: vozShare.toCoins(), 
            creator_share: creatorShare.toCoins() 
        }
    );
}

/**
 * Refund Premium Message (PM) Operation.
 * Reverts the 5 coins locked when a PM thread expires (30 days without completion).
 * Sender receives +5 coins back, VOZ returns -2 coins, Creator pending hold -3 coins.
 */
export async function processRefundPM(
    senderHandleOrId: string,
    receiverHandleOrId: string,
    idempotencyKey: string
) {
    const senderWalletId = await getOrCreateUserWallet(senderHandleOrId);
    const receiverWalletId = await getOrCreateUserWallet(receiverHandleOrId);

    const total = Money.fromCoins(5);
    const [vozShare, creatorShare] = total.calculateSplit(0.40);

    const entries = [
        // Refund sender +5 coins in available balance
        {
            wallet_id: senderWalletId,
            entry_type: 'AVAILABLE' as const,
            amount: total.toMicrocoinsNumber()
        },
        // VOZ Platform returns 2 coins
        {
            wallet_id: SYSTEM_WALLETS.VOZ.id,
            entry_type: 'AVAILABLE' as const,
            amount: -vozShare.toMicrocoinsNumber()
        },
        // Creator pending hold reduced by 3 coins
        {
            wallet_id: receiverWalletId,
            entry_type: 'PENDING' as const,
            amount: -creatorShare.toMicrocoinsNumber()
        }
    ];

    return executeLedgerTransaction(
        'PREMIUM_MESSAGE_REFUND',
        entries,
        null,
        idempotencyKey,
        { 
            cost: total.toCoins(), 
            status: 'refunded' 
        }
    );
}

/**
 * Send Gift Operation.
 * Cost: Custom coins amount.
 * Split: 35% VOZ platform, 65% Creator (in pending hold).
 */
export async function processGift(
    senderHandleOrId: string,
    receiverHandleOrId: string,
    coinsAmount: number,
    idempotencyKey: string
) {
    const senderWalletId = await getOrCreateUserWallet(senderHandleOrId);
    const receiverWalletId = await getOrCreateUserWallet(receiverHandleOrId);

    const total = Money.fromCoins(coinsAmount);
    const [vozShare, creatorShare] = total.calculateSplit(0.35); // 35% VOZ, 65% Creator

    const entries = [
        // User pays
        {
            wallet_id: senderWalletId,
            entry_type: 'AVAILABLE' as const,
            amount: -total.toMicrocoinsNumber()
        },
        // VOZ platform share
        {
            wallet_id: SYSTEM_WALLETS.VOZ.id,
            entry_type: 'AVAILABLE' as const,
            amount: vozShare.toMicrocoinsNumber()
        },
        // Creator hold split
        {
            wallet_id: receiverWalletId,
            entry_type: 'PENDING' as const,
            amount: creatorShare.toMicrocoinsNumber()
        }
    ];

    return executeLedgerTransaction(
        'GIFT',
        entries,
        null,
        idempotencyKey,
        { 
            cost: total.toCoins(), 
            voz_share: vozShare.toCoins(), 
            creator_share: creatorShare.toCoins() 
        }
    );
}

/**
 * Donation Operation.
 * Cost: Custom coins amount.
 * Split: 25% VOZ platform, 75% Creator (in pending hold).
 */
export async function processDonation(
    senderHandleOrId: string,
    receiverHandleOrId: string,
    coinsAmount: number,
    idempotencyKey: string
) {
    const senderWalletId = await getOrCreateUserWallet(senderHandleOrId);
    const receiverWalletId = await getOrCreateUserWallet(receiverHandleOrId);

    const total = Money.fromCoins(coinsAmount);
    const [vozShare, creatorShare] = total.calculateSplit(0.25); // 25% VOZ, 75% Creator

    const entries = [
        // User pays
        {
            wallet_id: senderWalletId,
            entry_type: 'AVAILABLE' as const,
            amount: -total.toMicrocoinsNumber()
        },
        // VOZ platform share
        {
            wallet_id: SYSTEM_WALLETS.VOZ.id,
            entry_type: 'AVAILABLE' as const,
            amount: vozShare.toMicrocoinsNumber()
        },
        // Creator hold split
        {
            wallet_id: receiverWalletId,
            entry_type: 'PENDING' as const,
            amount: creatorShare.toMicrocoinsNumber()
        }
    ];

    return executeLedgerTransaction(
        'DONATION',
        entries,
        null,
        idempotencyKey,
        { 
            cost: total.toCoins(), 
            voz_share: vozShare.toCoins(), 
            creator_share: creatorShare.toCoins() 
        }
    );
}

/**
 * Release Pending Balance Hold.
 * Moves balance from PENDING to AVAILABLE for a creator.
 */
export async function processPendingRelease(
    receiverHandleOrId: string,
    amountToRelease: number,
    idempotencyKey: string
) {
    const receiverWalletId = await getOrCreateUserWallet(receiverHandleOrId);
    const release = Money.fromCoins(amountToRelease);

    const entries = [
        // Decrease pending balance
        {
            wallet_id: receiverWalletId,
            entry_type: 'PENDING' as const,
            amount: -release.toMicrocoinsNumber()
        },
        // Increase available balance
        {
            wallet_id: receiverWalletId,
            entry_type: 'AVAILABLE' as const,
            amount: release.toMicrocoinsNumber()
        }
    ];

    return executeLedgerTransaction(
        'PENDING_RELEASE',
        entries,
        null,
        idempotencyKey,
        { amount: release.toCoins() }
    );
}
