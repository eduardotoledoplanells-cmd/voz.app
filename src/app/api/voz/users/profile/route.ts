import { NextRequest, NextResponse } from "next/server";
import { getAppUsers, supabaseAdmin } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const handle = searchParams.get("handle");

        if (!handle) {
            return NextResponse.json({ error: "Missing handle parameter" }, { status: 400 });
        }

        const users = await getAppUsers();
        const user = users.find(u => u.handle === handle);

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { password, ...userWithoutPassword } = user;

        let fansCount = 0;
        let followingCount = 0;
        let totalLikes = 0;

        try {
            // Fetch Fans Count
            const { count: fCount, error: fErr } = await supabaseAdmin
                .from("user_follows")
                .select("*", { count: "exact", head: true })
                .eq("following_handle", handle);
            if (!fErr) fansCount = fCount || 0;

            // Fetch Following Count
            const { count: flwCount, error: flwErr } = await supabaseAdmin
                .from("user_follows")
                .select("*", { count: "exact", head: true })
                .eq("follower_handle", handle);
            if (!flwErr) followingCount = flwCount || 0;

            // Fetch Total Likes across all their videos
            const { data: userVideos, error: vErr } = await supabaseAdmin
                .from("videos")
                .select("likes")
                .eq("user_handle", handle);

            if (!vErr && userVideos) {
                totalLikes = userVideos.reduce((sum, v) => sum + (v.likes || 0), 0);
            }
        } catch (e) {
            console.error("Enrichment error (likely missing table):", e);
        }

        const enrichedProfile = {
            ...userWithoutPassword,
            fans: fansCount.toString(),
            following: followingCount.toString(),
            likes: totalLikes.toString()
        };

        return NextResponse.json({ success: true, user: enrichedProfile });

    } catch (error) {
        console.error("GET profile error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
