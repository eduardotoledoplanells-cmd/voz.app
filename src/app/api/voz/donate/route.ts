import { NextResponse } from 'next/server';
import { getAppUsers, updateAppUser, addTransaction } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { senderHandle, creatorHandle, amount } = await request.json();

        if (!senderHandle || !creatorHandle || !amount) {
            return NextResponse.json({ error: 'Faltan campos (senderHandle, creatorHandle, amount)' }, { status: 400 });
        }

        const users = await getAppUsers();
        const sender = users.find(u => u.handle === senderHandle);
        const creator = users.find(u => u.handle === creatorHandle);

        if (!sender || (sender.walletBalance || 0) < amount) {
            return NextResponse.json({ error: 'Saldo insuficiente' }, { status: 400 });
        }

        // 1. Descontar 100% al sender
        await updateAppUser(sender.id, {
            walletBalance: (sender.walletBalance || 0) - amount
        });

        // 2. Sumar 75% al creador (25% se queda la app)
        const payoutAmount = amount * 0.75;

        if (creator) {
            await updateAppUser(creator.id, {
                earningsBalance: (creator.earningsBalance || 0) + payoutAmount
            });
        }

        // 3. Registrar transacción
        await addTransaction({
            senderHandle: senderHandle,
            receiverHandle: creatorHandle,
            amount: amount,
            type: 'donation'
        });

        return NextResponse.json({ success: true, payoutAmount });

    } catch (error) {
        console.error('Error procesando donación:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
