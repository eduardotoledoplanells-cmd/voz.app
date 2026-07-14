import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { logSystemAlert } from '@/lib/alerts';

export const dynamic = 'force-dynamic';

const COIN_PACKS_SERVER = {
    'p2': {
        price: 12.10,
        coins: 10,
        stripeProductId: 'prod_TjX4aO2Rxu7RSa',
        stripePriceId: 'price_1TYvEz3BtXxsW9ynSoyhq42g'
    },
    'p3': {
        price: 24.20,
        coins: 20,
        stripeProductId: 'prod_TjXAsO4jaiFnzH',
        stripePriceId: 'price_1TYvF03BtXxsW9yn6DhWHs6R'
    },
    'p4': {
        price: 60.50,
        coins: 50,
        stripeProductId: 'prod_TjXCeIKcU0gyzp',
        stripePriceId: 'price_1TYvF03BtXxsW9ynVddbrspc'
    },
    'ps': {
        price: 121.00,
        coins: 100,
        stripeProductId: 'prod_TjXF3kLaarGv61',
        stripePriceId: 'price_1TYvF03BtXxsW9ynfl7DBKlq'
    },
    'pVIP': {
        price: 605.00,
        coins: 500,
        stripeProductId: 'prod_UB9JjJ8h8p1YDe',
        stripePriceId: 'price_1TYvF03BtXxsW9ynCXsvvVTh'
    },
};

const CAMPAIGN_PACKS_SERVER = {
    'camp_mod1': {
        price: 10.00,
        stripeProductId: 'prod_TjX4aO2Rxu7RSa',
        stripePriceId: 'price_1TYvEz3BtXxsW9ynSoyhq42g'
    },
    'camp_mod2': {
        price: 45.00,
        stripeProductId: 'prod_TjXCeIKcU0gyzp',
        stripePriceId: 'price_1TYvF03BtXxsW9ynVddbrspc'
    },
    'camp_mod3': {
        price: 150.00,
        stripeProductId: 'prod_TjXF3kLaarGv61',
        stripePriceId: 'price_1TYvF03BtXxsW9ynfl7DBKlq'
    }
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

        const { packId, userId, userHandle, redirectUrl, type, campaignId } = body;
        console.log('[Stripe Checkout API] Payment request received. Type:', type || 'coin_purchase', 'Pack:', packId);

        let priceId = '';
        let sessionMetadata: any = {};

        if (type === 'campaign_payment') {
            if (!campaignId) {
                return NextResponse.json({ error: 'campaignId es requerido para pagos de campañas' }, { status: 400 });
            }
            const campPack = CAMPAIGN_PACKS_SERVER[packId as keyof typeof CAMPAIGN_PACKS_SERVER];
            if (!campPack) {
                return NextResponse.json({ error: 'Paquete de campaña no válido' }, { status: 400 });
            }
            priceId = campPack.stripePriceId;
            sessionMetadata = {
                type: 'campaign_payment',
                campaignId: campaignId,
                packId: packId,
                userId: userId || 'unknown',
                userHandle: userHandle || 'unknown',
                stripePriceId: priceId
            };
        } else {
            // coin_purchase
            if (!packId || !COIN_PACKS_SERVER[packId as keyof typeof COIN_PACKS_SERVER]) {
                console.error('Invalid packId requested:', packId);
                return NextResponse.json({ error: 'Paquete de monedas no válido' }, { status: 400 });
            }
            const pack = COIN_PACKS_SERVER[packId as keyof typeof COIN_PACKS_SERVER];
            priceId = pack.stripePriceId;
            sessionMetadata = {
                type: 'coin_purchase',
                packId: packId,
                coins: pack.coins.toString(),
                userId: userId || 'unknown',
                userHandle: userHandle || 'unknown',
                stripeProductId: pack.stripeProductId || 'pending',
                stripePriceId: pack.stripePriceId || 'pending'
            };
        }

        if (!process.env.STRIPE_SECRET_KEY) {
            console.error('STRIPE_SECRET_KEY is missing');
            return NextResponse.json({ error: 'Configuración de Stripe incompleta' }, { status: 500 });
        }

        const origin = request.headers.get('origin') || 'https://www.appvoz.com';
        const finalRedirectUrl = redirectUrl || `${origin}/profile`;
        
        const session = await stripe.checkout.sessions.create({
            ui_mode: 'embedded',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'payment',
            return_url: `${finalRedirectUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`,
            metadata: sessionMetadata,
            payment_intent_data: {
                metadata: sessionMetadata
            }
        });

        return NextResponse.json({ 
            clientSecret: session.client_secret,
            publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
        });
    } catch (error: any) {
        console.error('Stripe PaymentIntent creation error:', error);
        await logSystemAlert('Stripe-CoinPack', error);
        return NextResponse.json({ error: error.message || 'Error interno al crear el pago' }, { status: 500 });
    }
}
