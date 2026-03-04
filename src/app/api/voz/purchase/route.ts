import { NextRequest, NextResponse } from "next/server";
import { updateAppUser, getAppUsers } from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, packId, amount } = body;

        if (!userId || !amount) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. En un sistema real, aquí verificaríamos con Stripe que el pago sea exitoso.
        // Por ahora, asumimos éxito ya que Stripe fue procesado en el cliente.

        // 2. Obtener balance actual
        const users = await getAppUsers();
        const user = users.find(u => u.id === userId);

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const currentBalance = Number(user.walletBalance || 0);
        const newBalance = currentBalance + Number(amount);

        // 3. Actualizar en la DB
        const updated = await updateAppUser(userId, {
            walletBalance: newBalance
        });

        if (!updated) {
            return NextResponse.json({ error: "Failed to update balance" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            newBalance: updated.walletBalance
        });

    } catch (error) {
        console.error("Purhcase error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
