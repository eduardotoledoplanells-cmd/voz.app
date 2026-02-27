import { NextRequest, NextResponse } from "next/server";
import { updateAppUser } from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, handle, name, bio, profile_image, profileImage, walletBalance } = body;

        if (!id) {
            return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
        }

        const updates: any = {};
        if (handle) updates.handle = handle;
        if (name) updates.name = name;
        if (bio) updates.bio = bio;
        if (profile_image || profileImage) updates.profile_image = profile_image || profileImage;
        if (walletBalance !== undefined) updates.walletBalance = walletBalance;

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
