import { NextRequest, NextResponse } from "next/server";
import { updateAppUser } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, handle, name, bio, profile_image, profileImage, email, nationality, dob, phone } = body;

        console.log(`[API Update] Attempting update for user ID: ${id || 'MISSING'}`);
        console.log(`[API Update] Payload received:`, JSON.stringify({ handle, name, bio, profile_image, profileImage, email, nationality, dob, phone }));

        if (!id) {
            console.error("[API Update] Error: Missing user ID in request body");
            return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
        }

        const updates: any = {};
        if (handle !== undefined) updates.handle = handle;
        if (name !== undefined) updates.name = name;
        if (bio !== undefined) updates.bio = bio;
        
        // Handle both snake_case and camelCase for profile image
        if (profile_image || profileImage) {
            updates.profileImage = profile_image || profileImage;
        }

        // Include additional fields used by the mobile app
        if (email !== undefined) updates.email = email;
        if (nationality !== undefined) updates.nationality = nationality;
        if (dob !== undefined) updates.dob = dob;
        if (phone !== undefined) updates.phone = phone;

        const updated = await updateAppUser(id, updates);

        if (!updated) {
            console.error(`[API Update] Failed to update user ${id}. updateAppUser returned null.`);
            return NextResponse.json({ error: "User not found or update failed" }, { status: 404 });
        }

        console.log(`[API Update] Success for user ${id}`);
        return NextResponse.json({ success: true, user: updated });

    } catch (error) {
        console.error("Update user error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
