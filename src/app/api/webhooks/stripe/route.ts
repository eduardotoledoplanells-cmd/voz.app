import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import fs from 'fs';
import path from 'path';

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
            } else {
                await handlePaymentSuccess(paymentIntent);
            }
            break;

        case 'payment_intent.payment_failed':
            const failedPayment = event.data.object as Stripe.PaymentIntent;
            if (failedPayment.metadata.type === 'coin_purchase') {
                await handleCoinPurchaseFailure(failedPayment);
            } else {
                await handlePaymentFailure(failedPayment);
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
        const dbPath = path.join(process.cwd(), 'voz-admin', 'db.json');

        if (!fs.existsSync(dbPath)) {
            console.error(`Database not found at ${dbPath}`);
            return;
        }

        const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

        // Resolve userId (cr-2 -> u2)
        // More robust parsing: find the first numeric part
        const match = userId.match(/\d+/);
        const numericId = match ? match[0] : userId;
        const targetAppUserId = userId.startsWith('u') ? userId : `u${numericId}`;

        // Update user balance in app_users
        const userIndex = dbData.app_users.findIndex((u: any) => u.id === targetAppUserId || u.handle === userHandle);
        if (userIndex !== -1) {
            const oldBalance = dbData.app_users[userIndex].walletBalance || 0;
            dbData.app_users[userIndex].walletBalance = oldBalance + parseInt(coins);
            console.log(`✅ Credited ${coins} coins to user ${userId} (${targetAppUserId}). Old: ${oldBalance}, New: ${dbData.app_users[userIndex].walletBalance}`);
        } else {
            console.error(`User ${userId} (${targetAppUserId}) or handle ${userHandle} not found in app_users`);
        }

        // Record sale in coin_sales
        if (!dbData.coin_sales) dbData.coin_sales = [];
        dbData.coin_sales.push({
            id: `sale-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            userHandle: userHandle || userId,
            packType: packId,
            price: paymentIntent.amount / 100,
            coins: parseInt(coins),
            timestamp: new Date().toISOString(),
            stripePaymentIntentId: paymentIntent.id,
            status: 'succeeded'
        });

        fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2));
    } catch (error) {
        console.error('Error updating coin balance:', error);
    }
}

async function handleCoinPurchaseFailure(paymentIntent: Stripe.PaymentIntent) {
    const { userId, packId, userHandle } = paymentIntent.metadata;
    console.error(`❌ Coin purchase failed for user ${userId} (@${userHandle}), pack ${packId}`);

    try {
        const dbPath = path.join(process.cwd(), 'voz-admin', 'db.json');
        if (fs.existsSync(dbPath)) {
            const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
            if (!dbData.logs) dbData.logs = [];
            dbData.logs.push({
                id: `log-${Date.now()}`,
                employeeName: 'Sistema (Stripe)',
                action: 'PAYMENT_FAILED',
                timestamp: new Date().toISOString(),
                details: `Compra de monedas fallida para ${userHandle || userId}. Pack: ${packId}`
            });
            fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2));
        }
    } catch (e) {
        console.error('Error logging payment failure:', e);
    }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata.order_id;

    if (!orderId) {
        console.error('No order_id in payment intent metadata');
        return;
    }

    try {
        // Read orders file
        const ordersPath = path.join(process.cwd(), 'src', 'data', 'orders.json');
        const ordersData = fs.readFileSync(ordersPath, 'utf-8');
        const orders = JSON.parse(ordersData);

        // Find and update the order
        const orderIndex = orders.findIndex((order: any) => order.id === orderId);

        if (orderIndex !== -1) {
            orders[orderIndex].status = 'paid';
            orders[orderIndex].stripePaymentIntentId = paymentIntent.id;
            orders[orderIndex].paidAt = new Date().toISOString();

            // Write back to file
            fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2));

            console.log(`✅ Order ${orderId} marked as paid`);
        } else {
            console.error(`Order ${orderId} not found`);
        }
    } catch (error) {
        console.error('Error updating order:', error);
    }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata.order_id;

    if (!orderId) {
        console.error('No order_id in payment intent metadata');
        return;
    }

    try {
        // Read orders file
        const ordersPath = path.join(process.cwd(), 'src', 'data', 'orders.json');
        const ordersData = fs.readFileSync(ordersPath, 'utf-8');
        const orders = JSON.parse(ordersData);

        // Find and update the order
        const orderIndex = orders.findIndex((order: any) => order.id === orderId);

        if (orderIndex !== -1) {
            orders[orderIndex].status = 'payment_failed';
            orders[orderIndex].stripePaymentIntentId = paymentIntent.id;

            // Write back to file
            fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2));

            console.log(`❌ Order ${orderId} marked as payment_failed`);
        } else {
            console.error(`Order ${orderId} not found`);
        }
    } catch (error) {
        console.error('Error updating order:', error);
    }
}
