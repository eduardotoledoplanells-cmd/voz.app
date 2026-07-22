import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { firma, id } = body;

        if (!firma && !id) {
            return NextResponse.json({ error: 'Falta firma o id' }, { status: 400 });
        }

        let query = supabaseAdmin.from('system_alerts').update({
            metadata_json: { solucionado: true }
        });

        // Supabase jsonb update doesn't natively merge with simple update() like this if there's existing data, 
        // but wait, if we just overwrite metadata_json it might erase other metadata!
        // To be safe and simple, let's just fetch the items first and update them individually,
        // or since this is a rare action, we can fetch all matching and update them with merged metadata.
        
        let fetchQuery = supabaseAdmin.from('system_alerts').select('id, metadata_json');
        if (firma) {
            fetchQuery = fetchQuery.eq('firma', firma);
        } else {
            fetchQuery = fetchQuery.eq('id', id);
        }

        const { data: alerts, error: fetchErr } = await fetchQuery;
        
        if (fetchErr) {
            throw fetchErr;
        }

        const updates = alerts.map(alert => {
            const newMeta = { ...(alert.metadata_json || {}), solucionado: true };
            return supabaseAdmin.from('system_alerts').update({ metadata_json: newMeta }).eq('id', alert.id);
        });

        await Promise.all(updates);

        return NextResponse.json({ success: true, updated: updates.length });
    } catch (e: any) {
        console.error('API solve alert error:', e);
        return NextResponse.json({ error: e.message || 'Error updating alert' }, { status: 500 });
    }
}
