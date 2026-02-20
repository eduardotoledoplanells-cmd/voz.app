
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const COIN_PACKS_SERVER = {
    'p1': {
        price: 5,
        coins: 4,
        stripeProductId: 'prod_TjWpwj5UlowbTV',
        stripePriceId: 'price_1Sm3lv3BtXxsW9ynOIXWfDnM'
    },
    'p2': {
        price: 10,
        coins: 8,
        stripeProductId: 'prod_TjX4aO2Rxu7RSa',
        stripePriceId: 'price_1Sm40J3BtXxsW9ynEAGu8d6c'
    },
    'p3': {
        price: 20,
        coins: 17,
        stripeProductId: 'prod_TjXAsO4jaiFnzH',
        stripePriceId: 'price_1Sm45l3BtXxsW9ynBndJo74C'
    },
    'p4': {
        price: 50,
        coins: 42,
        stripeProductId: 'prod_TjXCeIKcU0gyzp',
        stripePriceId: 'price_1Sm48N3BtXxsW9ynavqHmSPs'
    },
    'ps': {
        price: 100,
        coins: 80,
        stripeProductId: 'prod_TjXF3kLaarGv61',
        stripePriceId: 'price_1Sm4B43BtXxsW9ynuXyq8awR'
    },
};

export async function POST(request: Request) {
    try {
        const { packId, userId, userHandle } = await request.json();
        console.log('Payment request:', { packId, userId, userHandle });

        if (!packId || !COIN_PACKS_SERVER[packId as keyof typeof COIN_PACKS_SERVER]) {
            console.error('Invalid packId:', packId);
            return NextResponse.json({ error: 'Paquete de monedas no válido' }, { status: 400 });
        }

        const pack = COIN_PACKS_SERVER[packId as keyof typeof COIN_PACKS_SERVER];
        const amount = pack.price * 100; // Amount in cents

        if (!process.env.STRIPE_SECRET_KEY) {
            console.error('STRIPE_SECRET_KEY is missing');
            return NextResponse.json({ error: 'Error de configuración en el servidor' }, { status: 500 });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'eur',
            payment_method_types: ['card'],
            metadata: {
                type: 'coin_purchase',
                packId: packId,
                coins: pack.coins.toString(),
                userId: userId || 'unknown',
                userHandle: userHandle || 'unknown',
                stripeProductId: pack.stripeProductId || 'pending',
                stripePriceId: pack.stripePriceId || 'pending'
            }
        });

        return NextResponse.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
        console.error('Stripe error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
