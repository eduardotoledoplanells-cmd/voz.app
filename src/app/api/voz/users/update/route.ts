import { NextRequest, NextResponse } from "next/server";
import { updateAppUser } from "@/lib/db";
import { logSystemAlert } from '@/lib/alerts';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, handle, name, bio, profile_image, profileImage, profile_color, email, nationality, dob, phone, notificationSettings, privacySettings, pushToken, is_live, live_url, country, region, interests } = body;

        console.log(`[API Update] Attempting update for user ID: ${id || 'MISSING'}`);
        console.log(`[API Update] Payload received:`, JSON.stringify({ handle, name, bio, profile_image, profileImage, profile_color, email, nationality, dob, phone, pushToken, privacySettings, is_live, live_url, country, region, interests }));

        if (!id && !handle) {
            console.error("[API Update] Error: Missing user ID and handle in request body");
            return NextResponse.json({ error: "Missing user ID and handle" }, { status: 400 });
        }

        const updates: any = {};
        if (handle !== undefined) updates.handle = handle;
        if (name !== undefined) updates.name = name;
        if (bio !== undefined) updates.bio = bio;
        
        // Handle both snake_case and camelCase for profile image
        if (profile_image || profileImage) {
            updates.profileImage = profile_image || profileImage;
        }
        if (profile_color) updates.profile_color = profile_color;

        // Include additional fields used by the mobile app
        if (email !== undefined) updates.email = email;
        if (nationality !== undefined) updates.nationality = nationality;
        if (dob !== undefined) updates.dob = dob;
        if (phone !== undefined) updates.phone = phone;
        if (notificationSettings !== undefined) updates.notificationSettings = notificationSettings;
        if (privacySettings !== undefined) updates.privacySettings = privacySettings;
        if (pushToken !== undefined) updates.pushToken = pushToken;
        if (is_live !== undefined) updates.is_live = is_live;
        if (live_url !== undefined) updates.live_url = live_url;
        // Segmentación publicitaria
        if (country !== undefined) updates.country = country;
        if (region !== undefined) updates.region = region;
        if (interests !== undefined) updates.interests = interests;

        const updated = await updateAppUser(id, updates);

        if (!updated) {
            console.error(`[API Update] Failed to update user ${id}. updateAppUser returned null.`);
            return NextResponse.json({ error: "User not found or update failed" }, { status: 404 });
        }

        console.log(`[API Update] Success for user ${id}`);
        return NextResponse.json({ success: true, user: updated });

    } catch (error) {
        console.error("Update user error:", error);
        await logSystemAlert('Usuarios', error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
