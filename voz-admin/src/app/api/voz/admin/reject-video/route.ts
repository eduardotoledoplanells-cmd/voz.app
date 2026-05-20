import { NextResponse } from 'next/server';
import { validateEmployee } from '@/lib/auth';
import { 
    updateModerationItem, 
    addLog, 
    addPenaltyToUser, 
    addProductivityLog, 
    banAppUserByHandle, 
    supabaseAdmin, 
    deleteVideoByUrl, 
    addNotification 
} from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        // Validate employee authentication (requires at least Moderator role = 0)
        const auth = await validateEmployee(request, 0);
        if (!auth.isValid) {
            return NextResponse.json({ success: false, error: auth.errorText }, { status: auth.errorStatus });
        }

        const body = await request.json();
        const { id, status, cycleVideos, totalVideos, skipPenalty } = body;

        if (!id || !status) {
            return NextResponse.json({ success: false, error: 'Faltan parámetros obligatorios (id o status).' }, { status: 400 });
        }

        if (status !== 'approved' && status !== 'rejected') {
            return NextResponse.json({ success: false, error: 'El estado debe ser approved o rejected.' }, { status: 400 });
        }

        const employeeName = `[${auth.employee?.worker_number || '???'}] ${auth.employee?.username}`;

        // 1. Update the moderation item
        const updated = await updateModerationItem(id, {
            status,
            moderatedBy: employeeName
        });

        if (!updated) {
            return NextResponse.json({ success: false, error: 'Item de moderación no encontrado.' }, { status: 404 });
        }

        // 2. If rejected, delete/restrict the content
        if (status === 'rejected') {
            if (updated.type === 'profile') {
                // Ban user directly
                await banAppUserByHandle(updated.userHandle);
            } else {
                if (updated.type === 'video') {
                    // Delete video from DB & Storage
                    await deleteVideoByUrl(updated.url, updated.userHandle);
                } else if (updated.type === 'audio') {
                    // Delete comments from DB
                    if (updated.id) {
                         await supabaseAdmin.from('voice_comments').delete().eq('id', updated.content || '');
                    }
                    await supabaseAdmin.from('voice_comments').delete().ilike('audio_url', updated.url);
                }

                if (!skipPenalty) {
                    // Standard penalty increases user strikes
                    await addPenaltyToUser(updated.userHandle, {
                        url: updated.url,
                        reason: updated.reportReason || 'Contenido inapropiado'
                    });
                }

                // Send notification & push
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

                    const { data: userData } = await supabaseAdmin
                        .from('app_users')
                        .select('push_token')
                        .eq('handle', updated.userHandle)
                        .single();

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
                } catch (notifErr) {
                    console.warn("Failed to send moderation notification:", notifErr);
                }
            }
        }

        // 3. Log action
        await addLog({
            id: Date.now().toString(),
            employeeName,
            action: `${status.toUpperCase()} MODERACIÓN`,
            timestamp: new Date().toISOString(),
            details: `ID del Item: ${id} (${updated.type})`
        });

        // 4. Log productivity metrics
        if (cycleVideos !== undefined && totalVideos !== undefined) {
            await addProductivityLog(employeeName, cycleVideos, totalVideos);
        }

        return NextResponse.json({ success: true, item: updated });

    } catch (e: any) {
        console.error('API reject-video error:', e);
        return NextResponse.json({ success: false, error: e.message || 'Error interno al moderar contenido.' }, { status: 500 });
    }
}
