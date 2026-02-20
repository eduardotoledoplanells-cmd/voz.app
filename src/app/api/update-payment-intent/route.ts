import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
    try {
        const { clientSecret, orderId } = await request.json();

        if (!clientSecret || !orderId) {
            return NextResponse.json({ error: 'Missing clientSecret or orderId' }, { status: 400 });
        }

        // Extract payment intent ID from client secret
        const paymentIntentId = clientSecret.split('_secret_')[0];

        // Update the payment intent metadata
        await stripe.paymentIntents.update(paymentIntentId, {
            metadata: {
                order_id: orderId
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating payment intent:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
