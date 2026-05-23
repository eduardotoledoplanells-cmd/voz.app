import { NextResponse } from 'next/server';
import { addTransaction, getAppUsers, addAppUser, addNotification } from '@/lib/db';
import { processGift } from '@/lib/ledger';

export async function POST(request: Request) {
    try {
        const { senderHandle, receiverHandle, amount, videoId } = await request.json();

        if (!senderHandle || !receiverHandle || !amount) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const giftAmount = Number(amount);
        if (isNaN(giftAmount) || giftAmount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        const users = await getAppUsers();
        const sender = users.find(u => u.handle === senderHandle);
        let receiver: any = users.find(u => u.handle === receiverHandle);

        if (!sender) {
            return NextResponse.json({ error: 'Sender not found' }, { status: 404 });
        }

        if (!receiver) {
            // Auto-create user if it doesn't exist to ensure wallet creation works
            receiver = await addAppUser({
                id: crypto.randomUUID(),
                handle: receiverHandle,
                email: 'temp@voz.app',
                status: 'active',
                joinedAt: new Date().toISOString()
            });
            if (!receiver) {
                return NextResponse.json({ error: 'Failed to create receiver' }, { status: 500 });
            }
        }

        if (receiver.privacySettings?.receive_gifts === false) {
            return NextResponse.json({ error: 'Este creador ha desactivado la opción de recibir regalos.' }, { status: 400 });
        }

        // 1. Process via Ledger
        const idempotencyKey = `gift-${sender.id}-${receiver.id}-${Date.now()}`;
        try {
            await processGift(sender.id, receiver.id, giftAmount, idempotencyKey);
        } catch (ledgerError: any) {
            console.error("Ledger Gift transaction failed:", ledgerError);
            return NextResponse.json({ error: ledgerError.message || 'Transaction failed' }, { status: 400 });
        }

        // 2. Add Transaction Log to Supabase
        await addTransaction({
            senderHandle,
            receiverHandle,
            amount: giftAmount,
            type: 'gift',
            videoId
        });

        const payoutAmount = giftAmount * 0.65;

        // Fetch updated sender balance
        const updatedUsers = await getAppUsers();
        const updatedSender = updatedUsers.find(u => u.id === sender.id);
        const newSenderBalance = updatedSender ? updatedSender.walletBalance : 0;

        // 5. Enviar notificación (El creador solo ve su parte)
        await addNotification({
            id: Date.now().toString(),
            recipientId: receiverHandle,
            type: 'gift',
            title: '¡Te han enviado un regalo! 🎁',
            message: `${senderHandle} te ha apoyado con ${payoutAmount.toFixed(2)} €.`,
            timestamp: new Date().toISOString(),
            readStatus: false
        });

        return NextResponse.json({ success: true, newSenderBalance });

    } catch (error) {
        console.error('Error processing gift:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
