import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { videoId, userHandle, isPinned } = body;

        if (!videoId || !userHandle || typeof isPinned !== 'boolean') {
            return NextResponse.json({ error: "Missing or invalid required fields" }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('videos')
            .update({ is_pinned: isPinned })
            .eq('id', videoId)
            .eq('user_handle', userHandle)
            .select();

        if (error) {
            console.error("Error updating pin status:", error);
            return NextResponse.json({ error: "Failed to update pin status" }, { status: 500 });
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ error: "Video not found or you don't have permission to modify it" }, { status: 404 });
        }

        return NextResponse.json({ success: true, isPinned });

    } catch (error) {
        console.error("Error toggling video pin:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
