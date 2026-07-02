import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { videoId, userHandle, commentsEnabled } = body;

        if (!videoId || !userHandle || typeof commentsEnabled !== 'boolean') {
            return NextResponse.json({ error: "Missing or invalid required fields" }, { status: 400 });
        }

        // Verificar que el usuario sea el propietario del vídeo
        const { data: video, error: fetchError } = await supabaseAdmin
            .from('videos')
            .select('user_handle')
            .eq('id', videoId)
            .single();

        if (fetchError || !video) {
            return NextResponse.json({ error: "Video not found" }, { status: 404 });
        }

        if (video.user_handle !== userHandle) {
            return NextResponse.json({ error: "You don't have permission to modify this video" }, { status: 403 });
        }

        const { data, error } = await supabaseAdmin
            .from('videos')
            .update({ comments_enabled: commentsEnabled })
            .eq('id', videoId)
            .eq('user_handle', userHandle)
            .select();

        if (error) {
            console.error("Error updating comments_enabled:", error);
            return NextResponse.json({ error: "Failed to update comments status" }, { status: 500 });
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ error: "Video not found or no permission" }, { status: 404 });
        }

        // Si se desactivan los comentarios, borrar las notificaciones de comentarios de este vídeo
        if (commentsEnabled === false) {
            try {
                await supabaseAdmin
                    .from('notifications')
                    .delete()
                    .eq('type', 'comment')
                    .eq('reference_id', videoId);
            } catch (notifError) {
                console.error("Error al borrar notificaciones asociadas:", notifError);
            }
        }

        return NextResponse.json({ success: true, commentsEnabled });

    } catch (error) {
        console.error("Error toggling video comments:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
