import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { data: alerts, error } = await supabaseAdmin
            .from('system_alerts')
            .select('*')
            .order('creado_en', { ascending: false });

        if (error) {
            console.error('Error fetching system alerts:', error);
            return NextResponse.json({ error: 'Failed to fetch system alerts' }, { status: 500 });
        }

        return NextResponse.json(alerts || []);
    } catch (e: any) {
        console.error('API alerts error:', e);
        return NextResponse.json({ error: e.message || 'Error fetching alerts' }, { status: 500 });
    }
}
