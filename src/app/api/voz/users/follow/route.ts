import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db";

// POST: Add or Remove a Follower
export async function POST(req: NextRequest) {
    try {
        const { follower_handle, following_handle, action } = await req.json();

        if (!follower_handle || !following_handle || !action) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        try {
            if (action === 'follow') {
                const { error } = await supabaseAdmin
                    .from("user_follows")
                    .insert([{ follower_handle, following_handle }]);

                if (error && error.code !== '23505') { // 23505 is unique violation (already following)
                    throw error;
                }
            } else if (action === 'unfollow') {
                const { error } = await supabaseAdmin
                    .from("user_follows")
                    .delete()
                    .eq("follower_handle", follower_handle)
                    .eq("following_handle", following_handle);

                if (error) throw error;
            }
        } catch (e) {
            console.error("POST follow error (likely missing table):", e);
            return NextResponse.json({ error: "Database not ready. Please try again later." }, { status: 503 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("POST follow error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// GET: Get Fans and Following for a specific handle
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const handle = searchParams.get("handle");

        if (!handle) {
            return NextResponse.json({ error: "Missing handle parameter" }, { status: 400 });
        }

        // Get Fans (People following this handle)
        const { data: fansData } = await supabaseAdmin
            .from("user_follows")
            .select("follower_handle")
            .eq("following_handle", handle);

        // Get Following (People this handle follows)
        const { data: followingData } = await supabaseAdmin
            .from("user_follows")
            .select("following_handle")
            .eq("follower_handle", handle);

        const fans = fansData ? fansData.map((f: any) => f.follower_handle) : [];
        const following = followingData ? followingData.map((f: any) => f.following_handle) : [];

        return NextResponse.json({ success: true, fans, following });

    } catch (error) {
        console.error("GET follows error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
