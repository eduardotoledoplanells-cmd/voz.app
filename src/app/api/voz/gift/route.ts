import { NextResponse } from 'next/server';
import { addTransaction, getAppUsers, updateAppUser, addAppUser } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { senderHandle, receiverHandle, amount, videoId } = await request.json();

        if (!senderHandle || !receiverHandle || !amount) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. (Optional) Verify sender balance on server if possible
        // For now, we trust the optimistic update from App.js but record it accurately.

        // 2. Add Transaction to Global Log
        const transaction = {
            id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            senderId: senderHandle,
            receiverId: receiverHandle,
            amount: Number(amount),
            type: 'gift' as const,
            timestamp: new Date().toISOString(),
            videoId
        };

        addTransaction(transaction);

        // 3. Update Receiver Balance (if they are a creator in our DB)
        // Find receiver user by handle
        const users = getAppUsers();
        const receiver = users.find(u => u.handle === receiverHandle);

        if (receiver) {
            updateAppUser(receiver.id, {
                walletBalance: (receiver.walletBalance || 0) + Number(amount)
            });
        } else {
            // Auto-create user if it doesn't exist (e.g. Alex_Voz) so coins go somewhere
            addAppUser({
                id: `u_${Date.now()}`,
                handle: receiverHandle,
                email: 'temp@voz.app',
                status: 'active',
                reputation: 10,
                joinedAt: new Date().toISOString(),
                walletBalance: Number(amount)
            });
        }

        return NextResponse.json({ success: true, transaction });

    } catch (error) {
        console.error('Error processing gift:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
