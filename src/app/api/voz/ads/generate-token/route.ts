import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { campaign_id, duration_days = 30 } = body;

        if (!campaign_id) {
            return NextResponse.json({ error: 'campaign_id is required' }, { status: 400 });
        }

        // Initialize Supabase with service role to bypass RLS (since this is internal admin tool)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + duration_days);

        const { data, error } = await supabase
            .from('ad_magic_links')
            .insert([
                {
                    campaign_id,
                    expires_at: expiresAt.toISOString(),
                }
            ])
            .select()
            .single();

        if (error) {
            throw error;
        }

        const magicLink = `https://ads.lyvo.media/report/${data.token_id}`;

        return NextResponse.json({ success: true, magicLink, expiresAt: data.expires_at, token_id: data.token_id });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Error generating token' }, { status: 500 });
    }
}
