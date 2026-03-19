import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { videoId, isPinned } = body;

        if (!videoId) {
            return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('videos')
            .update({ is_pinned: isPinned })
            .eq('id', videoId);

        if (error) {
            console.error("Supabase pin error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Pin update error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
