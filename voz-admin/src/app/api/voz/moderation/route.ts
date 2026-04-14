import { NextResponse } from 'next/server';
import { getModerationQueue, updateModerationItem, addModerationItem, addLog, ModerationItem, addPenaltyToUser, addProductivityLog, addInactivityLog, generateMatricula, banAppUserByHandle, supabaseAdmin, deleteVideoByUrl, addNotification } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}

function corsHeaders(response: NextResponse) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
}

export const dynamic = 'force-dynamic';

export async function GET() {
    const queue = (await getModerationQueue()).filter(item => item.status === 'pending');
    return corsHeaders(NextResponse.json(queue));
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { type, url, userHandle, content, reportReason, reportedBy } = body;

        const newItem: ModerationItem = {
            id: uuidv4(),
            matricula: generateMatricula(),
            type: type || 'text',
            url: url || '',
            userHandle: userHandle || 'Anónimo',
            reportedBy: reportedBy || 'Desconocido',
            content: content || '',
            reportReason: reportReason || 'Reportado por usuario',
            timestamp: new Date().toISOString(),
            status: 'pending'
        };

        const result = await addModerationItem(newItem);
        return corsHeaders(NextResponse.json(result));
    } catch (error) {
        return corsHeaders(NextResponse.json({ error: 'Failed to create moderation item' }, { status: 500 }));
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, status, employeeName, cycleVideos, totalVideos, inactivityAlert, skipPenalty } = body;

        if (inactivityAlert && employeeName) {
            await addInactivityLog(employeeName);
            return corsHeaders(NextResponse.json({ success: true, message: 'Inactivity logged' }));
        }

        if (!id || !status) {
            return NextResponse.json({ error: 'Missing ID or status' }, { status: 400 });
        }

        const updated = await updateModerationItem(id, {
            status,
            moderatedBy: employeeName || 'Moderador'
        });

        if (updated) {
            // Si el status es 'rejected'
            if (status === 'rejected') {
                if (updated.type === 'profile') {
                    // Si es un perfil, lo baneamos directamente (ya incluye borrado de sus videos)
                    await banAppUserByHandle(updated.userHandle);
                } else {
                    if (updated.type === 'video') {
                        // Use the robust deleteVideoByUrl which handles both DB and Storage
                        await deleteVideoByUrl(updated.url, updated.userHandle);
                    } else if (updated.type === 'audio') {
                        // Borrar el comentario de voz de la DB
                        if (updated.id) {
                             await supabaseAdmin.from('voice_comments').delete().eq('id', updated.content || '');
                        }
                        await supabaseAdmin.from('voice_comments').delete().ilike('audio_url', updated.url);
                    }

                    if (!skipPenalty) {
                        // Si no se salta la penalización, registrarla y bajar reputación
                        await addPenaltyToUser(updated.userHandle, {
                            url: updated.url,
                            reason: updated.reportReason || 'Contenido inapropiado'
                        });
                    }

                    // Enviar notificacion al usuario
                    if (updated.type === 'video' || updated.type === 'audio') {
                        try {
                            const newNotification = {
                                id: 'nt-' + Date.now(),
                                recipientId: updated.userHandle,
                                type: 'moderation',
                                title: "Contenido Eliminado",
                                message: `Tu ${updated.type === 'video' ? 'vídeo' : 'audio'} ha sido eliminado por: ${updated.reportReason || 'Incumplimiento de normas'}.`,
                                timestamp: new Date().toISOString(),
                                readStatus: false
                            };
                            await addNotification(newNotification);

                            // Send Push manually if pushToken exists
                            const { data: userData } = await supabaseAdmin.from('app_users').select('push_token').eq('handle', updated.userHandle).single();
                            if (userData && userData.push_token) {
                                await fetch('https://exp.host/--/api/v2/push/send', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        to: userData.push_token,
                                        title: newNotification.title,
                                        body: newNotification.message,
                                        data: { type: 'moderation' }
                                    })
                                });
                            }
                        } catch(e) { console.warn("Error enviando notificacion de moderacion", e); }
                    }
                }
            }

            // Log the action
            await addLog({
                id: Date.now().toString(),
                employeeName: employeeName || 'Moderador',
                action: `${status.toUpperCase()} MODERACIÓN`,
                timestamp: new Date().toISOString(),
                details: `Item ID: ${id} (${updated.type})`
            });

            // Log productivity
            if (employeeName && cycleVideos !== undefined && totalVideos !== undefined) {
                await addProductivityLog(employeeName, cycleVideos, totalVideos);
            }

            return corsHeaders(NextResponse.json(updated));
        }

        return corsHeaders(NextResponse.json({ error: 'Item not found' }, { status: 404 }));
    } catch (error) {
        return corsHeaders(NextResponse.json({ error: 'Failed to update moderation item' }, { status: 500 }));
    }
}
