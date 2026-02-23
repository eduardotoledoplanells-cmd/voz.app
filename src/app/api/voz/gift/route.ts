import { NextResponse } from 'next/server';
import { addTransaction, getAppUsers, updateAppUser, addAppUser } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { senderHandle, receiverHandle, amount, videoId } = await request.json();

        if (!senderHandle || !receiverHandle || !amount) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Add Transaction to Supabase
        await addTransaction({
            senderHandle,
            receiverHandle,
            amount: Number(amount),
            type: 'gift',
            videoId
        });

        // 2. Update Receiver Balance
        const users = await getAppUsers();
        const receiver = users.find(u => u.handle === receiverHandle);

        if (receiver) {
            await updateAppUser(receiver.id, {
                walletBalance: (receiver.walletBalance || 0) + Number(amount)
            });
        } else {
            // Auto-create user if it doesn't exist
            await addAppUser({
                id: crypto.randomUUID(),
                handle: receiverHandle,
                email: 'temp@voz.app',
                status: 'active',
                reputation: 10,
                joinedAt: new Date().toISOString(),
                walletBalance: Number(amount)
            });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error processing gift:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
