import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, addNotification } from "@/lib/db";
import { logSystemAlert } from '@/lib/alerts';

// POST: Add or Remove a Follower
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const follower_handle = body.follower_handle || body.followerHandle;
        const following_handle = body.following_handle || body.followingHandle;
        const action = body.action;

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

                if (!error) {
                    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
                    await fetch(`${baseUrl}/api/voz/notifications`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            recipientId: following_handle,
                            type: 'follow',
                            title: 'Nuevo Seguidor 👤',
                            message: `${follower_handle} ha comenzado a seguirte.`,
                            senderId: follower_handle
                        })
                    }).catch(err => console.error("Error triggering follow notification:", err));
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
        await logSystemAlert('Seguimiento', error);
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

        const clean = handle.replace('@', '');

        // Get Fans (People following this handle)
        const { data: fansData } = await supabaseAdmin
            .from("user_follows")
            .select("follower_handle")
            .or(`following_handle.ilike.${clean},following_handle.ilike.@${clean}`);

        // Get Following (People this handle follows)
        const { data: followingData } = await supabaseAdmin
            .from("user_follows")
            .select("following_handle")
            .or(`follower_handle.ilike.${clean},follower_handle.ilike.@${clean}`);

        const fansHandles = fansData ? fansData.map((f: any) => f.follower_handle) : [];
        const followingHandles = followingData ? followingData.map((f: any) => f.following_handle) : [];

        // Fetch user profiles for fans
        let fansProfiles: any[] = [];
        if (fansHandles.length > 0) {
            const cleanFans = fansHandles.map(h => h.replace('@', ''));
            const { data: fUsers } = await supabaseAdmin
                .from("app_users")
                .select("id, name, handle, profile_image, profile_color");
            if (fUsers) {
                fansProfiles = fUsers.filter((u: any) => u.handle && cleanFans.includes(u.handle.replace('@', '')));
            }
        }

        // Fetch user profiles for following
        let followingProfiles: any[] = [];
        if (followingHandles.length > 0) {
            const cleanFollowing = followingHandles.map(h => h.replace('@', ''));
            const { data: flwUsers } = await supabaseAdmin
                .from("app_users")
                .select("id, name, handle, profile_image, profile_color");
            if (flwUsers) {
                followingProfiles = flwUsers.filter((u: any) => u.handle && cleanFollowing.includes(u.handle.replace('@', '')));
            }
        }

        return NextResponse.json({ 
            success: true, 
            fans: fansHandles, 
            following: followingHandles,
            fansProfiles: fansProfiles.length > 0 ? fansProfiles : fansHandles.map(h => ({ name: h.replace('@', ''), handle: h.startsWith('@') ? h : `@${h}` })),
            followingProfiles: followingProfiles.length > 0 ? followingProfiles : followingHandles.map(h => ({ name: h.replace('@', ''), handle: h.startsWith('@') ? h : `@${h}` }))
        });

    } catch (error) {
        console.error("GET follows error:", error);
        await logSystemAlert('Seguimiento', error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
