import { NextRequest, NextResponse } from "next/server";
import { getVideos, addVideo, VideoPost, deleteVideo } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
    try {
        const videos = await getVideos();
        return NextResponse.json(videos);
    } catch (error) {
        console.error("Error fetching videos:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { videoUrl, user, description, transcription, music, thumbnailUrl } = body;

        if (!videoUrl || !user) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const newVideo: VideoPost = {
            id: uuidv4(),
            videoUrl,
            user,
            description: description || "",
            // transcription: transcription || [], // Note: schema.sql doesn't have transcription yet, ignoring for now or adding as json
            likes: 0,
            shares: 0,
            commentsCount: 0,
            views: 0,
            music: music || "",
            thumbnailUrl: thumbnailUrl || "",
            createdAt: new Date().toISOString()
        };

        const savedVideo = await addVideo(newVideo);

        return NextResponse.json({
            success: true,
            video: savedVideo
        });

    } catch (error) {
        console.error("Error creating video post:", error);
        return NextResponse.json({ error: (error as Error).message || "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { videoId, userHandle } = body;

        if (!videoId || !userHandle) {
            return NextResponse.json({ error: "Missing required fields: videoId and userHandle" }, { status: 400 });
        }

        const success = await deleteVideo(videoId, userHandle);

        if (success) {
            return NextResponse.json({ success: true, message: "Video deleted successfully" });
        } else {
            return NextResponse.json({ error: "Failed to delete video. Make sure you own the video." }, { status: 403 });
        }
    } catch (error) {
        console.error("Error deleting video:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
