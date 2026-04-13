import { NextResponse } from 'next/server';
import { getViralStats, trackVideoEvent, getAppUsers, getLogs, getVideos, getCoinSales, getTransactions } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. Basic Stats
        const [users, videos, coinSales, logs, transactions] = await Promise.all([
            getAppUsers(),
            getVideos(),
            getCoinSales(),
            getLogs(),
            getTransactions()
        ]);

        const today = new Date();
        const last7Days = new Date();
        last7Days.setDate(today.getDate() - 7);

        // 2. Growth & Registration Stats (Real)
        const dailyRegistrations: any = {};
        users.forEach(u => {
            const date = u.joinedAt ? new Date(u.joinedAt).toISOString().split('T')[0] : 'Unknown';
            dailyRegistrations[date] = (dailyRegistrations[date] || 0) + 1;
        });

        // 3. DAU Proxy (Unique users with activity in last 24h)
        const dayAgo = new Date();
        dayAgo.setHours(today.getHours() - 24);
        
        const activeUsersCount = new Set([
            ...logs.filter(l => new Date(l.timestamp) > dayAgo).map(l => l.employeeName), // Use employeeName as proxy if user logs exist
            ...coinSales.filter(s => new Date(s.timestamp) > dayAgo).map(s => s.user_handle)
        ]).size;

        // 4. Financial Status
        const totalRevenue = coinSales.reduce((acc, s) => acc + (parseFloat(s.price) || 0), 0);
        const revenueToday = coinSales
            .filter(s => new Date(s.timestamp).toDateString() === today.toDateString())
            .reduce((acc, s) => acc + (parseFloat(s.price) || 0), 0);

        // 5. Popular Content (Real views)
        const topVideos = [...videos].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);

        // 6. Interaction Stats (Tips/Gifts)
        const totalTips = transactions.filter(t => t.type === 'gift' || t.type === 'pm').length;
        const totalRevenueShared = transactions
            .filter(t => t.type === 'gift' || t.type === 'pm')
            .reduce((acc, t) => acc + (t.amount || 0), 0) * 0.05; // 5% shared logic

        // 6. Summary for Dashboard
        return NextResponse.json({
            totals: {
                users: users.length,
                videos: videos.length,
                revenue: totalRevenue,
                activeUsers: Math.max(activeUsersCount, 1) // Ensure at least 1 for UI
            },
            growth: {
                dailyRegistrations,
                revenueToday
            },
            videos: topVideos,
            creators: users.filter(u => u.isCreator).length,
            interactions: {
                totalTips,
                totalRevenueShared
            },
            system: {
                bandwidthEstimate: `${(videos.length * 4.5).toFixed(1)} GB`, // Estimated 4.5MB per video avg
                storageUsed: `${(videos.length * 12).toFixed(1)} MB` // Thumbnails + Metadata
            }
        });
    } catch (error: any) {
        console.error('Error fetching real-time stats:', error);
        return NextResponse.json({ error: 'Failed to fetch analytics', details: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { videoId, event, videoData } = body;

        if (!videoId || !event) {
            return NextResponse.json({ error: 'Missing videoId or event' }, { status: 400 });
        }

        const result = await trackVideoEvent(videoId, event, videoData);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error tracking event:', error);
        return NextResponse.json({ error: 'Failed to track event' }, { status: 500 });
    }
}

