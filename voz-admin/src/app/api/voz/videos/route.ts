import { NextRequest, NextResponse } from "next/server";
import { getVideos, addVideo, VideoPost } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
    try {
        const videos = getVideos();
        return NextResponse.json(videos);
    } catch (error) {
        console.error("Error fetching videos:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { videoUrl, user, description, transcription, music } = body;

        if (!videoUrl || !user) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const newVideo: VideoPost = {
            id: uuidv4(),
            videoUrl,
            user,
            description: description || "",
            transcription: transcription || [],
            likes: 0,
            shares: 0,
            commentsCount: 0,
            views: 0,
            createdAt: new Date().toISOString(),
            music: music || ""
        };

        addVideo(newVideo);

        return NextResponse.json({ success: true, video: newVideo });

    } catch (error) {
        console.error("Error creating video post:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
