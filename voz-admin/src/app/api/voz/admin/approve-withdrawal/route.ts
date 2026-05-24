import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    return NextResponse.json({ 
        success: false, 
        error: 'Las aprobaciones manuales de retiros han sido desactivadas. El sistema opera ahora de forma automática y 100% segura mediante Stripe Connect.' 
    }, { status: 400 });
}
