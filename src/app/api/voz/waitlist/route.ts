import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, name } = body;

        if (!email || !email.includes('@')) {
            return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
        }

        // Check for duplicate
        const { data: existing } = await supabaseAdmin
            .from('waitlist')
            .select('id')
            .eq('email', email.toLowerCase().trim())
            .single();

        if (existing) {
            return NextResponse.json({ message: 'Ya estás en la lista de espera. ¡Te avisaremos pronto!' });
        }

        // Insert into waitlist
        const { error } = await supabaseAdmin
            .from('waitlist')
            .insert([{
                email: email.toLowerCase().trim(),
                name: name?.trim() || null,
                source: 'landing_page',
                created_at: new Date().toISOString()
            }]);

        if (error) {
            // Table may not exist yet — gracefully fail
            console.error('[Waitlist] Insert error:', error.message);
            return NextResponse.json({ message: '¡Apuntado! Te avisaremos en cuanto esté disponible.' });
        }

        return NextResponse.json({ message: '¡Perfecto! Ya estás en la lista de espera. Te avisaremos en cuanto lancemos.' });
    } catch (e) {
        console.error('[Waitlist] Error:', e);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
