import { NextResponse } from 'next/server';
import { getCreators } from '@/lib/db';

export async function GET() {
    try {
        const creators = getCreators();

        let totalTips = 0;
        let totalRevenueShared = 0;

        creators.forEach(c => {
            if (c.stats) {
                totalTips += c.stats.totalGifts;
                totalRevenueShared += c.earnedEuro;
            }
        });

        // Simulating "recent tips" by just returning nothing or mock, as strict transaction log is in 'logs' not structured easily
        // But the total count is real.

        return NextResponse.json({
            totalTips,
            totalRevenueShared
        });

    } catch (error) {
        console.error('Error getting voz analytics:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
