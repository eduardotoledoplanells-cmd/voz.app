import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        // Count total active users
        const { count: userCount } = await supabaseAdmin
            .from('app_users')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'active');

        // Count total videos
        const { count: videoCount } = await supabaseAdmin
            .from('videos')
            .select('id', { count: 'exact', head: true });

        // Count creators
        const { count: creatorCount } = await supabaseAdmin
            .from('app_users')
            .select('id', { count: 'exact', head: true })
            .eq('is_creator', true);

        // Count waitlist
        const { count: waitlistCount } = await supabaseAdmin
            .from('waitlist')
            .select('id', { count: 'exact', head: true });

        return NextResponse.json({
            users: userCount || 0,
            videos: videoCount || 0,
            creators: creatorCount || 0,
            waitlist: waitlistCount || 0,
        });
    } catch (e) {
        return NextResponse.json({ users: 0, videos: 0, creators: 0, waitlist: 0 });
    }
}
