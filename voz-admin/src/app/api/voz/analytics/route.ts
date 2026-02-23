import { NextResponse } from 'next/server';
import { getCreators } from '@/lib/db';

export async function GET() {
    try {
        const creators = await getCreators();

        let totalTips = 0;
        let totalRevenueShared = 0;

        creators.forEach(c => {
            if (c.stats) {
                totalTips += c.stats.totalGifts;
                totalRevenueShared += c.earnedEuro;
            }
        });

        return NextResponse.json({
            totalTips,
            totalRevenueShared
        });

    } catch (error) {
        console.error('Error getting voz analytics:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
