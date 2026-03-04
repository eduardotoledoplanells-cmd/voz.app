import { NextRequest, NextResponse } from "next/server";
import { toggleVideoLike } from "@/lib/db";

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { videoId, userHandle, isLiked } = body;

        if (!videoId || !userHandle) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const success = await toggleVideoLike(videoId, userHandle, isLiked);

        if (success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: "Failed to update video like" }, { status: 500 });
        }
    } catch (error) {
        console.error("Error updating video like:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
