import { NextResponse } from 'next/server';
import { addPenaltyToUser, addNotification } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { handle, reason } = body;

        if (!handle || !reason) {
            return NextResponse.json({ error: 'Handle and reason are required' }, { status: 400 });
        }

        // 1. Add penalty (increments strikes and checks for auto-ban)
        await addPenaltyToUser(handle, { reason });

        // 2. Send professional notification to the user
        await addNotification({
            id: Date.now().toString(),
            recipientId: handle,
            type: 'moderation',
            title: 'VOZ', // Using VOZ as title for the indicator
            message: `Has sido penalizado con un strike debido a un incumplimiento de las normas de la comunidad (${reason}). Recuerda que al acumular 3 strikes, tu cuenta será suspendida permanentemente.`,
            timestamp: new Date().toISOString(),
            readStatus: false
        });

        return NextResponse.json({ success: true, message: 'Penalty applied and user notified' });
    } catch (error: any) {
        console.error("Strike API error:", error);
        return NextResponse.json({ error: error.message || 'Failed to apply strike' }, { status: 500 });
    }
}
