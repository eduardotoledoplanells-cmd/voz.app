import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const handle = searchParams.get("handle");

        if (!handle) {
            return NextResponse.json({ error: "Missing handle parameter" }, { status: 400 });
        }

        // 1. Fetch Transactions (Gifts received or Transfers sent)
        const { data: transactions, error: txError } = await supabaseAdmin
            .from("transactions")
            .select("*")
            .or(`receiver_handle.eq.${handle},sender_handle.eq.${handle}`)
            .order("timestamp", { ascending: false })
            .limit(20);

        if (txError) throw txError;

        // 2. Fetch Withdrawal Requests
        const { data: withdrawals, error: wError } = await supabaseAdmin
            .from("withdrawal_requests")
            .select("*")
            .eq("user_handle", handle)
            .order("created_at", { ascending: false })
            .limit(10);

        if (wError) throw wError;

        // 3. Merge and unify format
        const activity = [
            ...transactions.map(t => ({
                id: t.id,
                type: t.type === 'gift' ? 'RECOMPENSA' : t.type === 'refund' ? 'DEVOLUCIÓN' : 'TRASPASO',
                kind: t.receiver_handle === handle ? 'in' : 'out',
                amount: t.amount,
                date: t.timestamp,
                status: 'COMPLETADO',
                details: t.type === 'gift' ? 'Regalo recibido' : 'Enviado a Saldo'
            })),
            ...withdrawals.map(w => ({
                id: w.id,
                type: 'RETIRO',
                kind: 'out',
                amount: w.amount,
                date: w.created_at,
                status: w.status.toUpperCase(),
                details: `Retiro vía ${w.method.toUpperCase()}`
            }))
        ];

        // Sort by date descending
        activity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return NextResponse.json({ success: true, activity });

    } catch (error: any) {
        console.error("GET history error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
