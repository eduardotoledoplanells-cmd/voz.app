import { NextResponse } from 'next/server';
import { supabaseAdmin, getUserById } from '@/lib/db';
import { processCoinPurchase } from '@/lib/ledger';
import { logSystemAlert } from '@/lib/alerts';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
    try {
        const authenticatedUserId = req.headers.get('x-user-id');
        if (!authenticatedUserId) {
            return NextResponse.json({ error: 'Unauthorized: User not authenticated' }, { status: 401 });
        }

        const body = await req.json();
        const { userId, packId, amount, paymentIntentId } = body;

        if (!userId || !packId || !amount || !paymentIntentId) {
             return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Prevent identity spoofing: verify that body.userId matches the verified JWT user ID
        if (userId !== authenticatedUserId) {
            return NextResponse.json({ error: 'Forbidden: Identity mismatch' }, { status: 403 });
        }

        // 1. Fetch PaymentIntent from Stripe (or mock in development/test for automated verification)
        let paymentIntent;
        if (process.env.NODE_ENV !== 'production' && paymentIntentId.startsWith('pi_mock_')) {
            const mockCoins = paymentIntentId.includes('_coins_') ? Number(paymentIntentId.split('_coins_')[1].split('_')[0]) : amount;
            const mockAmount = paymentIntentId.includes('_amt_') ? Number(paymentIntentId.split('_amt_')[1].split('_')[0]) : (mockCoins * 121);
            const mockCurrency = paymentIntentId.includes('_usd_') ? 'usd' : 'eur';
            const mockUserId = paymentIntentId.includes('_user_') ? paymentIntentId.split('_user_')[1].split('_')[0] : authenticatedUserId;
            const mockType = paymentIntentId.includes('_type_') ? paymentIntentId.split('_type_')[1].split('_')[0] : 'coin_purchase';
            const mockStatus = paymentIntentId.includes('_failed_') ? 'failed' : 'succeeded';

            paymentIntent = {
                id: paymentIntentId,
                status: mockStatus,
                currency: mockCurrency,
                amount: mockAmount,
                metadata: {
                    type: mockType,
                    userId: mockUserId,
                    coins: mockCoins.toString(),
                }
            };
        } else {
            try {
                paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            } catch (stripeErr: any) {
                console.error('[Purchase] Stripe retrieval error:', stripeErr);
                return NextResponse.json({ error: `Invalid PaymentIntent: ${stripeErr.message}` }, { status: 400 });
            }
        }

        // 2. Validate PaymentIntent Status
        if (paymentIntent.status !== 'succeeded') {
            return NextResponse.json({ error: `Payment not succeeded (status: ${paymentIntent.status})` }, { status: 400 });
        }

        // 3. Validate Base Currency (eur)
        if (paymentIntent.currency !== 'eur') {
            return NextResponse.json({ error: `Invalid currency: ${paymentIntent.currency}` }, { status: 400 });
        }

        // 4. Validate metadata type & userId
        if (paymentIntent.metadata.type !== 'coin_purchase') {
            return NextResponse.json({ error: 'Invalid payment intent type' }, { status: 400 });
        }

        if (paymentIntent.metadata.userId !== authenticatedUserId) {
            return NextResponse.json({ error: 'Forbidden: Payment metadata user mismatch' }, { status: 403 });
        }

        // 5. Validate coin amount consistency
        const metadataCoins = Number(paymentIntent.metadata.coins);
        if (metadataCoins !== amount) {
            return NextResponse.json({ error: 'Inconsistent coin amount' }, { status: 400 });
        }

        // 6. Validate price proportionality (Expected amount: amount * 1.21 EUR in cents)
        const expectedCents = amount * 121;
        if (paymentIntent.amount !== expectedCents) {
            return NextResponse.json({ error: 'Inconsistent payment amount' }, { status: 400 });
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
            
            const user = await getUserById(userId);
            
            return NextResponse.json({
                success: true,
                alreadyProcessed: true,
                walletBalance: user ? user.walletBalance : 0
            });
        }

        // Process purchase if not processed
        const currentUser = await getUserById(userId);

        await processCoinPurchase(userId, amount, paymentIntentId, {
            userHandle: currentUser?.handle || 'unknown',
            packType: packId,
            price: paymentIntent.amount / 100,
            status: 'succeeded'
        });

        const user = await getUserById(userId);

        return NextResponse.json({
            success: true,
            walletBalance: user ? user.walletBalance : 0
        });

    } catch (error: any) {
        console.error('Error in purchase route:', error);
        await logSystemAlert('Compras', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

