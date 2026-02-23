import { NextRequest, NextResponse } from "next/server";
import { getModerationQueue, updateModerationItem } from "@/lib/db";

export async function GET() {
    try {
        const queue = await getModerationQueue();
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

        const result = await updateModerationItem(id, { status: statusMap[action] || 'pending' });

        if (!result) {
            return NextResponse.json({ error: "Item not found" }, { status: 404 });
        }

        // En Supabase podemos usar triggers o logs dedicados, 
        // por ahora el log de consola es suficiente o podrías añadir addLog async
        console.log(`Moderation action: ${action} by ${moderatorHandle} on item ${id}`);

        return NextResponse.json({ success: true, item: result });

    } catch (error) {
        console.error("Moderation error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
