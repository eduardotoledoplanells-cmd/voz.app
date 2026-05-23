import { NextResponse } from 'next/server';
import { getAppUsers, addTransaction, addNotification } from '@/lib/db';
import { processDonation } from '@/lib/ledger';

export async function POST(request: Request) {
    try {
        const { senderHandle, creatorHandle, amount } = await request.json();

        if (!senderHandle || !creatorHandle || !amount) {
            return NextResponse.json({ error: 'Faltan campos (senderHandle, creatorHandle, amount)' }, { status: 400 });
        }

        const users = await getAppUsers();
        const sender = users.find(u => u.handle === senderHandle);
        const creator = users.find(u => u.handle === creatorHandle);

        if (!sender || !creator) {
            return NextResponse.json({ error: 'Usuario o creador no encontrado' }, { status: 404 });
        }

        if (creator.privacySettings?.receive_donations === false) {
            return NextResponse.json({ error: 'Este creador ha desactivado la opción de recibir donaciones.' }, { status: 400 });
        }

        const donationAmount = Number(amount);
        if (isNaN(donationAmount) || donationAmount <= 0) {
            return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
        }

        // 1. Process donation via Ledger
        const idempotencyKey = `donation-${sender.id}-${creator.id}-${Date.now()}`;
        try {
            await processDonation(sender.id, creator.id, donationAmount, idempotencyKey);
        } catch (ledgerError: any) {
            console.error("Ledger Donation transaction failed:", ledgerError);
            return NextResponse.json({ error: ledgerError.message || 'Saldo insuficiente' }, { status: 400 });
        }

        const payoutAmount = donationAmount * 0.75;

        // 3. Registrar transacción
        await addTransaction({
            senderHandle: senderHandle,
            receiverHandle: creatorHandle,
            amount: donationAmount,
            type: 'donation'
        });

        // 4. Enviar notificación (El creador solo ve su parte en Euros)
        await addNotification({
            id: Date.now().toString(),
            recipientId: creatorHandle,
            type: 'donation',
            title: '¡Has recibido un apoyo! 💰',
            message: `Has recibido un apoyo de ${payoutAmount.toFixed(2)} € de ${senderHandle}.`,
            timestamp: new Date().toISOString(),
            readStatus: false
        });

        return NextResponse.json({ success: true, payoutAmount });

    } catch (error) {
        console.error('Error procesando donación:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
