import { NextResponse } from 'next/server';
import { supabaseAdmin, addNotification } from '@/lib/db';

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
    return NextResponse.json({ 
        success: false, 
        error: 'Acceso no autorizado. Las aprobaciones o rechazos de retiros deben realizarse a través del endpoint de comandos /api/voz/admin/approve-withdrawal.' 
    }, { status: 403 });
}
