import { NextResponse } from 'next/server';
import { getAppUsers, addAppUser, updateAppUser, deleteAppUser, getVideosByUser, supabaseAdmin } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const handle = searchParams.get('handle');
        const isProfile = searchParams.get('isProfile') === 'true';

        if (handle && !isProfile) {
            const videos = await getVideosByUser(handle);
            return NextResponse.json(videos);
        }

        if (handle && isProfile) {
            const users = await getAppUsers();

            // Robust normalization
            const normalize = (h: string) => h.replace(/[@_.\s]/g, '').toLowerCase();
            const searchNormalized = normalize(handle);
            const user = users.find(u => normalize(u.handle) === searchNormalized);

            if (!user) {
                return NextResponse.json({ error: "User not found" }, { status: 404 });
            }

            const { password, ...userWithoutPassword } = user;

            // Fetch extra stats (Fans, Following, Likes) from DB
            let fansCount = 0;
            let followingCount = 0;
            let totalLikes = 0;

            const { data: fansData } = await supabaseAdmin
                .from("user_follows")
                .select("follower_handle")
                .eq("following_handle", user.handle);
            fansCount = fansData?.length || 0;

            const { data: followingData } = await supabaseAdmin
                .from("user_follows")
                .select("following_handle")
                .eq("follower_handle", user.handle);
            followingCount = followingData?.length || 0;

            const { data: userVideos } = await supabaseAdmin
                .from("videos")
                .select("likes")
                .eq("user_handle", user.handle);

            if (userVideos) {
                totalLikes = userVideos.reduce((sum: number, v: any) => sum + (v.likes || 0), 0);
            }

            return NextResponse.json({
                success: true,
                user: {
                    ...userWithoutPassword,
                    fans: fansCount.toString(),
                    following: followingCount.toString(),
                    likes: totalLikes.toString()
                },
                fans: fansData ? fansData.map((f: any) => f.follower_handle) : [],
                following: followingData ? followingData.map((f: any) => f.following_handle) : []
            });
        }

        const users = await getAppUsers();
        return NextResponse.json(users);
    } catch (error) {
        console.error("GET users error:", error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Check for duplicates
        const existingUsers = await getAppUsers();
        if (existingUsers.some(u => u.handle === body.handle)) {
            return NextResponse.json({ error: 'El nombre de usuario ya está en uso' }, { status: 400 });
        }
        if (existingUsers.some(u => u.email === body.email)) {
            return NextResponse.json({ error: 'El email ya está registrado' }, { status: 400 });
        }

        const newUser = await addAppUser({
            ...body,
            id: Date.now().toString(),
            joinedAt: new Date().toISOString()
        });

        return NextResponse.json(newUser);
    } catch (error) {
        console.error("Error creating user/creator:", error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, employeeName = 'Admin', ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const updated = await updateAppUser(id, updates);
        if (!updated) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const success = await deleteAppUser(id);
        if (!success) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
