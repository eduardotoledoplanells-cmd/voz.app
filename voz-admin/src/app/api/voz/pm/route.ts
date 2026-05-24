import { NextResponse } from 'next/server';
import { supabaseAdmin, getAppUsers } from '@/lib/db';
import { executeLedgerTransaction, getOrCreateUserWallet } from '@/lib/ledger';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userHandle = searchParams.get('userHandle');
    const escrowId = searchParams.get('escrowId');

    if (escrowId) {
        // Cargar historial de mensajes de un chat específico
        const { data, error } = await supabaseAdmin
            .from('pm_messages')
            .select('*')
            .eq('escrow_id', escrowId)
            .order('created_at', { ascending: true });

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }
        return NextResponse.json(data);
    }

    if (userHandle) {
        // Cargar lista de conversaciones (escrows) para el Inbox
        const { data: escrows, error } = await supabaseAdmin
            .from('pm_escrows')
            .select('*')
            .or(`sender_handle.eq.${userHandle},creator_handle.eq.${userHandle}`)
            .order('updated_at', { ascending: false });

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }
        return NextResponse.json(escrows);
    }

    return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action, senderHandle, creatorHandle, escrowId, content, message, idempotencyKey } = body;
        const finalContent = content || message;

        if (!senderHandle || !finalContent) {
            return NextResponse.json({ success: false, error: 'Faltan campos obligatorios' }, { status: 400 });
        }

        // 1. Determinar quién es el receptor para comprobar su privacidad
        let targetHandle = creatorHandle;
        if (action === 'reply' && escrowId && !targetHandle) {
            const { data: escrow } = await supabaseAdmin.from('pm_escrows').select('*').eq('id', escrowId).single();
            if (escrow) {
                targetHandle = escrow.sender_handle === senderHandle ? escrow.creator_handle : escrow.sender_handle;
            }
        }

        // 2. Comprobar bloqueo de privacidad (receive_pms)
        if (targetHandle) {
            const users = await getAppUsers();
            const targetUser = users.find(u => u.handle === targetHandle);
            
            if (targetUser && targetUser.paymentInfo) {
                let pInfo = targetUser.paymentInfo;
                if (typeof pInfo === 'string') {
                    try { pInfo = JSON.parse(pInfo); } catch (e) {}
                }
                
                if (pInfo?.privacySettings?.receive_pms === false) {
                    return NextResponse.json({ success: false, error: 'El usuario no acepta mensajes privados' }, { status: 400 });
                }
            }
        }

        // 3. Lógica para iniciar un nuevo chat (Cobro de 5 monedas)
        if (action === 'start') {
            if (!creatorHandle) return NextResponse.json({ success: false, error: 'Falta creatorHandle' }, { status: 400 });

            try {
                const senderWalletId = await getOrCreateUserWallet(senderHandle);
                const creatorWalletId = await getOrCreateUserWallet(creatorHandle);

                await executeLedgerTransaction(
                    'PM_PAYMENT',
                    [
                        { wallet_id: senderWalletId, entry_type: 'AVAILABLE', amount: -5 },
                        { wallet_id: creatorWalletId, entry_type: 'AVAILABLE', amount: 5 }
                    ],
                    null,
                    idempotencyKey ? `payment-${idempotencyKey}` : null,
                    { description: `PM Init from ${senderHandle} to ${creatorHandle}` }
                );
            } catch (err: any) {
                // Si el error NO es de idempotencia (doble cobro evitado), rechazamos por falta de fondos
                if (!err.message?.includes('idempotency')) {
                    return NextResponse.json({ success: false, error: 'Saldo insuficiente o error de pago' }, { status: 400 });
                }
            }

            // Upsert del escrow por si ya existía (protección extra)
            const { data: escrow, error: escrowError } = await supabaseAdmin
                .from('pm_escrows')
                .upsert([{
                    sender_handle: senderHandle,
                    creator_handle: creatorHandle,
                    sender_name: senderHandle,
                    creator_name: creatorHandle,
                    status: 'active',
                    hasnew: true,
                    unread_count: 1,
                    updated_at: new Date().toISOString()
                }], { onConflict: 'sender_handle,creator_handle' })
                .select()
                .single();

            if (escrowError) return NextResponse.json({ success: false, error: escrowError.message }, { status: 500 });

            // Insertar el mensaje
            const { error: msgError } = await supabaseAdmin
                .from('pm_messages')
                .insert([{
                    escrow_id: escrow.id,
                    sender_handle: senderHandle,
                    content: finalContent,
                    idempotency_key: idempotencyKey || null
                }]);

            if (msgError && msgError.code !== '23505') {
                return NextResponse.json({ success: false, error: msgError.message }, { status: 500 });
            }

            return NextResponse.json({ success: true, escrowId: escrow.id });
        }

        // 4. Lógica para responder en un chat existente (Gratis)
        if (action === 'reply') {
            if (!escrowId) return NextResponse.json({ success: false, error: 'Falta escrowId' }, { status: 400 });

            const { error: msgError } = await supabaseAdmin
                .from('pm_messages')
                .insert([{
                    escrow_id: escrowId,
                    sender_handle: senderHandle,
                    content: finalContent,
                    idempotency_key: idempotencyKey || null
                }]);

            if (msgError && msgError.code !== '23505') {
                return NextResponse.json({ success: false, error: msgError.message }, { status: 500 });
            }

            // Actualizar la fecha del escrow para que suba al principio del Inbox
            await supabaseAdmin
                .from('pm_escrows')
                .update({ 
                    updated_at: new Date().toISOString(),
                    hasnew: true
                })
                .eq('id', escrowId);

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, error: 'Acción inválida' }, { status: 400 });

    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
