import { NextResponse } from 'next/server';
import { getAppUsers, updateAppUser, addWithdrawalRequest } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { handle, amount, method, details } = await request.json();

        if (!handle || !amount || amount < 50 || !method || !details) {
            return NextResponse.json({ success: false, error: 'La cantidad mínima de retiro es 50 🪙' }, { status: 400 });
        }

        const users = await getAppUsers();
        const user = users.find(u => u.handle === handle);

        if (!user) {
            return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
        }

        const currentEarnings = user.earningsBalance || 0;
        if (currentEarnings < amount) {
            return NextResponse.json({ success: false, error: 'Saldo insuficiente en Cartera' }, { status: 400 });
        }

        // 1. Crear la solicitud oficial en la DB
        const success = await addWithdrawalRequest({
            userId: user.id,
            userHandle: handle,
            amount: amount,
            method: method,
            details: details
        });

        if (!success) {
            return NextResponse.json({ success: false, error: 'Error al registrar la solicitud' }, { status: 500 });
        }

        // 2. Descontar de la Cartera (se queda "en el aire" hasta que el admin la procese o rechace)
        // Nota: En una fase más avanzada podríamos marcarla como 'blocked' o 'pending_withdrawal'
        await updateAppUser(user.id, {
            earningsBalance: currentEarnings - amount
        });

        return NextResponse.json({ 
            success: true, 
            newEarnings: currentEarnings - amount
        });

    } catch (error) {
        console.error('Error in withdraw:', error);
        return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
    }
}
