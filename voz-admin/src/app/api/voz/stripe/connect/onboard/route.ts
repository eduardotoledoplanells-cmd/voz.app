import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import Stripe from 'stripe';

// Asegurarse de que exista la variable de entorno
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY_LIVE || '', {
    apiVersion: '2023-10-16' as any,
});

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ success: false, error: 'UserId es requerido' }, { status: 400 });
        }

        // 1. Obtener usuario
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
            const account = await stripe.accounts.create({
                type: 'express',
                email: user.email,
                capabilities: {
                    transfers: { requested: true },
                },
                business_type: 'individual',
            });
            stripeAccountId = account.id;

            // Guardar en Supabase
            await supabaseAdmin
                .from('app_users')
                .update({ stripe_account_id: stripeAccountId })
                .eq('id', userId);
        }

        // 3. Crear link de onboarding
        // Redirigiremos a la página principal de la app o a un deep link genérico
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://voz.app';
        
        const accountLink = await stripe.accountLinks.create({
            account: stripeAccountId,
            refresh_url: `${baseUrl}`, // En un entorno real, redirige a una página de reintento
            return_url: `${baseUrl}`,  // Redirige de vuelta a la app o web
            type: 'account_onboarding',
        });

        return NextResponse.json({ success: true, url: accountLink.url });
    } catch (error: any) {
        console.error('[Stripe Connect] Error en onboarding:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
