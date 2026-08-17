import { NextRequest, NextResponse } from "next/server";
import { toggleVideoDislike } from "@/lib/db";

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { videoId, userHandle, isDisliked } = body;

        if (!videoId || !userHandle) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const success = await toggleVideoDislike(videoId, userHandle, isDisliked);

        if (success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: "Failed to update video dislike" }, { status: 500 });
        }
    } catch (error) {
        console.error("Error updating video dislike:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
