import { NextRequest, NextResponse } from "next/server";
import { getVideos, addVideo, VideoPost } from "@/lib/db";
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
