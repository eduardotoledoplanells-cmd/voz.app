import { NextRequest, NextResponse } from "next/server";
import { toggleVideoBookmark, supabaseAdmin } from "@/lib/db";

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

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userHandle = searchParams.get("userHandle");

        if (!userHandle) {
            return NextResponse.json({ error: "Missing userHandle" }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from("video_bookmarks")
            .select("video_id")
            .eq("user_handle", userHandle);

        if (error) throw error;

        const bookmarkedIds = data.map(item => item.video_id);
        return NextResponse.json({ success: true, bookmarkedIds });
    } catch (error) {
        console.error("Error fetching bookmarks:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
