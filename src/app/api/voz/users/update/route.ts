import { NextRequest, NextResponse } from "next/server";
import { updateAppUser } from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        // SECURITY FIX: Removed walletBalance from allowed explicitly updated fields by the client
        const { id, handle, name, bio, profile_image, profileImage, email, nationality, dob, phone } = body;

        const updates: any = {};
        if (handle) updates.handle = handle;
        if (name) updates.name = name;
        if (bio !== undefined) updates.bio = bio;
        if (profile_image || profileImage) updates.profile_image = profile_image || profileImage;
        if (email) updates.email = email;
        if (nationality) updates.nationality = nationality;
        if (dob) updates.dob = dob;
        if (phone) updates.phone = phone;

        const updated = await updateAppUser(id, updates);

        if (!updated) {
            return NextResponse.json({ error: "User not found or update failed" }, { status: 404 });
        }

        return NextResponse.json({ success: true, user: updated });

    } catch (error) {
        console.error("Update user error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
