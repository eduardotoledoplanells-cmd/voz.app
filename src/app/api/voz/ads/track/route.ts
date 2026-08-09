import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

export const dynamic = 'force-dynamic';

function cors(res: NextResponse) {
    res.headers.set('Access-Control-Allow-Origin', '*');
    res.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-handle');
    return res;
}

export async function OPTIONS() {
    return cors(new NextResponse(null, { status: 200 }));
}

/**
 * POST /api/voz/ads/track
 *
 * Body JSON:
 * {
 *   event:           'impression' | 'click'         — required
 *   campaignId:      string                          — required
 *   userHandle:      string | null                  — optional (anon users)
 *   source_channel:  'app_ios' | 'app_android' | 'web_desktop' | 'web_mobile'
 *   view_duration_ms: number                        — for impression only
 *   completed:       boolean                        — for impression only
 * }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            event,
            campaignId,
            userHandle = null,
            source_channel = 'app_android',
            view_duration_ms = 0,
            completed = false,
        } = body;

        // ── Validaciones básicas ────────────────────────────────────────────
        if (!event || !campaignId) {
            return cors(NextResponse.json(
                { success: false, error: 'Parámetros requeridos: event, campaignId' },
                { status: 400 }
            ));
        }

        const VALID_EVENTS = ['impression', 'click'];
        if (!VALID_EVENTS.includes(event)) {
            return cors(NextResponse.json(
                { success: false, error: `Evento no válido. Use: ${VALID_EVENTS.join(' | ')}` },
                { status: 400 }
            ));
        }

        const VALID_CHANNELS = ['app_ios', 'app_android', 'web_desktop', 'web_mobile'];
        const channel = VALID_CHANNELS.includes(source_channel) ? source_channel : 'app_android';

        // ── Verificar que la campaña existe y está activa ───────────────────
        const { data: campaign, error: campaignError } = await supabaseAdmin
            .from('campaigns')
            .select('id, status')
            .eq('id', campaignId)
            .maybeSingle();

        if (campaignError || !campaign) {
            console.warn(`[Ads Track] Campaign not found: ${campaignId}`);
            return cors(NextResponse.json(
                { success: false, error: 'Campaña no encontrada' },
                { status: 404 }
            ));
        }

        // Permitimos registrar incluso si está 'completed' (para no perder datos de cierre),
        // pero no si está 'paused' o 'draft'
        if (campaign.status === 'paused' || campaign.status === 'draft') {
            return cors(NextResponse.json({ success: true, skipped: true, reason: 'campaign_not_active' }));
        }

        // ── Registrar el evento ─────────────────────────────────────────────
        if (event === 'impression') {
            const { error: insertError } = await supabaseAdmin
                .from('ad_impressions')
                .insert({
                    campaign_id:      campaignId,
                    user_handle:      userHandle,
                    source_channel:   channel,
                    view_duration_ms: Math.max(0, Number(view_duration_ms) || 0),
                    completed:        Boolean(completed),
                });

            if (insertError) {
                console.error('[Ads Track] Insert impression error:', insertError.message);
                return cors(NextResponse.json(
                    { success: false, error: 'Error al registrar impresión' },
                    { status: 500 }
                ));
            }

            // Incrementar el contador en la tabla campaigns
            await supabaseAdmin.rpc('increment_campaign_impressions', { p_campaign_id: campaignId })
                .then(({ error }) => {
                    if (error) {
                        // Fallback: update directo si el RPC no existe aún
                        return supabaseAdmin
                            .from('campaigns')
                            .update({ impressions: supabaseAdmin.raw('impressions + 1') as any })
                            .eq('id', campaignId);
                    }
                });

            console.log(`[Ads Track] Impression recorded — campaign: ${campaignId}, channel: ${channel}, duration: ${view_duration_ms}ms, completed: ${completed}`);

        } else if (event === 'click') {
            const { error: insertError } = await supabaseAdmin
                .from('ad_clicks')
                .insert({
                    campaign_id:    campaignId,
                    user_handle:    userHandle,
                    source_channel: channel,
                });

            if (insertError) {
                console.error('[Ads Track] Insert click error:', insertError.message);
                return cors(NextResponse.json(
                    { success: false, error: 'Error al registrar clic' },
                    { status: 500 }
                ));
            }

            console.log(`[Ads Track] Click recorded — campaign: ${campaignId}, user: ${userHandle}, channel: ${channel}`);
        }

        return cors(NextResponse.json({ success: true, event, campaignId }));

    } catch (error: any) {
        console.error('[Ads Track] Unexpected error:', error.message);
        return cors(NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        ));
    }
}
