import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ success: false, error: 'UserId es requerido' }, { status: 400 });
        }

        // 1. Obtener usuario de app_users
        const { data: user, error: userError } = await supabaseAdmin
            .from('app_users')
            .select('*')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
        }

        let stripeAccountId = user.stripe_account_id;

        // 2. Crear cuenta conectada (Express) si no tiene
        if (!stripeAccountId) {
            const accountOptions: any = {
                type: 'express',
                capabilities: {
                    transfers: { requested: true },
                },
                business_type: 'individual',
            };
            if (user.email) accountOptions.email = user.email;

            const account = await stripe.accounts.create(accountOptions);
            stripeAccountId = account.id;

            // Guardar en Supabase
            const { error: updateError } = await supabaseAdmin
                .from('app_users')
                .update({ stripe_account_id: stripeAccountId })
                .eq('id', userId);

            if (updateError) {
                console.error('[Stripe Connect] Error guardando stripe_account_id:', updateError.message);
                throw updateError;
            }
        }

        // 3. Crear link de onboarding
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://voz.app';
        
        const accountLink = await stripe.accountLinks.create({
            account: stripeAccountId,
            refresh_url: `${baseUrl}`,
            return_url: `${baseUrl}`,
            type: 'account_onboarding',
        });

        return NextResponse.json({ success: true, url: accountLink.url });
    } catch (error: any) {
        console.error('[Stripe Connect] Error en onboarding:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
