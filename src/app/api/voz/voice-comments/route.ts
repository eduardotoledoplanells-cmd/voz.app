import { NextRequest, NextResponse } from "next/server";
import { getVoiceComments, addVoiceComment, incrementVoiceCommentLike, removeVoiceCommentLike, addNotification, getUserById, supabaseAdmin } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const videoId = searchParams.get('videoId');
        const userHandle = searchParams.get('userHandle');

        if (!videoId) {
            return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
        }

        // Verificar si los comentarios están habilitados para este vídeo
        const { data: videoData } = await supabaseAdmin
            .from('videos')
            .select('comments_enabled')
            .eq('id', videoId)
            .single();

        // Si comments_enabled es explícitamente false, devolver array vacío
        if (videoData && videoData.comments_enabled === false) {
            return NextResponse.json([]);
        }

        const comments = await getVoiceComments(videoId, userHandle || undefined);
        return NextResponse.json(comments);
    } catch (error) {
        console.error("Error fetching voice comments:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        // Autenticación estricta con Token Bearer de Supabase Auth
        let authenticatedUserId: string | null = null;
        const authHeader = request.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const { data: authUser } = await supabaseAdmin.auth.getUser(token);
                if (authUser?.user) {
                    authenticatedUserId = authUser.user.id;
                }
            } catch (e) {
                console.warn("Auth token validation failed in voice comments:", e);
            }
        }

        if (!authenticatedUserId) {
            return NextResponse.json({ error: 'Acceso denegado: Token de sesión inválido o inexistente' }, { status: 401 });
        }

        const body = await request.json();
        const { videoId, userHandle, avatarUrl, audioUrl, duration, parentId } = body;

        if (!videoId || !userHandle || !audioUrl) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Verificar que el usuario autenticado corresponde al handle publicado
        const sender = await getUserById(authenticatedUserId);
        const cleanSenderHandle = sender?.handle?.replace('@', '');
        const cleanPayloadHandle = userHandle.replace('@', '');
        
        if (!sender || (cleanSenderHandle !== cleanPayloadHandle)) {
            return NextResponse.json({ error: "Acceso denegado: No puedes publicar comentarios en nombre de otro usuario" }, { status: 403 });
        }

        // Verificar si los comentarios están habilitados para este vídeo
        const { data: videoData } = await supabaseAdmin
            .from('videos')
            .select('comments_enabled')
            .eq('id', videoId)
            .single();

        if (videoData && videoData.comments_enabled === false) {
            return NextResponse.json({ error: "El propietario ha desactivado los comentarios en este vídeo." }, { status: 403 });
        }

        const commentData: any = {
            video_id: videoId,
            user_handle: userHandle,
            avatar_url: avatarUrl,
            audio_url: audioUrl,
            duration: duration || "0s",
            likes: 0
        };

        if (parentId) {
            commentData.parent_id = parentId;
        }

        const savedComment = await addVoiceComment(commentData);

        if (!savedComment) throw new Error("Could not save comment");

        let recipient = '';
        if (parentId) {
            const { data: parent } = await supabaseAdmin.from('voice_comments').select('user_handle').eq('id', parentId).single();
            if (parent && parent.user_handle) recipient = parent.user_handle;
        } else {
            const { data: video } = await supabaseAdmin.from('videos').select('user_handle').eq('id', videoId).single();
            if (video && video.user_handle) recipient = video.user_handle;
        }

        if (recipient && recipient !== userHandle) {
            await addNotification({
                id: Date.now().toString(),
                recipientId: recipient,
                type: 'comment',
                title: 'Nuevo Comentario de Voz 🎙️',
                message: `${userHandle} ha comentado en tu publicación.`,
                timestamp: new Date().toISOString(),
                readStatus: false,
                referenceId: videoId
            });
        }

        return NextResponse.json({
            success: true,
            comment: savedComment
        });

    } catch (error) {
        console.error("Error creating voice comment:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { commentId, userHandle, action } = body;

        if (!commentId || !userHandle || !['like', 'unlike'].includes(action)) {
            return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
        }

        let success = false;

        if (action === 'like') {
            success = await incrementVoiceCommentLike(commentId, userHandle);
        } else if (action === 'unlike') {
            success = await removeVoiceCommentLike(commentId, userHandle);
        }

        if (!success) {
            return NextResponse.json({ error: "Could not modify like status" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error processing like:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
