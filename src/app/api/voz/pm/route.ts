import { NextResponse } from 'next/server';
import { getUserByHandle, getUserById, addTransaction, addNotification } from '@/lib/db';
import { supabaseAdmin } from '@/lib/db';
import { processPremiumMessage } from '@/lib/ledger';
import { logSystemAlert } from '@/lib/alerts';

async function checkImageSafety(content: string): Promise<{ safe: boolean; reason?: string }> {
    // Buscar si el contenido contiene etiquetas de imagen globalmente: [IMAGE: url]
    const matches = [...content.matchAll(/\[IMAGE:\s*(https?:\/\/[^\]\s]+)\]/gi)];
    if (matches.length === 0) {
        return { safe: true };
    }

    const imageUrls = matches.map(m => m[1]);
    console.log(`[Safety Filter] Analizando ${imageUrls.length} imágenes:`, imageUrls);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.warn("[Safety Filter] OPENAI_API_KEY no configurado. Permitiendo imágenes por defecto.");
        return { safe: true };
    }

    try {
        // Ejecutar el análisis de seguridad para todas las imágenes en paralelo
        const results = await Promise.all(
            imageUrls.map(async (imageUrl) => {
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o-mini',
                        messages: [
                            {
                                role: 'user',
                                content: [
                                    {
                                        type: 'text',
                                        text: 'Analyze this image. Does it contain nudity, sexually explicit content, pornography, violence, or child exploitation? Answer strictly with either "SAFE" or "UNSAFE" and nothing else.'
                                    },
                                    {
                                        type: 'image_url',
                                        image_url: {
                                            url: imageUrl
                                        }
                                    }
                                ]
                            }
                        ],
                        max_tokens: 5,
                        temperature: 0.0
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`[Safety Filter] Error de la API de OpenAI para ${imageUrl}: ${errorText}`);
                    return { safe: false, reason: 'El contenido infringe las políticas de seguridad y protección de menores.' };
                }

                const data = await response.json();
                const result = data.choices?.[0]?.message?.content?.trim()?.toUpperCase() || 'UNSAFE';
                console.log(`[Safety Filter] Resultado del análisis para ${imageUrl}: ${result}`);

                if (result === 'UNSAFE') {
                    return { safe: false, reason: 'Imagen bloqueada: Detectado contenido no permitido (desnudez, violencia o material inapropiado).' };
                }

                return { safe: true };
            })
        );

        // Si alguna imagen no es segura, fallamos inmediatamente
        const unsafeResult = results.find(r => !r.safe);
        if (unsafeResult) {
            return unsafeResult;
        }

        return { safe: true };
    } catch (err) {
        console.error('[Safety Filter] Excepción durante el análisis de imagen:', err);
        // Fail-closed por seguridad en el canal de mensajes privados
        return { safe: false, reason: 'Error en la verificación de seguridad de la imagen.' };
    }
}

