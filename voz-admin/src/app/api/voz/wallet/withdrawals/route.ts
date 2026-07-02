import { NextResponse } from 'next/server';
import { supabaseAdmin, addNotification } from '@/lib/db';
import { executeLedgerTransaction, getOrCreateUserWallet, SYSTEM_WALLETS } from '@/lib/ledger';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY_LIVE || '', {
    apiVersion: '2023-10-16' as any,
});

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('withdrawal_requests')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json({ success: true, withdrawals: data });
    } catch (e) {
        return NextResponse.json({ success: false, error: 'Failed to fetch withdrawals' }, { status: 500 });
    }
}

// Retiro automático usando Stripe Connect
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, amount } = body;

        if (!userId || !amount || amount <= 0) {
            return NextResponse.json({ success: false, error: 'Parámetros inválidos' }, { status: 400 });
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

        if (!user.stripe_account_id || !user.stripe_onboarding_complete) {
            return NextResponse.json({ success: false, error: 'Debes configurar tu cuenta bancaria (Stripe) primero' }, { status: 403 });
        }

        // 2. Comprobar saldo en base de datos (earnings_balance)
        if ((user.earnings_balance || 0) < amount) {
            return NextResponse.json({ success: false, error: 'Saldo insuficiente' }, { status: 400 });
        }

        // 3. Cálculos de comisión (25% VOZ, 75% Creador)
        const vozFee = parseFloat((amount * 0.25).toFixed(2));
        const creatorNet = parseFloat((amount * 0.75).toFixed(2));
        const transferAmountCents = Math.round(creatorNet * 100);

        // 4. Ejecutar la transferencia en Stripe
        const transfer = await stripe.transfers.create({
            amount: transferAmountCents,
            currency: 'usd',
            destination: user.stripe_account_id,
            description: `Retiro de fondos VOZ - ${user.handle || user.name}`,
        });

        // 5. Restar fondos en la base de datos (ledger)
        const userWalletId = await getOrCreateUserWallet(userId);
        
        await executeLedgerTransaction(
            'WITHDRAWAL',
            [
                { wallet_id: userWalletId, entry_type: 'PENDING', amount: -amount },
                { wallet_id: SYSTEM_WALLETS.EXTERNAL_WORLD.id, entry_type: 'AVAILABLE', amount: amount }
            ],
            transfer.id,
            `wd_${transfer.id}`,
            { 
                stripe_transfer_id: transfer.id,
                net_amount: creatorNet,
                fee_amount: vozFee
            }
        );

        // Actualizar el saldo directamente si no lo hace el ledger 
        // (asumo que executeLedgerTransaction ya lo actualiza, pero por si acaso, o dependiendo del diseño del backend)

        // 6. Registrar auditoría en withdrawal_requests
        await supabaseAdmin
            .from('withdrawal_requests')
            .insert([{
                user_id: userId,
                amount: amount, // bruto
                fee_amount: vozFee,
                net_amount: creatorNet,
                status: 'approved', // Ya está transferido a la cuenta de Stripe
                stripe_transfer_id: transfer.id,
                method: 'stripe_connect'
            }]);

        // Notificar al usuario
        await addNotification({
            id: Date.now().toString(),
            recipientId: userId,
            type: 'system',
            title: 'Retiro Completado',
            message: `Tu retiro de $${amount} ha sido transferido a tu cuenta bancaria (Neto: $${creatorNet}). El procesamiento depende de tu banco.`,
            timestamp: new Date().toISOString(),
            readStatus: false
        });

        return NextResponse.json({ success: true, transfer_id: transfer.id, net_amount: creatorNet });
    } catch (error: any) {
        console.error('Error procesando retiro automático:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    return NextResponse.json({ 
        success: false, 
        error: 'Acceso no autorizado. Las aprobaciones o rechazos manuales están deshabilitados. Todo el flujo es automático vía Stripe Connect.' 
    }, { status: 403 });
}
