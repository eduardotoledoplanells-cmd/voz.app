import { NextRequest, NextResponse } from "next/server";
import { incrementVideoView } from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { videoId, userHandle } = body;

        if (!videoId || !userHandle) {
            return NextResponse.json({ error: "Missing videoId or userHandle" }, { status: 400 });
        }

        const success = await incrementVideoView(videoId, userHandle);

        if (success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: "Failed to update view count" }, { status: 500 });
        }
    } catch (error) {
        console.error("Error in view API:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
