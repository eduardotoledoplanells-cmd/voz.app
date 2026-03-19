import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { videoId } = body;

        if (!videoId) {
            return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
        }

        // Increment views in Supabase using the rpc function if it exists, 
        // or a direct increment if we have simple table logic.
        // Assuming we use an RPC for atomic increment.
        const { error } = await supabaseAdmin.rpc('increment_video_views', { video_id: videoId });

        if (error) {
            // Fallback: manually update if RPC doesn't exist
            console.warn("RPC increment_video_views failed, trying manual update", error);
            const { data: current, error: getError } = await supabaseAdmin
                .from('videos')
                .select('views')
                .eq('id', videoId)
                .single();
            
            if (!getError && current) {
                await supabaseAdmin
                    .from('videos')
                    .update({ views: (current.views || 0) + 1 })
                    .eq('id', videoId);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("View increment error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
