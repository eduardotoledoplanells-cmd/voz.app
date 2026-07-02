import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db'; 

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000'; 

export async function POST(request: Request) {
    try {
        const { handle, isLive, liveUrl } = await request.json();

        // 1. Actualizar el estado en las columnas dedicadas
        await supabaseAdmin
            .from('app_users')
            .update({ 
                is_live: isLive, 
                live_url: liveUrl 
            })
            .eq('handle', handle);

        // 2. Si se pone en directo, disparar notificaciones Push
        if (isLive) {
            // Obtenemos los seguidores
            const { data: followers } = await supabaseAdmin
                .from('user_follows')
                .select('follower_handle')
                .eq('following_handle', handle);
            
            if (followers && followers.length > 0) {
                const pushPromises = followers.map(f => {
                    return fetch(`${API_BASE}/api/voz/notifications`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            recipientId: f.follower_handle,
                            senderId: handle,
                            type: 'live_alert',
                            title: '🔴 ¡En Directo!',
                            message: `${handle} ha empezado un Live. ¡Entra ahora!`,
                            referenceId: `live://${handle}`
                        })
                    });
                });

                Promise.allSettled(pushPromises).catch(console.error);
            }
        }

        return NextResponse.json({ success: true, isLive });
    } catch (error) {
        return NextResponse.json({ error: 'Fallo al actualizar estado' }, { status: 500 });
    }
}
