import { NextRequest, NextResponse } from "next/server";
import { toggleVideoBookmark } from "@/lib/db";

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { videoId, userHandle, isBookmarked } = body;

        if (!videoId || !userHandle) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const success = await toggleVideoBookmark(videoId, userHandle, isBookmarked);

        if (success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: "Failed to update video bookmark" }, { status: 500 });
        }
    } catch (error) {
        console.error("Error updating video bookmark:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
