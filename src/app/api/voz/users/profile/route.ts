import { NextRequest, NextResponse } from "next/server";
import { getUserByIdOrHandleOrEmail, getUserEscrowSummary, supabaseAdmin } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const handle = searchParams.get("handle");
        const id = searchParams.get("id");
        const email = searchParams.get("email");
        const query = searchParams.get("query");

        if (query) {
            const cleanQuery = query.trim().replace('@', '');
            const { data: users, error } = await supabaseAdmin
                .from('app_users')
                .select('id, handle, name, bio, profile_image, profile_color')
                .or(`handle.ilike.%${cleanQuery}%,name.ilike.%${cleanQuery}%`)
                .limit(10);

            if (error) {
                console.error("Search users error:", error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
            return NextResponse.json({ success: true, users: users || [] });
        }

        if (!handle && !id && !email) {
            return NextResponse.json({ error: "Missing identifying parameter (handle, id, email, or query)" }, { status: 400 });
        }

        const user = await getUserByIdOrHandleOrEmail(id || undefined, handle || undefined, email || undefined);

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { password, ...userWithoutPassword } = user;

        let fansHandles: string[] = [];
        let followingHandles: string[] = [];
        let fansCount = 0;
        let followingCount = 0;
        let totalLikes = 0;

        try {
            // Fetch Fans (Handles and Count)
            const { data: fansData, error: fErr } = await supabaseAdmin
                .from("user_follows")
                .select("follower_handle")
                .eq("following_handle", user.handle);
            
            if (!fErr && fansData) {
                fansHandles = fansData.map(f => f.follower_handle);
                fansCount = fansHandles.length;
            }

            // Fetch Following (Handles and Count)
            const { data: followingData, error: flwErr } = await supabaseAdmin
                .from("user_follows")
                .select("following_handle")
                .eq("follower_handle", user.handle);
            
            if (!flwErr && followingData) {
                followingHandles = followingData.map(f => f.following_handle);
                followingCount = followingHandles.length;
            }

            // Fetch Total Likes across all their videos
            const { data: userVideos, error: vErr } = await supabaseAdmin
                .from("videos")
                .select("likes")
                .eq("user_handle", user.handle);

            if (!vErr && userVideos) {
                totalLikes = userVideos.reduce((sum, v) => sum + (v.likes || 0), 0);
            }
        } catch (e) {
            console.error("Enrichment error:", e);
        }

        let escrowSummary = { pendingEscrowBalance: 0, activeEscrows: [] as any[] };
        if (user.handle) {
            try {
                escrowSummary = await getUserEscrowSummary(user.handle);
            } catch (e) {
                console.error("Escrow summary error:", e);
            }
        }

        const enrichedProfile = {
            ...userWithoutPassword,
            walletBalance: user.walletBalance || 0,
            wallet_balance: user.walletBalance || 0,
            earningsBalance: user.earningsBalance || 0,
            earnings_balance: user.earningsBalance || 0,
            pendingEscrowBalance: escrowSummary.pendingEscrowBalance,
            activeEscrows: escrowSummary.activeEscrows,
            fans: fansCount.toString(),
            following: followingCount.toString(),
            likes: totalLikes.toString()
        };

        return NextResponse.json({ 
            success: true, 
            user: enrichedProfile,
            fans: fansHandles,
            following: followingHandles
        });

    } catch (error) {
        console.error("GET profile error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
