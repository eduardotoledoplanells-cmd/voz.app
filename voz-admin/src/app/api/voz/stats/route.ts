import { NextResponse } from 'next/server';
import { getViralStats, trackVideoEvent, getAppUsers, getLogs } from '@/lib/db';

export async function GET() {
    try {
        // 1. Viral Videos Stats
        const stats = getViralStats();
        const sortedVideos = stats.sort((a: any, b: any) => b.views - a.views);

        // 2. Top Donors Stats
        const users = getAppUsers();
        const donors = users
            .filter((u: any) => u.stats && u.stats.totalDonated > 0)
            .sort((a: any, b: any) => b.stats.totalDonated - a.stats.totalDonated)
            .slice(0, 10) // Top 10
            .map((u: any) => ({
                id: u.id,
                name: u.name || u.handle,
                handle: u.handle,
                donation: u.stats.totalDonated,
                avatarColor: '#' + Math.floor(Math.random() * 16777215).toString(16) // Random color for now
            }));

        // 3. Summary Stats
        const logs = getLogs();
        const today = new Date().toISOString().split('T')[0];
        // Count gift interactions today. Assuming 1 gift = 1 coin for simplicity in this view.
        const donationsToday = logs.filter((l: any) =>
            l.timestamp.startsWith(today) &&
            (l.action.includes('Regalo') || l.action.includes('Gift'))
        ).length;

        const activeUsers = users.filter((u: any) => u.status !== 'banned').length;

        // 4. Category Stats
        const categoryCounts: any = {};
        let totalVideos = stats.length;
        stats.forEach((v: any) => {
            const cat = v.category || 'General';
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });

        const categories = Object.keys(categoryCounts).map(cat => ({
            name: cat.charAt(0).toUpperCase() + cat.slice(1),
            count: totalVideos > 0 ? Math.round((categoryCounts[cat] / totalVideos) * 100) : 0,
            color: '#' + Math.floor(Math.random() * 16777215).toString(16) // Random color per category
        })).sort((a, b) => b.count - a.count);

        return NextResponse.json({
            videos: sortedVideos,
            donors: donors,
            summary: {
                donationsToday,
                activeUsers
            },
            categories: categories
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { videoId, event, videoData } = body;

        if (!videoId || !event) {
            return NextResponse.json({ error: 'Missing videoId or event' }, { status: 400 });
        }

        const result = trackVideoEvent(videoId, event, videoData);
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to track event' }, { status: 500 });
    }
}
