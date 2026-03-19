import { NextRequest, NextResponse } from "next/server";
import { getVideos, addVideo, deleteVideo, VideoPost } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}

function corsHeaders(response: NextResponse) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userHandle = searchParams.get('userHandle') || undefined;
        const videos = await getVideos(userHandle);
        return corsHeaders(NextResponse.json(videos));
    } catch (error) {
        console.error("Error fetching videos:", error);
        return corsHeaders(NextResponse.json({ error: "Internal Server Error" }, { status: 500 }));
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { videoUrl, user, description, transcription, music, thumbnailUrl, filterConfig, isMuted } = body;

        if (!videoUrl || !user) {
            return corsHeaders(NextResponse.json({ error: "Missing required fields" }, { status: 400 }));
        }

        const newVideo: VideoPost = {
            id: uuidv4(),
            videoUrl,
            user,
            description: description || "",
            likes: 0,
            shares: 0,
            commentsCount: 0,
            views: 0,
            music: music || "",
            thumbnailUrl: thumbnailUrl || "",
            filterConfig: filterConfig || null,
            createdAt: new Date().toISOString(),
            isMuted: isMuted || false
        };

        const savedVideo = await addVideo(newVideo);

        return corsHeaders(NextResponse.json({
            success: true,
            video: savedVideo || newVideo
        }));

    } catch (error) {
        console.error("Error creating video post:", error);
        return corsHeaders(NextResponse.json({
            success: false,
            error: (error as Error).message || "Internal Server Error"
        }, { status: 500 }));
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        let videoId = searchParams.get('id') || searchParams.get('videoId');
        let userHandle = searchParams.get('userHandle');

        // Fallback to JSON body if not in query params
        if (!videoId || !userHandle) {
            try {
                const body = await request.json();
                videoId = videoId || body.videoId || body.id;
                userHandle = userHandle || body.userHandle;
            } catch (e) {
                // No body or not JSON, continue with what we have
            }
        }

        if (!videoId || !userHandle) {
            return corsHeaders(NextResponse.json({ error: "Missing required fields: videoId and userHandle" }, { status: 400 }));
        }

        const success = await deleteVideo(videoId, userHandle);

        if (success) {
            return corsHeaders(NextResponse.json({ success: true, message: "Video deleted successfully" }));
        } else {
            return corsHeaders(NextResponse.json({ error: "Failed to delete video. Make sure you own the video." }, { status: 403 }));
        }
    } catch (error) {
        console.error("Error deleting video:", error);
        return corsHeaders(NextResponse.json({ error: "Internal Server Error" }, { status: 500 }));
    }
}
