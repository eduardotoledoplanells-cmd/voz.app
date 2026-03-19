import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db";

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { videoId, isLiked } = body;

        if (!videoId) {
            return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
        }

        // Atomic increment/decrement of likes
        const increment = isLiked ? 1 : -1;
        const { error } = await supabaseAdmin.rpc('increment_video_likes', { 
            video_id: videoId, 
            increment_by: increment 
        });

        if (error) {
            console.warn("RPC increment_video_likes failed, trying manual update", error);
            const { data: current, error: getError } = await supabaseAdmin
                .from('videos')
                .select('likes')
                .eq('id', videoId)
                .single();
            
            if (!getError && current) {
                await supabaseAdmin
                    .from('videos')
                    .update({ likes: Math.max(0, (current.likes || 0) + increment) })
                    .eq('id', videoId);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Like update error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
