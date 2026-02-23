import { NextResponse } from 'next/server';
import { addCreatorCoinInteraction } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { creatorId, type, employeeName = 'Admin' } = body;

        if (!creatorId || !type) {
            return NextResponse.json({ error: 'Missing creatorId or type' }, { status: 400 });
        }

        const updatedCreator = await addCreatorCoinInteraction(creatorId, type, employeeName);
        if (!updatedCreator) {
            return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, creator: updatedCreator });
    } catch (error) {
        console.error('Error in creators/interact:', error);
        return NextResponse.json({ error: 'Failed to process interaction' }, { status: 500 });
    }
}
