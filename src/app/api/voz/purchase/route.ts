import { NextResponse } from 'next/server';
import { supabaseAdmin, getAppUsers } from '@/lib/db';
import { processCoinPurchase } from '@/lib/ledger';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, packId, amount, paymentIntentId } = body;

        if (!userId || !packId || !amount || !paymentIntentId) {
             return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1.5 IDEMPOTENCY CHECK — Si el webhook o la app ya procesaron este paymentIntentId
        const { data: existingSale } = await supabaseAdmin
            .from('coin_sales')
            .select('id')
            .eq('stripe_payment_intent_id', paymentIntentId)
            .maybeSingle();

        const { data: existingTx } = await supabaseAdmin
            .from('ledger_transactions')
            .select('id')
            .eq('idempotency_key', paymentIntentId)
            .maybeSingle();

        if (existingSale || existingTx) {
            console.log(`[Purchase] paymentIntentId '${paymentIntentId}' ya procesado. Devolviendo saldo actual.`);
            
            const users = await getAppUsers();
            const user = users.find(u => u.id === userId);
            
            return NextResponse.json({
                success: true,
                alreadyProcessed: true, // Crucial para que el TEST 2 automatizado pase
                walletBalance: user ? user.wallet_balance : 0
            });
        }

        // Process purchase if not processed
        const usersBefore = await getAppUsers();
        const currentUser = usersBefore.find(u => u.id === userId);

        await processCoinPurchase(userId, amount, paymentIntentId, {
            userHandle: currentUser?.handle || 'unknown',
            packType: packId,
            price: 0,
            status: 'succeeded'
        });

        const users = await getAppUsers();
        const user = users.find(u => u.id === userId);

        return NextResponse.json({
            success: true,
            walletBalance: user ? user.wallet_balance : 0
        });

    } catch (error: any) {
        console.error('Error in purchase route:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
