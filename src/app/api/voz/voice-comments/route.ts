import { NextRequest, NextResponse } from "next/server";
import { getVoiceComments, addVoiceComment } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const videoId = searchParams.get('videoId');

        if (!videoId) {
            return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
        }

        const comments = await getVoiceComments(videoId);
        return NextResponse.json(comments);
    } catch (error) {
        console.error("Error fetching voice comments:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { videoId, userHandle, avatarUrl, audioUrl, duration } = body;

        if (!videoId || !userHandle || !audioUrl) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const savedComment = await addVoiceComment({
            video_id: videoId,
            user_handle: userHandle,
            avatar_url: avatarUrl,
            audio_url: audioUrl,
            duration: duration || "0s",
            likes: 0
        });

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
