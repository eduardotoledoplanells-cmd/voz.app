import { NextResponse } from 'next/server';
import { getAppUsers, updateAppUser } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { handle, amount } = await request.json();

        if (!handle || !amount || amount <= 0) {
            return NextResponse.json({ success: false, error: 'Datos inválidos' }, { status: 400 });
        }

        const users = await getAppUsers();
        const user = users.find(u => u.handle === handle);

        if (!user) {
            return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
        }

        const currentEarnings = user.earningsBalance || 0;
        if (currentEarnings < amount) {
            return NextResponse.json({ success: false, error: 'Saldo en cartera insuficiente' }, { status: 400 });
        }

        // Transferencia: Restar de Cartera, Sumar a Saldo
        await updateAppUser(user.id, {
            earningsBalance: currentEarnings - amount,
            walletBalance: (user.walletBalance || 0) + amount
        });

        return NextResponse.json({ 
            success: true, 
            newEarnings: currentEarnings - amount,
            newWallet: (user.walletBalance || 0) + amount
        });

    } catch (error) {
        console.error('Error in transfer:', error);
        return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
    }
}
