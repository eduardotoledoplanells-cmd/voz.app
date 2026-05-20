import { NextResponse } from 'next/server';
import { requestVideoRetention, deleteVideo } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { videoId, userHandle, action } = body;

        if (!videoId || !userHandle || !action) {
            return NextResponse.json({ error: 'Faltan parámetros (videoId, userHandle, action)' }, { status: 400 });
        }

        if (action === 'keep') {
            const success = await requestVideoRetention(videoId, userHandle);
            if (!success) {
                return NextResponse.json({ error: 'Error al solicitar retención' }, { status: 500 });
            }
            return NextResponse.json({ success: true, message: 'Video mantenido con éxito' });
        } else if (action === 'delete') {
            const success = await deleteVideo(videoId, userHandle);
            if (!success) {
                return NextResponse.json({ error: 'Error al eliminar el video' }, { status: 500 });
            }
            return NextResponse.json({ success: true, message: 'Video eliminado con éxito' });
        } else {
            return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
        }
    } catch (error) {
        console.error('Retention API error:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
