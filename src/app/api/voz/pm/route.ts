import { NextResponse } from 'next/server';
import { getAppUsers, updateAppUser, addTransaction } from '@/lib/db';
import { supabaseAdmin } from '@/lib/db';

// POST /api/voz/pm
// Permite iniciar un PM (Escrow) o responder a un PM existente
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action } = body;

        if (action === 'start') {
            const { senderHandle, creatorHandle, amount } = body;

            if (!senderHandle || !creatorHandle || !amount) {
                return NextResponse.json({ error: 'Faltan campos (senderHandle, creatorHandle, amount)' }, { status: 400 });
            }

            const users = await getAppUsers();
            const sender = users.find(u => u.handle === senderHandle);

            if (!sender || (sender.walletBalance || 0) < amount) {
                return NextResponse.json({ error: 'Saldo insuficiente' }, { status: 400 });
            }

            // 1. Descontar 100% al sender
            await updateAppUser(sender.id, {
                walletBalance: (sender.walletBalance || 0) - amount
            });

            // 2. Registrar en Escrow (pm_escrows)
            const { data, error } = await supabaseAdmin
                .from('pm_escrows')
                .insert([{
                    sender_handle: senderHandle,
                    creator_handle: creatorHandle,
                    amount_locked: amount,
                    creator_replies: 0,
                    status: 'locked'
                }])
                .select()
                .single();

            if (error) {
                // If table doesn't exist, fallback to logging
                console.warn('pm_escrows table might not exist. Please create it.', error);
            }

            // Registrar transacción inicial (tipo pm_locked)
            await addTransaction({
                senderHandle: senderHandle,
                receiverHandle: creatorHandle,
                amount: amount,
                type: 'pm_locked'
            });

            return NextResponse.json({ success: true, escrow: data });

        } else if (action === 'reply') {
            const { escrowId, creatorHandle } = body;

            if (!escrowId || !creatorHandle) {
                return NextResponse.json({ error: 'Faltan campos (escrowId, creatorHandle)' }, { status: 400 });
            }

            // Obtener el Escrow actual
            const { data: escrow, error: fetchError } = await supabaseAdmin
                .from('pm_escrows')
                .select('*')
                .eq('id', escrowId)
                .single();

            if (fetchError || !escrow) {
                return NextResponse.json({ error: 'Escrow no encontrado' }, { status: 404 });
            }

            if (escrow.status === 'completed') {
                return NextResponse.json({ success: true, message: 'Escrow ya estaba completado' });
            }

            // Incrementar respuestas
            const newRepliesCount = escrow.creator_replies + 1;

            if (newRepliesCount >= 50) {
                // Liberar fondos: 3.50 por cada 5.00 (70%) para el creador, el resto para la app
                const payoutAmount = Number(escrow.amount_locked) * 0.7;

                const users = await getAppUsers();
                const receiver = users.find(u => u.handle === creatorHandle);

                if (receiver) {
                    await updateAppUser(receiver.id, {
                        walletBalance: (receiver.walletBalance || 0) + payoutAmount
                    });
                }

                // Actualizar estado del Escrow
                await supabaseAdmin
                    .from('pm_escrows')
                    .update({ creator_replies: newRepliesCount, status: 'completed' })
                    .eq('id', escrowId);

                // Registrar transacción completada
                await addTransaction({
                    senderHandle: escrow.sender_handle,
                    receiverHandle: creatorHandle,
                    amount: payoutAmount,
                    type: 'pm_completed'
                });

                return NextResponse.json({ success: true, unlocked: true, payoutText: `Liberados ${payoutAmount} al creador` });
            } else {
                // Solo actualizar el contador
                await supabaseAdmin
                    .from('pm_escrows')
                    .update({ creator_replies: newRepliesCount })
                    .eq('id', escrowId);

                return NextResponse.json({ success: true, unlocked: false, repliesCount: newRepliesCount });
            }

        } else {
            return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
        }

    } catch (error) {
        console.error('Error procesando PM:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
