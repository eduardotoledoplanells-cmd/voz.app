import { NextRequest, NextResponse } from "next/server";
import { toggleVideoLike, supabaseAdmin, addNotification } from "@/lib/db";

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { videoId, userHandle, isLiked } = body;

        if (!videoId || !userHandle) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const success = await toggleVideoLike(videoId, userHandle, isLiked);

        if (success) {
            if (isLiked) {
                const { data: video } = await supabaseAdmin.from('videos').select('user_handle').eq('id', videoId).single();
                if (video && video.user_handle && video.user_handle !== userHandle) {
                    await addNotification({
                        id: Date.now().toString(),
                        recipientId: video.user_handle,
                        type: 'like',
                        title: 'Nuevo Me Gusta ❤️',
                        message: `${userHandle} le ha dado me gusta a tu vídeo.`,
                        timestamp: new Date().toISOString(),
                        readStatus: false
                    });
                }
            }
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: "Failed to update video like" }, { status: 500 });
        }
    } catch (error) {
        console.error("Error updating video like:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userHandle = searchParams.get("userHandle");

        if (!userHandle) {
            return NextResponse.json({ error: "Missing userHandle" }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from("video_likes")
            .select("video_id")
            .eq("user_handle", userHandle);

        if (error) throw error;

        const likedIds = data.map(item => item.video_id);
        return NextResponse.json({ success: true, likedIds });
    } catch (error) {
        console.error("Error fetching likes:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