// POST /api/voz/pm
// Permite iniciar un PM (Escrow) o responder a un PM existente
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action } = body;
        const PM_COST = 5; // Coste fijo por mensaje/inicio
        const CREATOR_SHARE = 0.6; // 60% para el creador (3.00 monedas)

        const userId = request.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const sender = await getUserById(userId);
        if (!sender) {
            return NextResponse.json({ error: 'Usuario autenticado no encontrado' }, { status: 404 });
        }

        // 0. Filtro de seguridad de imágenes (porno/infantil/violencia) mediante IA
        const textToCheck = action === 'start' ? (body.message || '') : (body.content || '');
        if (textToCheck) {
            const safety = await checkImageSafety(textToCheck);
            if (!safety.safe) {
                return NextResponse.json({ error: safety.reason }, { status: 400 });
            }
        }

        if (action === 'start') {
            const { creatorHandle } = body;

            if (!creatorHandle) {
                return NextResponse.json({ error: 'Faltan campos (creatorHandle)' }, { status: 400 });
            }

            const creator = await getUserByHandle(creatorHandle);

            if (!creator) {
                return NextResponse.json({ error: 'Creador no encontrado' }, { status: 404 });
            }

            if (creator.privacySettings?.receive_pms === false) {
                return NextResponse.json({ error: 'Este usuario ha desactivado los mensajes privados.' }, { status: 400 });
            }

            // 1. Process premium message via Ledger Contabilidad
            const idempotencyKey = body.idempotencyKey;
            if (!idempotencyKey || typeof idempotencyKey !== 'string' || idempotencyKey.length < 10) {
                return NextResponse.json({ error: 'Se requiere un idempotencyKey UUID único del cliente para procesar la transacción.' }, { status: 400 });
            }
            try {
                await processPremiumMessage(sender.id, creator.id, idempotencyKey);
            } catch (ledgerError: any) {
                console.error("Ledger PM transaction failed:", ledgerError);
                await logSystemAlert({
                    servicio: 'PM Ledger (Start)',
                    nivel: 'warning',
                    error: ledgerError,
                    usuario: sender.handle,
                    metadata: { creator: creator.handle }
                });
                return NextResponse.json({ error: ledgerError.message || 'Saldo insuficiente' }, { status: 400 });
            }
            
            const { data: existingEscrow } = await supabaseAdmin
                .from('pm_escrows')
                .select('*')
                .eq('sender_handle', sender.handle)
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
                        sender_handle: sender.handle,
                        creator_handle: creatorHandle,
                        locked_amount: PM_COST,
                        creator_responses: 0,
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
                sender_handle: sender.handle,
                content: body.message || "Hola, ¿podemos hablar?"
            }]);

            // Enviar notificación al creador
            await addNotification({
                id: Date.now().toString(),
                recipientId: creatorHandle,
                type: 'pm',
                title: 'Nuevo Chat Privado 💬',
                message: `${sender.handle} ha iniciado un chat privado contigo.`,
                timestamp: new Date().toISOString(),
                readStatus: false
            });

            // Registrar transacción
            await addTransaction({
                senderHandle: sender.handle,
                receiverHandle: creatorHandle,
                amount: PM_COST,
                type: 'pm_locked'
            });

            return NextResponse.json({ success: true, escrowId });

        } else if (action === 'reply') {
            const { escrowId, content, renew } = body;

            if (!escrowId || !content) {
                return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
            }

            // Fetch escrow to verify ownership
            const { data: escrow } = await supabaseAdmin.from('pm_escrows').select('*').eq('id', escrowId).single();
            if (!escrow) {
                return NextResponse.json({ error: 'Chat no encontrado' }, { status: 404 });
            }

            // SEGURIDAD: Validar que el usuario autenticado es parte de esta conversación
            if (sender.handle !== escrow.sender_handle && sender.handle !== escrow.creator_handle) {
                return NextResponse.json({ error: 'No autorizado para acceder a este chat' }, { status: 403 });
            }

            // Contar mensajes para verificar límite de 50 mensajes por bloque pagado
            const { count: messageCount } = await supabaseAdmin
                .from('pm_messages')
                .select('*', { count: 'exact', head: true })
                .eq('escrow_id', escrowId);

            const paidBlocks = Math.max(1, Math.floor((escrow.locked_amount || PM_COST) / PM_COST));
            const maxAllowedMessages = paidBlocks * 50;

            if (messageCount !== null && messageCount >= maxAllowedMessages) {
                if (renew === true) {
                    const idempotencyKey = body.idempotencyKey;
                    if (!idempotencyKey || typeof idempotencyKey !== 'string' || idempotencyKey.length < 10) {
                        return NextResponse.json({ error: 'Se requiere un idempotencyKey para renovar el chat.' }, { status: 400 });
                    }
                    try {
                        // El receptor del pago siempre es el creador (creator_handle)
                        const creatorHandleForPayment = escrow.creator_handle;
                        const creator = await getUserByHandle(creatorHandleForPayment);
                        if (!creator) throw new Error("Creador no encontrado");

                        await processPremiumMessage(sender.id, creator.id, idempotencyKey);
                        
                        // Incrementar el monto bloqueado/pagado
                        await supabaseAdmin.from('pm_escrows').update({
                            locked_amount: (escrow.locked_amount || PM_COST) + PM_COST
                        }).eq('id', escrowId);
                        
                        // Registrar transacción de renovación
                        await addTransaction({
                            senderHandle: sender.handle,
                            receiverHandle: creatorHandleForPayment,
                            amount: PM_COST,
                            type: 'pm_locked_renewal'
                        });

                    } catch (ledgerError: any) {
                        await logSystemAlert({
                            servicio: 'PM Ledger (Renew)',
                            nivel: 'warning',
                            error: ledgerError,
                            usuario: sender.handle,
                            metadata: { creator: escrow.creator_handle }
                        });
                        return NextResponse.json({ error: ledgerError.message || 'Saldo insuficiente para renovar.' }, { status: 402 });
                    }
                } else {
                    return NextResponse.json({ error: 'Límite de 50 mensajes alcanzado. Requiere renovación.', requireRenewal: true }, { status: 403 });
                }
            }

            // Guardar el nuevo mensaje
            await supabaseAdmin.from('pm_messages').insert([{
                escrow_id: escrowId,
                sender_handle: sender.handle,
                content: content
            }]);

            // Enviar notificación al receptor
            const recipientHandle = sender.handle === escrow.sender_handle ? escrow.creator_handle : escrow.sender_handle;
            await addNotification({
                id: Date.now().toString(),
                recipientId: recipientHandle,
                type: 'pm',
                title: 'Nuevo Mensaje 💬',
                message: `Tienes un nuevo mensaje de ${sender.handle}`,
                timestamp: new Date().toISOString(),
                readStatus: false
            });

            return NextResponse.json({ success: true, message: 'Mensaje enviado', escrowId });
        } else {
            return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
        }
    } catch (error) {
        console.error('Error en PM POST:', error);
        await logSystemAlert('PMs', error);
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

            // Si se pasa userHandle, marcamos los mensajes del otro usuario como leídos
            if (userHandle) {
                await supabaseAdmin
                    .from('pm_messages')
                    .update({ is_read: true })
                    .eq('escrow_id', escrowId)
                    .neq('sender_handle', userHandle)
                    .eq('is_read', false);
            }

            return NextResponse.json(messages);
        } else if (userHandle) {
            // Obtener lista de conversaciones (escrows) de un usuario
            const { data: escrows, error } = await supabaseAdmin
                .from('pm_escrows')
                .select('*')
                .or(`sender_handle.eq.${userHandle},creator_handle.eq.${userHandle}`)
                .order('created_at', { ascending: false });

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

                // Obtener mensajes no leídos para cada escrow
                const escrowIds = escrows.map(e => e.id);
                const { data: unreadCounts } = await supabaseAdmin
                    .from('pm_messages')
                    .select('escrow_id')
                    .in('escrow_id', escrowIds)
                    .eq('is_read', false)
                    .neq('sender_handle', userHandle);

                const unreadMap = new Map();
                unreadCounts?.forEach((m: any) => {
                    unreadMap.set(m.escrow_id, (unreadMap.get(m.escrow_id) || 0) + 1);
                });

                const enrichedEscrows = escrows.map(e => {
                    const senderDetails = userMap.get(e.sender_handle) || { name: e.sender_handle.replace('@', ''), profileImage: null };
                    const creatorDetails = userMap.get(e.creator_handle) || { name: e.creator_handle.replace('@', ''), profileImage: null };
                    const unreadCount = unreadMap.get(e.id) || 0;
                    return {
                        ...e,
                        sender_name: senderDetails.name,
                        sender_avatar: senderDetails.profileImage,
                        creator_name: creatorDetails.name,
                        creator_avatar: creatorDetails.profileImage,
                        unread_count: unreadCount,
                        hasNew: unreadCount > 0
                    };
                });

                return NextResponse.json(enrichedEscrows);
            }

            return NextResponse.json(escrows);
        }

        return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    } catch (error) {
        console.error('Error recuperando PMs:', error);
        await logSystemAlert('PMs', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
