
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const STRIPE_ACCOUNT_ID = 'acct_1Sm1OD3BtXxsW9yn';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // En un entorno de producción, recuperaríamos datos reales de Stripe.
        // Aquí intentaremos recuperar la información de la cuenta y el balance.

        // 1. Obtener balance (puedes omitir {stripeAccount} si es la cuenta principal)
        const balance = await stripe.balance.retrieve();

        // 2. Obtener últimos pagos
        const paymentIntents = await stripe.paymentIntents.list({
            limit: 100,
        });

        // 3. Obtener info de la cuenta
        let accountInfo = null;
        try {
            accountInfo = await stripe.accounts.retrieve(STRIPE_ACCOUNT_ID);
        } catch (e) {
            console.warn('Could not retrieve specific account, using default info');
        }

        return NextResponse.json({
            balance,
            paymentIntents: paymentIntents.data,
            account: accountInfo || { id: STRIPE_ACCOUNT_ID, business_profile: { name: 'VOZ Platform' } },
            syncTime: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('Error fetching Stripe stats:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
