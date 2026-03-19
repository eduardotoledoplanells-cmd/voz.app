import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db";

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { videoId, isBookmarked } = body;

        if (!videoId) {
            return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
        }

        // Bookmark logic depends on your schema. 
        // If it's just a count on the video:
        const increment = isBookmarked ? 1 : -1;
        
        // Manual update as fallback
        const { data: current, error: getError } = await supabaseAdmin
            .from('videos')
            .select('bookmarks_count')
            .eq('id', videoId)
            .single();
        
        if (!getError && current) {
            await supabaseAdmin
                .from('videos')
                .update({ bookmarks_count: Math.max(0, (current.bookmarks_count || 0) + increment) })
                .eq('id', videoId);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Bookmark update error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
