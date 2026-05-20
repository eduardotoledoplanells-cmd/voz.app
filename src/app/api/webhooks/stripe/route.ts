import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { getAppUsers, addCoinSale } from '@/lib/db';
import { processCoinPurchase } from '@/lib/ledger';
import { Money } from '@/lib/money';

export const dynamic = 'force-dynamic';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
        return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    if (!webhookSecret) {
        console.error('STRIPE_WEBHOOK_SECRET is not configured');
        return NextResponse.json({ error: 'Webhook configuration error' }, { status: 500 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            if (paymentIntent.metadata.type === 'coin_purchase') {
                await handleCoinPurchaseSuccess(paymentIntent);
            }
            break;

        case 'payment_intent.payment_failed':
            const failedPayment = event.data.object as Stripe.PaymentIntent;
            if (failedPayment.metadata.type === 'coin_purchase') {
                console.error(`❌ Coin purchase failed for user ${failedPayment.metadata.userId}`);
            }
            break;

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
}

async function handleCoinPurchaseSuccess(paymentIntent: Stripe.PaymentIntent) {
    const { userId, coins, packId, userHandle } = paymentIntent.metadata;

    if (!userId || !coins) {
        console.error('Missing coin purchase metadata');
        return;
    }

    try {
        const coinsMoney = Money.fromCoins(coins);
        console.log(`Processing coin purchase for user ${userId}: ${coinsMoney.toString()}`);

        // 1. Update user balance in Supabase via Ledger
        const users = await getAppUsers();
        const user = users.find(u => u.id === userId || u.handle === userHandle);

        if (user) {
            try {
                await processCoinPurchase(user.id, coinsMoney.toCoins(), paymentIntent.id);
                console.log(`✅ Ledger transaction succeeded: Credited ${coinsMoney.toCoins()} coins to user ${user.id}.`);
            } catch (ledgerError) {
                console.error(`❌ Ledger transaction failed for user ${user.id}:`, ledgerError);
            }
        } else {
            console.error(`User ${userId} or handle ${userHandle} not found in Supabase`);
        }

        // 2. Record sale in coin_sales table in Supabase
        await addCoinSale({
            userHandle: userHandle || userId,
            packType: packId,
            price: Math.round(paymentIntent.amount) / 100,
            coins: coinsMoney.toCoins(),
            stripePaymentIntentId: paymentIntent.id,
            status: 'succeeded'
        });

    } catch (error) {
        console.error('Error updating coin balance and recording sale:', error);
    }
}
