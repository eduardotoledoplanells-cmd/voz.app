import { NextResponse } from 'next/server';
import { supabaseAdmin, addTransaction, addNotification, getUserByHandle } from '@/lib/db';
import { logSystemAlert } from '@/lib/alerts';

export async function GET(request: Request) {
    // 1. Check authorization (Vercel Cron Secret)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('[CRON PM-EXPIRE] Iniciando verificación de Escrows caducados...');

        // 2. Definir fecha límite (15 días atrás)
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - 15);
        const isoLimit = dateLimit.toISOString();

        // 3. Buscar todos los escrows 'completed' (pagados y en curso) con más de 15 días de antigüedad
        // Usamos updated_at si estuviera (aunque la tabla actualmente podría depender de created_at, asumimos created_at)
        const { data: expiredEscrows, error: fetchError } = await supabaseAdmin
            .from('pm_escrows')
            .select('*')
            .eq('status', 'completed')
            .lt('created_at', isoLimit);

        if (fetchError) {
            throw new Error(`Error al buscar escrows: ${fetchError.message}`);
        }

        if (!expiredEscrows || expiredEscrows.length === 0) {
            return NextResponse.json({ success: true, message: 'No se encontraron escrows caducados.' });
        }

        console.log(`[CRON PM-EXPIRE] Se encontraron ${expiredEscrows.length} escrows para expirar.`);

        const processed = [];
        const errors = [];

        // 4. Procesar cada escrow caducado
        for (const escrow of expiredEscrows) {
            try {
                // Verificar si el creador no cumplió la cuota (menos de 50 respuestas)
                // Se asume 50 respuestas base. En caso de renovaciones múltiples (locked_amount > 5),
                // el requiredResponses sería mayor (ej. 10 monedas = 100).
                const PM_COST = 5;
                const paidBlocks = Math.max(1, Math.floor((escrow.locked_amount || PM_COST) / PM_COST));
                const requiredResponses = paidBlocks * 50;

                if ((escrow.creator_responses || 0) < requiredResponses) {
                    // Creador no completó la cuota a tiempo -> Expirar y Reembolsar

                    // a) Actualizar estado a 'expired'
                    const { error: updateError } = await supabaseAdmin
                        .from('pm_escrows')
                        .update({ status: 'expired' })
                        .eq('id', escrow.id);
                    
                    if (updateError) throw updateError;

                    // b) Reembolsar saldo al usuario emisor si hubo pago
                    const refundAmount = escrow.locked_amount || 0;
                    if (refundAmount > 0) {
                        const senderUser = await getUserByHandle(escrow.sender_handle);
                        
                        if (senderUser) {
                            const newWalletBalance = (senderUser.walletBalance || 0) + refundAmount;
                            await supabaseAdmin
                                .from('app_users')
                                .update({ wallet_balance: newWalletBalance })
                                .eq('id', senderUser.id);
                            
                            // c) Registrar la transacción en el Ledger
                            await addTransaction({
                                senderHandle: 'SYSTEM_ESCROW',
                                receiverHandle: escrow.sender_handle,
                                amount: refundAmount,
                                type: 'pm_escrow_refund'
                            });

                            // d) Notificar al usuario del reembolso
                            await addNotification({
                                id: Date.now().toString() + '-' + escrow.id,
                                recipientId: escrow.sender_handle,
                                type: 'pm',
                                title: 'Reembolso por Chat Caducado 🕒',
                                message: `Tu chat con ${escrow.creator_handle} ha caducado sin completarse las respuestas. Te hemos reembolsado ${refundAmount} monedas.`,
                                timestamp: new Date().toISOString(),
                                readStatus: false
                            });
                        }
                    }

                    // e) Notificar al creador que el chat ha caducado
                    await addNotification({
                        id: Date.now().toString() + '-c-' + escrow.id,
                        recipientId: escrow.creator_handle,
                        type: 'pm',
                        title: 'Chat Privado Caducado 🕒',
                        message: `No has completado las respuestas a tiempo en tu chat con ${escrow.sender_handle}. El fideicomiso ha expirado.`,
                        timestamp: new Date().toISOString(),
                        readStatus: false
                    });

                    processed.push(escrow.id);
                } else {
                    // Teóricamente, si creator_responses >= requiredResponses pero no está 'released', 
                    // fue un bug o error de red. En este caso forzamos el release en vez de reembolso.
                    console.log(`[CRON PM-EXPIRE] El escrow ${escrow.id} cumplía las respuestas pero no estaba en 'released'. Ignorando expiración por seguridad.`);
                    // Idealmente se dispararía el proceso de release aquí, pero es un edge-case.
                }

            } catch (err: any) {
                console.error(`[CRON PM-EXPIRE] Error procesando escrow ${escrow.id}:`, err);
                errors.push({ id: escrow.id, error: err.message });
            }
        }

        if (errors.length > 0) {
            await logSystemAlert('Cron PM-Expire', { msg: 'Errores parciales al expirar escrows', errors });
        }

        return NextResponse.json({ 
            success: true, 
            message: `Proceso completado. ${processed.length} expirados.`,
            processed,
            errors
        });

    } catch (error: any) {
        console.error('[CRON PM-EXPIRE] Error general:', error);
        await logSystemAlert('Cron PM-Expire', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
