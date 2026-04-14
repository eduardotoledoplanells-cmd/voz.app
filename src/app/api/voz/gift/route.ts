import { NextResponse } from 'next/server';
import { addTransaction, getAppUsers, updateAppUser, addAppUser } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { senderHandle, receiverHandle, amount, videoId } = await request.json();

        if (!senderHandle || !receiverHandle || !amount) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Validate Sender Balance
        const users = await getAppUsers();
        const sender = users.find(u => u.handle === senderHandle);
        const receiver = users.find(u => u.handle === receiverHandle);

        if (!sender) {
            return NextResponse.json({ error: 'Sender not found' }, { status: 404 });
        }

        const giftAmount = Number(amount);
        if (isNaN(giftAmount) || giftAmount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        if ((sender.walletBalance || 0) < giftAmount) {
            return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
        }

        // 2. Perform safe deduction from sender
        const newSenderBalance = (sender.walletBalance || 0) - giftAmount;
        const senderUpdated = await updateAppUser(sender.id, { walletBalance: newSenderBalance });

        if (!senderUpdated) {
            return NextResponse.json({ error: 'Failed to process transaction' }, { status: 500 });
        }

        // 3. Add Transaction Log to Supabase
        await addTransaction({
            senderHandle,
            receiverHandle,
            amount: giftAmount,
            type: 'gift',
            videoId
        });

        // 4. Update Receiver Balance (75% Commission for Creator, 25% for App)
        // Ensure atomic-style addition using the fresh receiver data
        const payoutAmount = giftAmount * 0.75;

        if (receiver) {
            await updateAppUser(receiver.id, {
                walletBalance: (receiver.walletBalance || 0) + payoutAmount
            });
        } else {
            // Auto-create user if it doesn't exist
            await addAppUser({
                id: crypto.randomUUID(),
                handle: receiverHandle,
                email: 'temp@voz.app',
                status: 'active',
                joinedAt: new Date().toISOString(),
                walletBalance: payoutAmount
            });
        }

        return NextResponse.json({ success: true, newSenderBalance });

    } catch (error) {
        console.error('Error processing gift:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
