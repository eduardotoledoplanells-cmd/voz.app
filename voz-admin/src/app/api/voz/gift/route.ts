import { NextResponse } from 'next/server';
import { getAppUsers, addCreatorCoinInteraction, addLog } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { senderHandle, receiverHandle, amount, videoId } = await request.json();

        if (!receiverHandle) {
            return NextResponse.json({ error: 'Missing receiverHandle' }, { status: 400 });
        }

        console.log(`[API GIFT] Processing gift from ${senderHandle} to ${receiverHandle}`);

        // 1. Find Creator by Handle (Case Insensitive)
        const users = await getAppUsers();
        const creator = users.find(u => u.handle.toLowerCase() === receiverHandle.toLowerCase());

        if (!creator) {
            console.warn(`[API GIFT] Receiver ${receiverHandle} is not a registered Creator. Ignoring revenue share.`);

            await addLog({
                id: `log-gift-fail-${Date.now()}`,
                employeeName: 'System API',
                action: 'Gift to Non-Creator',
                timestamp: new Date().toISOString(),
                details: `Gift from ${senderHandle} to ${receiverHandle} (not found in users)`
            });

            // Still return success to the App so it doesn't error out
            return NextResponse.json({ success: true, warning: 'Receiver not a creator' });
        }

        // 2. Add Revenue to Creator
        const updatedCreator = await addCreatorCoinInteraction(creator.id, 'gift', 'App Móvil', `From: ${senderHandle}, Video: ${videoId || 'N/A'}`);

        if (updatedCreator) {
            console.log(`[API GIFT] Success! Updated balance for ${creator.handle}`);
            return NextResponse.json({ success: true, newBalance: updatedCreator.walletBalance });
        } else {
            return NextResponse.json({ error: 'Failed to update creator' }, { status: 500 });
        }

    } catch (error) {
        console.error('[API GIFT] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
