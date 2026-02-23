import { NextRequest, NextResponse } from "next/server";
import { updateAppUser } from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, handle, name, bio, profileImage, walletBalance } = body;

        if (!id) {
            return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
        }

        // Map frontend fields (if any) to DB fields if they differ
        // Note: name/bio/profileImage might not be in the original AppUser interface,
        // so we might need to update the interface in lib/db.ts if we want to persist them.

        const updates: any = {};
        if (handle) updates.handle = handle;
        if (name) updates.name = name;
        if (bio) updates.bio = bio;
        if (profileImage) updates.profileImage = profileImage;
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
