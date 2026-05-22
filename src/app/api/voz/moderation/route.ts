import { NextRequest, NextResponse } from "next/server";
import { getModerationQueue, updateModerationItem, addNotification, getVideoIdByUrl } from "@/lib/db";

export async function GET() {
    try {
        const queue = await getModerationQueue();
        return NextResponse.json(queue);
    } catch (error) {
        console.error("Error fetching moderation queue:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST — Legacy handler mantenido para compatibilidad con clientes antiguos
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, action, moderatorHandle } = body;

        if (!id || !action) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const statusMap: { [key: string]: 'pending' | 'approved' | 'rejected' } = {
            'keep': 'approved',
            'delete': 'rejected',
            'ban': 'rejected',
            'shadow_ban': 'pending'
        };

        const result = await updateModerationItem(id, { status: statusMap[action] || 'pending' });

        if (!result) {
            return NextResponse.json({ error: "Item not found" }, { status: 404 });
        }

        console.log(`[Moderation POST] action='${action}' by '${moderatorHandle}' on item '${id}'`);

        return NextResponse.json({ success: true, item: result });

    } catch (error) {
        console.error("Moderation POST error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PATCH — Handler canónico usado por la app y el panel de administración.
// Body esperado: { id: string, status: 'approved'|'rejected'|'pending', employeeName: string }
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, status, employeeName } = body;

        if (!id || !status) {
            return NextResponse.json({ error: "Faltan campos obligatorios (id, status)" }, { status: 400 });
        }

        const validStatuses = ['approved', 'rejected', 'pending'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { error: `Estado inválido '${status}'. Debe ser uno de: ${validStatuses.join(', ')}` },
                { status: 400 }
            );
        }

        // Actualizar el ítem en la base de datos
        const result = await updateModerationItem(id, { status });

        if (!result) {
            return NextResponse.json({ error: "Ítem de moderación no encontrado" }, { status: 404 });
        }

        console.log(`[Moderation PATCH] status='${status}' by '${employeeName || 'unknown'}' on item '${id}'`);

        // Notificar al creador del contenido cuando la resolución es final
        if ((status === 'approved' || status === 'rejected') && result.userHandle) {
            const isApproved = status === 'approved';
            try {
                let notifMessage = isApproved
                    ? 'Tu contenido ha sido revisado y aprobado por el equipo de moderación de VOZ.'
                    : `Tu contenido ha sido eliminado por incumplir las normas de la comunidad VOZ.${employeeName ? ` Moderador: ${employeeName}.` : ''}`;

                if (result.type === 'video' && result.url) {
                    const videoId = await getVideoIdByUrl(result.url);
                    if (videoId) {
                        notifMessage += `|||VIDEO_ID:${videoId}`;
                    }
                }

                await addNotification({
                    id: `mod-${id}-${Date.now()}`,
                    recipientId: result.userHandle,
                    type: 'moderation',
                    title: isApproved ? '✅ Contenido aprobado' : '⛔ Contenido eliminado',
                    message: notifMessage,
                    timestamp: new Date().toISOString(),
                    readStatus: false
                });
            } catch (notifError) {
                // No fallamos la respuesta si la notificación falla — el ítem ya fue actualizado
                console.warn(`[Moderation PATCH] No se pudo enviar notificación a ${result.userHandle}:`, notifError);
            }
        }

        return NextResponse.json({ success: true, item: result });

    } catch (error) {
        console.error("Moderation PATCH error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
