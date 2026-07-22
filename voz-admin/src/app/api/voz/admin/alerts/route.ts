import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const grouped = searchParams.get('grouped') === 'true';
        const nivel = searchParams.get('nivel');       // filtrar por nivel
        const servicio = searchParams.get('servicio'); // filtrar por servicio
        const showSolved = searchParams.get('showSolved') === 'true';

        if (grouped) {
            // Vista agrupada: un registro por firma, ordenado por ocurrencias DESC
            // Para errores sin firma (legacy), se tratan como grupo propio
            let query = supabaseAdmin
                .from('system_alerts')
                .select('id, servicio, nivel, mensaje_error, stack, usuario, plataforma, version_app, pantalla, metadata_json, firma, ocurrencias, usuarios_unicos, primera_vez, ultima_vez, creado_en')
                .order('ocurrencias', { ascending: false })
                .order('ultima_vez', { ascending: false });

            if (!showSolved) {
                query = query.filter('metadata_json->solucionado', 'is', 'null');
            }

            // Filtrar por firma única: tomar el registro más reciente de cada firma
            // Supabase no soporta DISTINCT ON directamente — devolvemos todos y
            // el cliente agrupa. Para grandes volúmenes considerar una vista SQL.
            if (nivel) query = query.eq('nivel', nivel);
            if (servicio) query = query.eq('servicio', servicio);

            const { data, error } = await query.limit(200);

            if (error) {
                console.error('Error fetching grouped alerts:', error);
                return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
            }

            // Deduplicar en servidor: mantener solo el registro con más ocurrencias por firma
            const byFirma = new Map<string, any>();
            for (const row of (data || [])) {
                const key = row.firma || `no-firma-${row.id}`;
                if (!byFirma.has(key) || row.ocurrencias > byFirma.get(key).ocurrencias) {
                    byFirma.set(key, row);
                }
            }

            return NextResponse.json(Array.from(byFirma.values()));
        }

        // Vista individual (sin agrupar) — para ver todos los eventos
        let query = supabaseAdmin
            .from('system_alerts')
            .select('*')
            .order('creado_en', { ascending: false })
            .limit(500);
            
        if (!showSolved) {
            query = query.filter('metadata_json->solucionado', 'is', 'null');
        }

        if (nivel) query = query.eq('nivel', nivel);
        if (servicio) query = query.eq('servicio', servicio);

        const { data: alerts, error } = await query;

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
