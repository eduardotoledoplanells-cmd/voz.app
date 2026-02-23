import { NextResponse } from 'next/server';
import { getTransactions } from '@/lib/db';

export async function GET() {
    try {
        const transactions = await getTransactions();

        const totalTips = transactions
            .filter(t => t.type === 'gift')
            .reduce((sum, t) => sum + t.amount, 0);

        const recentTips = transactions
            .filter(t => t.type === 'gift')
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 5);

        return NextResponse.json({
            totalTips,
            recentTips
        });

    } catch (error) {
        console.error('Error getting voz analytics:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
