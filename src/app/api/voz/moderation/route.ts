import { NextRequest, NextResponse } from "next/server";
import { getModerationQueue, updateModerationItem, addLog } from "@/lib/db";

export async function GET() {
    try {
        const queue = getModerationQueue();
        return NextResponse.json(queue);
    } catch (error) {
        console.error("Error fetching moderation queue:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, action, moderatorHandle } = body;

        if (!id || !action) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const statusMap: { [key: string]: 'pending' | 'approved' | 'rejected' } = {
            'keep': 'approved',
            'delete': 'rejected',
            'ban': 'rejected',
            'shadow_ban': 'pending'
        };

        const result = updateModerationItem(id, { status: statusMap[action] || 'pending' });

        if (!result) {
            return NextResponse.json({ error: "Item not found" }, { status: 404 });
        }

        // Registrar en los logs globales
        addLog({
            id: `log_${Date.now()}`,
            employeeName: moderatorHandle || "App Moderator",
            action: `Moderation: ${action}`,
            timestamp: new Date().toISOString(),
            details: `Item ID: ${id}`
        });

        return NextResponse.json({ success: true, item: result });

    } catch (error) {
        console.error("Moderation error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
