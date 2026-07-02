import { NextRequest, NextResponse } from "next/server";
import { updateAppUser, getUserById } from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, handle, name, bio, profile_image, profileImage, profile_color, profileColor, privacySettings } = body;

        console.log(`[API Update] Attempting update for user ID: ${id || 'MISSING'}`);
        console.log(`[API Update] Payload:`, JSON.stringify({ handle, name, bio, profile_image, profileImage, profile_color, profileColor, privacySettings }));

        if (!id) {
            console.error("[API Update] Error: Missing user ID in request body");
            return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
        }

        const updates: any = {};
        if (handle !== undefined) updates.handle = handle;
        if (name !== undefined) updates.name = name;
        if (bio !== undefined) updates.bio = bio;
        
        // Handle both snake_case and camelCase
        if (profile_image || profileImage) {
            updates.profileImage = profile_image || profileImage;
        }
        if (profile_color || profileColor) {
            updates.profileColor = profile_color || profileColor;
        }

        if (privacySettings !== undefined) {
            // Merge with existing paymentInfo
            const currentUser = await getUserById(id);
            let currentPaymentInfo = currentUser?.paymentInfo || {};
            if (typeof currentPaymentInfo === 'string') {
                try { currentPaymentInfo = JSON.parse(currentPaymentInfo); } catch(e) {
                    console.error("Invalid paymentInfo JSON in users/update", e);
                }
            }
            updates.payment_info = {
                ...currentPaymentInfo,
                privacySettings: {
                    ...(currentPaymentInfo.privacySettings || {}),
                    ...privacySettings
                }
            };
        }

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
