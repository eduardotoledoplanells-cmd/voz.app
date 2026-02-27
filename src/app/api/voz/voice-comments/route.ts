import { NextRequest, NextResponse } from "next/server";
import { getVoiceComments, addVoiceComment, incrementVoiceCommentLike } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const videoId = searchParams.get('videoId');
        const userHandle = searchParams.get('userHandle');

        if (!videoId) {
            return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
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
        const body = await request.json();
        const { videoId, userHandle, avatarUrl, audioUrl, duration, parentId } = body;

        if (!videoId || !userHandle || !audioUrl) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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

        if (!commentId || !userHandle || action !== 'like') {
            return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
        }

        const success = await incrementVoiceCommentLike(commentId, userHandle);

        if (!success) {
            return NextResponse.json({ error: "Could not add like" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error processing like:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
