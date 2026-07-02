import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY_LIVE || '', {
    apiVersion: '2023-10-16' as any,
});

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    const payload = await request.text();
    const signature = request.headers.get('Stripe-Signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET_LIVE;

    let event: Stripe.Event;

    try {
        if (!signature || !webhookSecret) {
            throw new Error('Falta firma o webhook secret');
        }
        event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return NextResponse.json({ error: err.message }, { status: 400 });
    }

    try {
        switch (event.type) {
            case 'account.updated':
                const account = event.data.object as Stripe.Account;
                if (account.charges_enabled && account.payouts_enabled) {
                    await supabaseAdmin
                        .from('app_users')
                        .update({ stripe_onboarding_complete: true })
                        .eq('stripe_account_id', account.id);
                } else {
                    await supabaseAdmin
                        .from('app_users')
                        .update({ stripe_onboarding_complete: false })
                        .eq('stripe_account_id', account.id);
                }
                break;
            case 'payout.paid':
            case 'payout.failed':
            case 'payout.canceled':
                const payout = event.data.object as Stripe.Payout;
                const status = event.type === 'payout.paid' ? 'approved' : 'rejected'; // asimilamos a approved/rejected del sistema anterior
                
                // Actualizamos el withdrawal asociado a este payout
                await supabaseAdmin
                    .from('withdrawal_requests')
                    .update({ status })
                    .eq('stripe_payout_id', payout.id);
                
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('Error handling webhook event:', error);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }
}
