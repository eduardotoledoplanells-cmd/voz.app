import { NextResponse } from 'next/server';
import { supabaseAdmin, addNotification } from '@/lib/db';
import { executeLedgerTransaction, getOrCreateUserWallet, SYSTEM_WALLETS } from '@/lib/ledger';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';

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

// Retiro automático robusto usando Stripe Connect y Billetera de Custodia
export async function POST(request: Request) {
    let requestRow: any = null;
    let userId: string = '';
    let amount: number = 0;
    let userWalletId: string = '';
    let amountMicro: number = 0;
    let vozFee: number = 0;
    let creatorNet: number = 0;

    try {
        const body = await request.json();
        userId = request.headers.get('x-user-id') || '';
        amount = body.amount;

        if (!userId || !amount || amount <= 0) {
            return NextResponse.json({ success: false, error: 'Parámetros inválidos' }, { status: 400 });
        }

        // 1. Obtener datos del creador
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

        // 2. Cálculos de comisión (25% VOZ, 75% Creador)
        vozFee = parseFloat((amount * 0.25).toFixed(2));
        creatorNet = parseFloat((amount * 0.75).toFixed(2));
        const transferAmountCents = Math.round(creatorNet * 100);
        amountMicro = Math.round(amount * 1000);

        // PASO A: Registrar la intención en 'withdrawal_requests' como 'processing' para obtener el UUID
        const { data: insertedRow, error: insertError } = await supabaseAdmin
            .from('withdrawal_requests')
            .insert([{
                user_id: userId,
                user_handle: user.handle,
                amount: amount,
                fee_amount: vozFee,
                net_amount: creatorNet,
                status: 'processing',
                method: 'stripe_connect'
            }])
            .select('*')
            .single();

        if (insertError || !insertedRow) {
            console.error('Error al registrar intención de retiro:', insertError);
            return NextResponse.json({ success: false, error: 'No se pudo iniciar la transacción de retiro' }, { status: 500 });
        }

        requestRow = insertedRow;
        userWalletId = await getOrCreateUserWallet(userId);

        // PASO B: Reservar saldo contable en el Ledger (User Wallet -> WITHDRAWALS_PENDING)
        // La fuente de verdad del saldo es el Ledger. Si no hay saldo suficiente, executeLedgerTransaction lanzará un error.
        try {
            await executeLedgerTransaction(
                'WITHDRAWAL_RESERVE',
                [
                    { wallet_id: userWalletId, entry_type: 'PENDING', amount: -amountMicro },
                    { wallet_id: SYSTEM_WALLETS.WITHDRAWALS_PENDING.id, entry_type: 'AVAILABLE', amount: amountMicro }
                ],
                requestRow.id,
                `reserve_${requestRow.id}`,
                { withdrawal_id: requestRow.id }
            );
        } catch (ledgerError: any) {
            console.error('Reserva contable fallida. Abortando retiro:', ledgerError);
            
            // Actualizar la solicitud a failed
            await supabaseAdmin
                .from('withdrawal_requests')
                .update({ 
                    status: 'failed',
                    details: { error: 'Saldo de cartera insuficiente en Ledger' }
                })
                .eq('id', requestRow.id);

            return NextResponse.json({ success: false, error: 'Saldo insuficiente en tu cartera contable' }, { status: 400 });
        }

        // PASO C: Transicionar a 'stripe_submitted' justo antes de llamar a Stripe
        await supabaseAdmin
            .from('withdrawal_requests')
            .update({ status: 'stripe_submitted' })
            .eq('id', requestRow.id);

        // Opciones de llamada a Stripe incluyendo la clave de idempotencia
        const stripeOptions = {
            idempotencyKey: requestRow.id
        };

        // PASO D: Llamar a la API de Stripe Connect
        let transfer: Stripe.Transfer;
        try {
            transfer = await stripe.transfers.create({
                amount: transferAmountCents,
                currency: 'usd',
                destination: user.stripe_account_id,
                description: `Retiro de fondos VOZ - ${user.handle || user.name}`,
                metadata: {
                    withdrawal_id: requestRow.id
                }
            }, stripeOptions);
        } catch (stripeError: any) {
            console.error('Error al transferir fondos en Stripe. Iniciando compensación contable:', stripeError);
            
            // COMPENSACIÓN: Devolver los fondos reservados del monedero de custodia al saldo del usuario
            try {
                await executeLedgerTransaction(
                    'WITHDRAWAL_REVERSE',
                    [
                        { wallet_id: SYSTEM_WALLETS.WITHDRAWALS_PENDING.id, entry_type: 'AVAILABLE', amount: -amountMicro },
                        { wallet_id: userWalletId, entry_type: 'PENDING', amount: amountMicro }
                    ],
                    requestRow.id,
                    `reverse_${requestRow.id}`,
                    { error: stripeError.message }
                );
            } catch (reverseError: any) {
                console.error('ERROR CRÍTICO: Falló la compensación contable tras error de Stripe:', reverseError);
            }

            // Actualizar la solicitud a failed
            await supabaseAdmin
                .from('withdrawal_requests')
                .update({ 
                    status: 'failed',
                    details: { 
                        error: stripeError.message,
                        stripe_error_code: stripeError.code || null
                    }
                })
                .eq('id', requestRow.id);

            return NextResponse.json({ success: false, error: `Error en la pasarela bancaria: ${stripeError.message}` }, { status: 502 });
        }

        // Para simulación del test de caídas extremas:
        if (body.simulateCrashAfterStripe) {
            console.log('⚠️ SIMULACIÓN: Servidor cae justo después del éxito de Stripe Connect...');
            throw new Error('Simulated server crash after successful Stripe transfer');
        }

        // PASO E: Confirmación Contable y Cierre (WITHDRAWALS_PENDING -> EXTERNAL_WORLD)
        await executeLedgerTransaction(
            'WITHDRAWAL_CONFIRM',
            [
                { wallet_id: SYSTEM_WALLETS.WITHDRAWALS_PENDING.id, entry_type: 'AVAILABLE', amount: -amountMicro },
                { wallet_id: SYSTEM_WALLETS.EXTERNAL_WORLD.id, entry_type: 'AVAILABLE', amount: amountMicro }
            ],
            requestRow.id,
            `confirm_${requestRow.id}`,
            { stripe_transfer_id: transfer.id }
        );

        // PASO F: Marcar la solicitud como 'approved'
        const stripeRequestId = (transfer as any).lastResponse?.headers?.get('request-id') || null;
        await supabaseAdmin
            .from('withdrawal_requests')
            .update({
                status: 'approved',
                stripe_transfer_id: transfer.id,
                details: {
                    stripe_transfer_id: transfer.id,
                    net_amount: creatorNet,
                    fee_amount: vozFee,
                    stripe_request_id: stripeRequestId
                }
            })
            .eq('id', requestRow.id);

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
        console.error('Error general procesando retiro automático:', error);
        
        // Si el servidor cae de forma imprevista y no es una simulación de caída controlada, reportamos la alerta.
        // Si ya registramos la solicitud y quedó atascada en 'stripe_submitted', no hacemos compensación automática ciega aquí,
        // ya que Stripe podría haber procesado el pago. Dejamos que el Cron de Conciliación lo resuelva de forma segura.
        
        return NextResponse.json({ 
            success: false, 
            error: error.message || 'Error interno del servidor',
            withdrawal_id: requestRow ? requestRow.id : null 
        }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    return NextResponse.json({ 
        success: false, 
        error: 'Acceso no autorizado. Las aprobaciones o rechazos manuales están deshabilitados. Todo el flujo es automático vía Stripe Connect.' 
    }, { status: 403 });
}
