
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

const COIN_PACKS_SERVER = {
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
    'pVIP': {
        price: 500,
        coins: 420,
        stripeProductId: 'prod_UB9JjJ8h8p1YDe',
        stripePriceId: 'price_1TCn0l3BtXxsW9ynqgqoPVX4'
    },
};

export async function POST(request: Request) {
    try {
        let body;
        try {
            body = await request.json();
        } catch (e) {
            console.error('JSON Parse Error:', e);
            return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
        }

        const { packId, userId, userHandle } = body;
        console.log('Payment request received for pack:', packId, 'from user:', userHandle);

        if (!packId || !COIN_PACKS_SERVER[packId as keyof typeof COIN_PACKS_SERVER]) {
            console.error('Invalid packId requested:', packId);
            return NextResponse.json({ error: 'Paquete de monedas no válido' }, { status: 400 });
        }

        const pack = COIN_PACKS_SERVER[packId as keyof typeof COIN_PACKS_SERVER];
        const amount = Math.round(pack.price * 100); // Ensure integer cents

        if (!process.env.STRIPE_SECRET_KEY) {
            console.error('STRIPE_SECRET_KEY is missing');
            return NextResponse.json({ error: 'Configuración de Stripe incompleta' }, { status: 500 });
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
        console.error('Stripe PaymentIntent creation error:', error);
        return NextResponse.json({ error: error.message || 'Error interno al crear el pago' }, { status: 500 });
    }
}
