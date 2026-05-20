import { NextResponse } from 'next/server';
import { supabaseAdmin, deleteVideo, addNotification } from '@/lib/db';

export async function GET(request: Request) {
    try {
        // Verificar si la petición viene de Vercel Cron (opcional para seguridad)
        const authHeader = request.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        // Fetch videos older than 1 year
        const { data: videos, error } = await supabaseAdmin
            .from('videos')
            .select('id, user_handle, views, filter_config, created_at')
            .lt('created_at', oneYearAgo.toISOString());

        if (error) {
            console.error('[CRON] Error fetching old videos:', error);
            return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
        }

        let deletedCount = 0;
        let notifiedCount = 0;

        if (videos) {
            for (const video of videos) {
                const config = video.filter_config || {};
                
                // Si el usuario ya pidió mantenerlo, ignorar
                if (config.retention_requested) {
                    continue;
                }

                if (video.views < 50) {
                    // Borrar automáticamente inmediatamente
                    console.log(`[CRON] Deleting video ${video.id} (views: ${video.views})`);
                    const success = await deleteVideo(video.id, video.user_handle);
                    if (success) deletedCount++;
                } else {
                    // Views >= 50: Notificar y esperar 3 días
                    if (!config.deletion_notified_at) {
                        // Enviar notificación y registrar
                        const newConfig = {
                            ...config,
                            deletion_notified_at: new Date().toISOString()
                        };
                        
                        await supabaseAdmin
                            .from('videos')
                            .update({ filter_config: newConfig })
                            .eq('id', video.id);

                        await addNotification({
                            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                            recipientId: video.user_handle,
                            type: 'video_deletion_warning',
                            title: 'Aviso de Limpieza de Servidor',
                            message: `Tu video publicado el ${new Date(video.created_at).toLocaleDateString()} tiene más de un año. Será eliminado en 3 días para liberar espacio. ¿Deseas mantenerlo?|||VIDEO_ID:${video.id}`,
                            timestamp: new Date().toISOString(),
                            readStatus: false
                        });
                        
                        notifiedCount++;
                    } else {
                        // Comprobar si pasaron 3 días
                        const notifiedAt = new Date(config.deletion_notified_at);
                        const threeDaysAgo = new Date();
                        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

                        if (notifiedAt < threeDaysAgo) {
                            console.log(`[CRON] Deleting video ${video.id} after 3 days warning`);
                            const success = await deleteVideo(video.id, video.user_handle);
                            if (success) deletedCount++;
                        }
                    }
                }
            }
        }

        return NextResponse.json({ 
            success: true, 
            deleted: deletedCount, 
            notified: notifiedCount 
        });
    } catch (err) {
        console.error('[CRON] Exception:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
