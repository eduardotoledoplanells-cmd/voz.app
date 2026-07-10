import { NextResponse } from 'next/server';
import { getUserById, getUserByHandle, addTransaction, addNotification } from '@/lib/db';
import { processDonation } from '@/lib/ledger';
import { logSystemAlert } from '@/lib/alerts';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { creatorHandle, senderHandle, userId: bodyUserId } = body;
        let amount = body.amount;

        let userId = request.headers.get('x-user-id');
        if (!userId) {
            if (bodyUserId) {
                userId = bodyUserId;
            } else if (senderHandle) {
                const senderByHandle = await getUserByHandle(senderHandle);
                if (senderByHandle) {
                    userId = senderByHandle.id;
                }
            }
        }

        if (!userId || !creatorHandle || !amount) {
            return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
        }

        const sender = await getUserById(userId);
        const creator = await getUserByHandle(creatorHandle);

        if (!sender || !creator) {
            return NextResponse.json({ error: 'Usuario o creador no encontrado' }, { status: 404 });
        }

        if (creator.privacySettings?.receive_donations === false) {
            return NextResponse.json({ error: 'Este creador ha desactivado la opción de recibir donaciones.' }, { status: 400 });
        }

        let donationAmount = typeof amount === 'string' ? Number(amount.replace(',', '.')) : Number(amount);
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
            senderHandle: sender.handle,
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
            message: `Has recibido un apoyo de ${payoutAmount.toFixed(2)} € de ${sender.handle}.`,
            timestamp: new Date().toISOString(),
            readStatus: false
        });

        return NextResponse.json({ success: true, payoutAmount });

    } catch (error) {
        console.error('Error procesando donación:', error);
        await logSystemAlert('Donaciones', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
