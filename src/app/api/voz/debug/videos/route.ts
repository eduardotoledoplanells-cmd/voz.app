import { NextRequest, NextResponse } from "next/server";
import { getVideos } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const videos = await getVideos();
        return NextResponse.json({
            success: true,
            videosCount: videos?.length || 0,
            videos
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: (error as Error).message,
            stack: (error as Error).stack
        }, { status: 500 });
    }
}
