import { NextRequest, NextResponse } from "next/server";
import { recordVoiceCommentListen } from "@/lib/db";

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
        const { videoId, commentId, durationSec = 3 } = body;

        if (!videoId || !commentId) {
            return corsHeaders(NextResponse.json({ error: "Missing videoId or commentId" }, { status: 400 }));
        }

        const success = await recordVoiceCommentListen(videoId, commentId, Number(durationSec) || 3);

        if (success) {
            return corsHeaders(NextResponse.json({ success: true }));
        } else {
            return corsHeaders(NextResponse.json({ error: "Failed to record voice comment listen" }, { status: 500 }));
        }
    } catch (error: any) {
        console.error("Error in voice-comments/listen API:", error);
        return corsHeaders(NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 }));
    }
}
