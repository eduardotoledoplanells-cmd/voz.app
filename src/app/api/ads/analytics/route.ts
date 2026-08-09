import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

export const dynamic = 'force-dynamic';

function corsHeaders(res: NextResponse) {
    res.headers.set('Access-Control-Allow-Origin', '*');
    res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res;
}

export async function OPTIONS() {
    return corsHeaders(new NextResponse(null, { status: 200 }));
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const campaignId = searchParams.get('campaignId') || 'all';
        const companyId  = searchParams.get('companyId')  || 'all';
        const dateRange  = searchParams.get('dateRange')  || '30d';

        // ---------- Calcular la fecha de inicio según el rango ----------
        const now = new Date();
        let startDate: Date;
        if (dateRange === '7d') {
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (dateRange === 'year') {
            startDate = new Date(now.getFullYear(), 0, 1); // 1 de enero del año actual
        } else {
            // default: 30d
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        const startIso = startDate.toISOString();

        // ---------- Obtener los campaign_ids en scope ----------
        // Si se filtra por companyId, primero resolvemos los IDs de campaña de esa empresa
        let campaignIds: string[] = [];

        if (campaignId !== 'all') {
            campaignIds = [campaignId];
        } else if (companyId !== 'all') {
            const { data: camps } = await supabaseAdmin
                .from('campaigns')
                .select('id')
                .eq('companyId', companyId);
            campaignIds = (camps || []).map((c: any) => c.id);
        }
        // Si ambos son 'all', no filtramos por campaña (toda la cuenta)

        // ---------- Helper para aplicar filtros en impresiones/clics ----------
        const applyFilters = (query: any) => {
            query = query.gte('created_at', startIso);
            if (campaignIds.length > 0) {
                query = query.in('campaign_id', campaignIds);
            }
            return query;
        };

        // ---------- 1. Total de impresiones y clics ----------
        let impressionsQuery = supabaseAdmin
            .from('ad_impressions')
            .select('id', { count: 'exact', head: true });
        impressionsQuery = applyFilters(impressionsQuery);
        const { count: totalImpressions, error: impErr } = await impressionsQuery;

        let clicksQuery = supabaseAdmin
            .from('ad_clicks')
            .select('id', { count: 'exact', head: true });
        clicksQuery = applyFilters(clicksQuery);
        const { count: totalClicks, error: clkErr } = await clicksQuery;

        if (impErr) console.error('[Ads Analytics] impressions error:', impErr.message);
        if (clkErr) console.error('[Ads Analytics] clicks error:', clkErr.message);

        const imp = totalImpressions ?? 0;
        const clk = totalClicks ?? 0;
        const ctr = imp > 0 ? parseFloat(((clk / imp) * 100).toFixed(2)) : 0;

        // ---------- 2. Distribución por canal (source_channel) ----------
        let devImpQuery = supabaseAdmin
            .from('ad_impressions')
            .select('source_channel');
        devImpQuery = applyFilters(devImpQuery);
        const { data: deviceRows } = await devImpQuery;

        const deviceMap: Record<string, number> = {
            app_ios: 0, app_android: 0, web_desktop: 0, web_mobile: 0,
        };
        (deviceRows || []).forEach((r: any) => {
            const ch: string = r.source_channel || 'web_mobile';
            if (ch in deviceMap) deviceMap[ch]++;
            else deviceMap['web_mobile']++;
        });

        const deviceData = [
            { name: 'App iOS',      value: deviceMap.app_ios },
            { name: 'App Android',  value: deviceMap.app_android },
            { name: 'Web Desktop',  value: deviceMap.web_desktop },
            { name: 'Web Mobile',   value: deviceMap.web_mobile },
        ];

        // ---------- 3. Retención de vídeo (view_duration_ms agrupado) ----------
        let retQuery = supabaseAdmin
            .from('ad_impressions')
            .select('view_duration_ms, completed');
        retQuery = applyFilters(retQuery);
        const { data: retRows } = await retQuery;

        // Calcular retención: cuántos registros llegaron al menos hasta cada cuartil
        // Para ello necesitamos la duración media o el flag 'completed'.
        // Estrategia simple: si no tenemos view_duration_ms real, usamos completed.
        const total = (retRows || []).length;
        let reached25 = 0, reached50 = 0, reached75 = 0, reached100 = 0;
        (retRows || []).forEach((r: any) => {
            const ms = r.view_duration_ms || 0;
            // Si ms es 0 y completed es true, contamos como 100%
            const pct = r.completed ? 100 : (ms > 0 ? Math.min(100, ms / 1000 * 5) : 0); // Estimación: 20s = 100%
            if (pct >= 25) reached25++;
            if (pct >= 50) reached50++;
            if (pct >= 75) reached75++;
            if (pct >= 100 || r.completed) reached100++;
        });

        const retentionData = total === 0 ? [
            { name: '3s',   rate: 0 },
            { name: '25%',  rate: 0 },
            { name: '50%',  rate: 0 },
            { name: '75%',  rate: 0 },
            { name: '100%', rate: 0 },
        ] : [
            { name: '3s',   rate: 100 },
            { name: '25%',  rate: parseFloat(((reached25  / total) * 100).toFixed(1)) },
            { name: '50%',  rate: parseFloat(((reached50  / total) * 100).toFixed(1)) },
            { name: '75%',  rate: parseFloat(((reached75  / total) * 100).toFixed(1)) },
            { name: '100%', rate: parseFloat(((reached100 / total) * 100).toFixed(1)) },
        ];

        // ---------- 4. Evolución temporal ----------
        // Agrupamos impresiones y clics por día (o mes si dateRange=year)
        let timeImpQuery = supabaseAdmin
            .from('ad_impressions')
            .select('created_at');
        timeImpQuery = applyFilters(timeImpQuery);
        const { data: timeImpRows } = await timeImpQuery;

        let timeClkQuery = supabaseAdmin
            .from('ad_clicks')
            .select('created_at');
        timeClkQuery = applyFilters(timeClkQuery);
        const { data: timeClkRows } = await timeClkQuery;

        const groupByKey = (rows: any[], mode: 'day' | 'month') => {
            const map: Record<string, number> = {};
            (rows || []).forEach((r: any) => {
                const d = new Date(r.created_at);
                const key = mode === 'month'
                    ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
                    : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                map[key] = (map[key] || 0) + 1;
            });
            return map;
        };

        const mode = dateRange === 'year' ? 'month' : 'day';
        const impByTime = groupByKey(timeImpRows || [], mode);
        const clkByTime = groupByKey(timeClkRows || [], mode);

        // Generar las etiquetas del eje X según el rango
        const timeLabels: string[] = [];
        const days = dateRange === '7d' ? 7 : dateRange === 'year' ? 12 : 30;

        if (dateRange === 'year') {
            for (let m = 0; m < 12; m++) {
                const d = new Date(now.getFullYear(), m, 1);
                timeLabels.push(`${d.getFullYear()}-${String(m + 1).padStart(2, '0')}`);
            }
        } else {
            for (let i = days - 1; i >= 0; i--) {
                const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                timeLabels.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
            }
        }

        const temporalData = timeLabels.map((key, idx) => ({
            name: dateRange === 'year'
                ? ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][idx]
                : `Día ${idx + 1}`,
            impressions: impByTime[key] || 0,
            clicks:      clkByTime[key] || 0,
        }));

        // ---------- 5. Presupuesto total (desde campaigns) ----------
        let budgetQuery = supabaseAdmin
            .from('campaigns')
            .select('budget, investment');
        if (campaignIds.length > 0) {
            budgetQuery = budgetQuery.in('id', campaignIds);
        } else if (companyId !== 'all') {
            budgetQuery = budgetQuery.eq('companyId', companyId);
        }
        const { data: budgetRows } = await budgetQuery;
        const totalBudget = (budgetRows || []).reduce((sum: number, c: any) =>
            sum + (c.investment || c.budget || 0), 0);

        // ---------- Respuesta final ----------
        return corsHeaders(NextResponse.json({
            success: true,
            metrics: {
                totalImpressions: imp,
                totalClicks:      clk,
                ctr,
                totalBudget,
                deviceData,
                retentionData,
                temporalData,
            }
        }));

    } catch (error: any) {
        console.error('[Ads Analytics] Unexpected error:', error.message);
        return corsHeaders(NextResponse.json(
            { success: false, error: 'Error interno al obtener métricas' },
            { status: 500 }
        ));
    }
}
