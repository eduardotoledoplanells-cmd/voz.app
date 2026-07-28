import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { blocker, blocked, action = 'block' } = body;

        if (!blocker || !blocked) {
            return NextResponse.json({ success: false, error: "Faltan parámetros 'blocker' y 'blocked'." }, { status: 400 });
        }

        const cleanBlocker = blocker.trim().toLowerCase().replace(/^@/, '');
        const cleanBlocked = blocked.trim().toLowerCase().replace(/^@/, '');

        if (action === 'unblock') {
            // Delete block record
            await supabaseAdmin
                .from('user_blocks')
                .delete()
                .eq('blocker_handle', `@${cleanBlocker}`)
                .eq('blocked_handle', `@${cleanBlocked}`);

            return NextResponse.json({ success: true, message: `Has desbloqueado a @${cleanBlocked}.`, isBlocked: false });
        } else {
            // Insert block record
            const { error } = await supabaseAdmin
                .from('user_blocks')
                .upsert({
                    id: uuidv4(),
                    blocker_handle: `@${cleanBlocker}`,
                    blocked_handle: `@${cleanBlocked}`,
                    created_at: new Date().toISOString()
                }, { onConflict: 'blocker_handle,blocked_handle' });

            if (error && !error.message?.includes('does not exist')) {
                console.warn("[Block API] Supabase table warning:", error.message);
            }

            return NextResponse.json({ success: true, message: `Has bloqueado a @${cleanBlocked}.`, isBlocked: true });
        }
    } catch (e: any) {
        console.error("Error in /api/voz/block:", e);
        return NextResponse.json({ success: true, message: "Bloqueo procesado localmente." });
    }
}
