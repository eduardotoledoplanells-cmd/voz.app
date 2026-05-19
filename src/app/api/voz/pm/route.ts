import { NextResponse } from 'next/server';
import { getAppUsers, updateAppUser, addTransaction, addNotification } from '@/lib/db';
import { supabaseAdmin } from '@/lib/db';

// POST /api/voz/pm
// Permite iniciar un PM (Escrow) o responder a un PM existente
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action } = body;
        const PM_COST = 5; // Coste fijo por mensaje/inicio
        const CREATOR_SHARE = 0.7; // 70% para el creador (3.50 monedas)

        if (action === 'start') {
            const { senderHandle, creatorHandle } = body;

            if (!senderHandle || !creatorHandle) {
                return NextResponse.json({ error: 'Faltan campos (senderHandle, creatorHandle)' }, { status: 400 });
            }

            const users = await getAppUsers();
            const sender = users.find(u => u.handle === senderHandle);
            const creator = users.find(u => u.handle === creatorHandle);

            if (!sender || (sender.walletBalance || 0) < PM_COST) {
                return NextResponse.json({ error: 'Saldo insuficiente (Necesitas 5 monedas)' }, { status: 400 });
            }

            // 1. Descontar 5 monedas al usuario
            await updateAppUser(sender.id, {
                walletBalance: (sender.walletBalance || 0) - PM_COST
            });

            // 1.5. Pagar el 70% al creador de forma inmediata
            if (creator) {
                const payoutAmount = PM_COST * CREATOR_SHARE;
                await updateAppUser(creator.id, {
                    earningsBalance: (creator.earningsBalance || 0) + payoutAmount
                });
            }

            // 2. Crear o buscar chat activo (pm_escrows)
            const { data: existingEscrow } = await supabaseAdmin
                .from('pm_escrows')
                .select('*')
                .eq('sender_handle', senderHandle)
                .eq('creator_handle', creatorHandle)
                .eq('status', 'completed')
                .single();

            let escrowId;
            if (existingEscrow) {
                escrowId = existingEscrow.id;
            } else {
                const { data: newEscrow, error } = await supabaseAdmin
                    .from('pm_escrows')
                    .insert([{
                        sender_handle: senderHandle,
                        creator_handle: creatorHandle,
                        amount_locked: PM_COST,
                        creator_replies: 0,
                        status: 'completed' // Ya se pagó la comisión
                    }])
                    .select()
                    .single();
                if (error) throw error;
                escrowId = newEscrow.id;
            }

            // 3. Guardar el mensaje inicial para empezar el hilo
            await supabaseAdmin.from('pm_messages').insert([{
                escrow_id: escrowId,
                sender_handle: senderHandle,
                content: body.message || "Hola, ¿podemos hablar?"
            }]);

            // Enviar notificación al creador
            await addNotification({
                id: Date.now().toString(),
                recipientId: creatorHandle,
                type: 'pm',
                title: 'Nuevo Chat Privado 💬',
                message: `${senderHandle} ha iniciado un chat privado contigo.`,
                timestamp: new Date().toISOString(),
                readStatus: false
            });

            // Registrar transacción
            await addTransaction({
                senderHandle: senderHandle,
                receiverHandle: creatorHandle,
                amount: PM_COST,
                type: 'pm_locked' // O pm_started
            });

            return NextResponse.json({ success: true, escrowId });

        } else if (action === 'reply') {
            const { escrowId, senderHandle, content } = body;

            if (!escrowId || !senderHandle || !content) {
                return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
            }

            // Fetch escrow to know who should receive the notification
            const { data: escrow } = await supabaseAdmin.from('pm_escrows').select('*').eq('id', escrowId).single();

            // Guardar el nuevo mensaje
            await supabaseAdmin.from('pm_messages').insert([{
                escrow_id: escrowId,
                sender_handle: senderHandle,
                content: content
            }]);

            // Enviar notificación al receptor
            if (escrow) {
                const recipientHandle = senderHandle === escrow.sender_handle ? escrow.creator_handle : escrow.sender_handle;
                await addNotification({
                    id: Date.now().toString(),
                    recipientId: recipientHandle,
                    type: 'pm',
                    title: 'Nuevo Mensaje 💬',
                    message: `Tienes un nuevo mensaje de ${senderHandle}`,
                    timestamp: new Date().toISOString(),
                    readStatus: false
                });
            }

            return NextResponse.json({ success: true, message: 'Mensaje enviado' });
        } else {
            return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
        }
    } catch (error) {
        console.error('Error en PM POST:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// GET /api/voz/pm?escrowId=...
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const escrowId = searchParams.get('escrowId');
        const userHandle = searchParams.get('userHandle');

        if (escrowId) {
            // Obtener mensajes de un chat específico
            const { data: messages, error } = await supabaseAdmin
                .from('pm_messages')
                .select('*')
                .eq('escrow_id', escrowId)
                .order('created_at', { ascending: true });
            
            if (error) throw error;
            return NextResponse.json(messages);
        } else if (userHandle) {
            // Obtener lista de conversaciones (escrows) de un usuario
            const { data: escrows, error } = await supabaseAdmin
                .from('pm_escrows')
                .select('*')
                .or(`sender_handle.eq.${userHandle},creator_handle.eq.${userHandle}`)
                .order('updated_at', { ascending: false });

            if (error) throw error;

            if (escrows && escrows.length > 0) {
                const uniqueHandles = Array.from(new Set(
                    escrows.flatMap(e => [e.sender_handle, e.creator_handle])
                ));
                const { data: usersData } = await supabaseAdmin
                    .from('app_users')
                    .select('handle, name, profile_image')
                    .in('handle', uniqueHandles);
                
                const userMap = new Map();
                usersData?.forEach(u => {
                    userMap.set(u.handle, {
                        name: u.name || u.handle.replace('@', ''),
                        profileImage: u.profile_image
                    });
                });

                const enrichedEscrows = escrows.map(e => {
                    const senderDetails = userMap.get(e.sender_handle) || { name: e.sender_handle.replace('@', ''), profileImage: null };
                    const creatorDetails = userMap.get(e.creator_handle) || { name: e.creator_handle.replace('@', ''), profileImage: null };
                    return {
                        ...e,
                        sender_name: senderDetails.name,
                        sender_avatar: senderDetails.profileImage,
                        creator_name: creatorDetails.name,
                        creator_avatar: creatorDetails.profileImage
                    };
                });

                return NextResponse.json(enrichedEscrows);
            }

            return NextResponse.json(escrows);
        }

        return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    } catch (error) {
        console.error('Error recuperando PMs:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
