import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('withdrawal_requests')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json({ success: true, withdrawals: data });
    } catch (e) {
        return NextResponse.json({ success: false, error: 'Failed to fetch withdrawals' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const { id, status } = await request.json();

        if (!id || !status) {
            return NextResponse.json({ success: false, error: 'Missing id or status' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('withdrawal_requests')
            .update({ 
                status: status,
                processed_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ success: false, error: 'Failed to update withdrawal' }, { status: 500 });
    }
}
