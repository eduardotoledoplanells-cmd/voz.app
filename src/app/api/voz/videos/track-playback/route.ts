import { NextRequest, NextResponse } from "next/server";
import { recordPlaybackMetrics } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}

function corsHeaders(response: NextResponse) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            videoId,
            userHandle,
            watchTimeSeconds = 0,
            completionRate = 0,
            isCompleted = false,
            isRewatch = false,
            isEarlySkip = false,
            durationSeconds = 15
        } = body;

        if (!videoId) {
            return corsHeaders(NextResponse.json({ error: "Missing videoId" }, { status: 400 }));
        }

        const success = await recordPlaybackMetrics({
            videoId,
            userHandle,
            watchTimeSeconds: Number(watchTimeSeconds) || 0,
            completionRate: Number(completionRate) || 0,
            isCompleted: Boolean(isCompleted),
            isRewatch: Boolean(isRewatch),
            isEarlySkip: Boolean(isEarlySkip),
            durationSeconds: Number(durationSeconds) || 15
        });

        if (success) {
            return corsHeaders(NextResponse.json({ success: true }));
        } else {
            return corsHeaders(NextResponse.json({ error: "Failed to record playback metrics" }, { status: 500 }));
        }
    } catch (error: any) {
        console.error("Error in track-playback API:", error);
        return corsHeaders(NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 }));
    }
}
