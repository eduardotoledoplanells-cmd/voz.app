import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db";

// Endpoint para CRON (ej. Vercel Cron) que limpia audios de comentarios desactivados antiguos
// Debe configurarse en vercel.json:
// { "crons": [{ "path": "/api/voz/cron/clean-voice-comments", "schedule": "0 0 1 * *" }] }

export async function GET(request: Request) {
    try {
        // Validación básica de seguridad (ej. mediante un secreto de CRON)
        const authHeader = request.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Obtener vídeos con comments_enabled = false
        const { data: disabledVideos, error: fetchError } = await supabaseAdmin
            .from('videos')
            .select('id')
            .eq('comments_enabled', false);

        if (fetchError || !disabledVideos) {
            return NextResponse.json({ error: "No se pudieron obtener vídeos" }, { status: 500 });
        }

        const videoIds = disabledVideos.map(v => v.id);
        if (videoIds.length === 0) {
            return NextResponse.json({ success: true, message: "No hay vídeos con comentarios desactivados." });
        }

        // 2. Obtener los comentarios antiguos (ej. de más de 30 días) para esos vídeos
        // Para simplificar, buscamos comentarios de esos vídeos. Podrías añadir lógica de fechas.
        const { data: oldComments } = await supabaseAdmin
            .from('voice_comments')
            .select('id, audio_url')
            .in('video_id', videoIds);

        if (!oldComments || oldComments.length === 0) {
            return NextResponse.json({ success: true, message: "No hay audios antiguos para borrar." });
        }

        const audioPaths: string[] = [];
        const urlPart = '/storage/v1/object/public/media/';
        for (const c of oldComments) {
            if (c.audio_url && c.audio_url.includes(urlPart)) {
                audioPaths.push(c.audio_url.split(urlPart)[1]);
            }
        }

        // 3. Borrar del Storage de Supabase
        if (audioPaths.length > 0) {
            console.log(`[CRON] Borrando ${audioPaths.length} audios de comentarios desactivados.`);
            await supabaseAdmin.storage.from('media').remove(audioPaths);
        }

        // 4. Borrar registros de la base de datos
        const commentIds = oldComments.map(c => c.id);
        if (commentIds.length > 0) {
            await supabaseAdmin.from('voice_comments').delete().in('id', commentIds);
        }

        return NextResponse.json({ 
            success: true, 
            message: `Limpiados ${audioPaths.length} audios y ${commentIds.length} registros.` 
        });

    } catch (error) {
        console.error("Error en CRON clean-voice-comments:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
