import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAppUsers, updateAppUser, addCoinSale } from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
        return NextResponse.json({ error: 'No signature' }, { status: 400 });
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
        console.log(`Processing coin purchase for user ${userId}: ${coins} coins`);

        // 1. Update user balance in Supabase
        const users = await getAppUsers();
        // Resolve target user (by handle or id)
        const user = users.find(u => u.id === userId || u.handle === userHandle);

        if (user) {
            const oldBalance = user.walletBalance || 0;
            const newBalance = oldBalance + parseInt(coins);

            await updateAppUser(user.id, {
                walletBalance: newBalance
            });

            console.log(`✅ Credited ${coins} coins to user ${userId}. Old: ${oldBalance}, New: ${newBalance}`);
        } else {
            console.error(`User ${userId} or handle ${userHandle} not found in Supabase`);
        }

        // 2. Record sale in coin_sales table in Supabase
        await addCoinSale({
            userHandle: userHandle || userId,
            packType: packId,
            price: paymentIntent.amount / 100,
            coins: parseInt(coins),
            stripePaymentIntentId: paymentIntent.id,
            status: 'succeeded'
        });

    } catch (error) {
        console.error('Error updating coin balance and recording sale:', error);
    }
}
