import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Helper: make a timed fetch request
async function timedFetch(url: string, options: RequestInit = {}): Promise<{ ok: boolean; status: number; latencyMs: number; data?: any }> {
    const start = Date.now();
    try {
        const res = await fetch(url, { ...options, signal: AbortSignal.timeout(8000) });
        const latencyMs = Date.now() - start;
        let data;
        try { data = await res.json(); } catch { /* ignore */ }
        return { ok: res.ok, status: res.status, latencyMs, data };
    } catch {
        return { ok: false, status: 0, latencyMs: Date.now() - start };
    }
}

export async function GET() {
    const metrics: Record<string, any> = {};

    // ─── 1. SUPABASE: Real DB stats via SQL ───────────────────────────────────
    try {
        // DB size
        const { data: sizeData } = await supabaseAdmin.rpc('get_db_stats');
        if (sizeData && sizeData[0]) {
            metrics.supabase = {
                dbSizeBytes: sizeData[0].db_size_bytes,
                dbSizeGB: parseFloat((sizeData[0].db_size_bytes / 1024 / 1024 / 1024).toFixed(2)),
                activeConnections: sizeData[0].active_connections,
                totalConnections: sizeData[0].total_connections,
            };
        }
    } catch { /* fallback below */ }

    // If RPC not available, query directly
    if (!metrics.supabase) {
        try {
            const { data: rawData, error } = await supabaseAdmin
                .from('_supabase_realtime_msgs_count' as any)
                .select('count');
            
            // Try a raw approach: check DB health via a simple query
            const { count: userCount } = await supabaseAdmin
                .from('app_users')
                .select('*', { count: 'exact', head: true });
            
            const { count: videoCount } = await supabaseAdmin
                .from('videos')
                .select('*', { count: 'exact', head: true });

            const { count: employeeCount } = await supabaseAdmin
                .from('employees')
                .select('*', { count: 'exact', head: true });

            metrics.supabase = {
                dbSizeGB: null, // Not available without RPC
                activeConnections: null,
                userCount: userCount ?? 0,
                videoCount: videoCount ?? 0,
                employeeCount: employeeCount ?? 0,
            };
        } catch (e) {
            metrics.supabase = { error: 'No disponible' };
        }
    }

    // Supabase latency check
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://thiftwzubmvcrdhuwcwm.supabase.co';
    const supabaseCheck = await timedFetch(`${supabaseUrl}/rest/v1/`, {
        headers: { 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '' }
    });
    metrics.supabase = {
        ...metrics.supabase,
        latencyMs: supabaseCheck.latencyMs,
        online: supabaseCheck.status === 200 || supabaseCheck.status === 401,
        // Supabase Pro plan = €25/month fixed
        monthlyCostEur: 25.00,
        plan: 'Pro',
    };

    // ─── 2. STRIPE: Real balance ───────────────────────────────────────────────
    try {
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (stripeKey && stripeKey.startsWith('sk_')) {
            const balanceRes = await timedFetch('https://api.stripe.com/v1/balance', {
                headers: { 'Authorization': `Bearer ${stripeKey}` }
            });
            if (balanceRes.ok && balanceRes.data) {
                const available = balanceRes.data.available || [];
                const eurBalance = available.find((b: any) => b.currency === 'eur');
                const usdBalance = available.find((b: any) => b.currency === 'usd');
                metrics.stripe = {
                    latencyMs: balanceRes.latencyMs,
                    online: true,
                    availableEur: eurBalance ? eurBalance.amount / 100 : null,
                    availableUsd: usdBalance ? usdBalance.amount / 100 : null,
                    // Stripe fee: 2.9% + 0.30€ per transaction — no fixed monthly cost
                    monthlyCostEur: null,
                    plan: 'Pay-per-use (2.9% + 0.30€)',
                };

                // Get recent charges count
                const chargesRes = await timedFetch('https://api.stripe.com/v1/charges?limit=100&created[gte]=' + Math.floor(Date.now()/1000 - 86400), {
                    headers: { 'Authorization': `Bearer ${stripeKey}` }
                });
                if (chargesRes.ok && chargesRes.data) {
                    metrics.stripe.chargesToday = chargesRes.data.data?.length ?? 0;
                    const revenue = (chargesRes.data.data || [])
                        .filter((c: any) => c.paid && !c.refunded)
                        .reduce((sum: number, c: any) => sum + (c.amount / 100), 0);
                    metrics.stripe.revenueToday = revenue;
                }
            }
        }
    } catch { /* ignore */ }

    if (!metrics.stripe) {
        const stripeCheck = await timedFetch('https://api.stripe.com/v1/charges', {
            headers: { 'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY || ''}` }
        });
        metrics.stripe = {
            latencyMs: stripeCheck.latencyMs,
            online: stripeCheck.ok,
            monthlyCostEur: null,
            plan: 'Pay-per-use',
        };
    }

    // ─── 3. VERCEL: Health + deployment info ──────────────────────────────────
    const vercelCheck = await timedFetch('https://server-taupe-six.vercel.app/api/health');
    metrics.vercel = {
        latencyMs: vercelCheck.latencyMs,
        online: vercelCheck.ok,
        // Vercel Pro plan = $20/month
        monthlyCostEur: 20.00,
        plan: 'Pro',
    };

    // ─── 4. OPENAI: Usage and balance ─────────────────────────────────────────
    try {
        const openaiKey = process.env.OPENAI_API_KEY;
        if (openaiKey && openaiKey.startsWith('sk-')) {
            // Check models endpoint as a lightweight ping
            const openaiCheck = await timedFetch('https://api.openai.com/v1/models', {
                headers: { 'Authorization': `Bearer ${openaiKey}` }
            });

            // Get usage for current month
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const usageRes = await timedFetch(
                `https://api.openai.com/v1/usage?date=${startOfMonth.toISOString().split('T')[0]}`,
                { headers: { 'Authorization': `Bearer ${openaiKey}` } }
            );

            metrics.openai = {
                latencyMs: openaiCheck.latencyMs,
                online: openaiCheck.ok,
                monthlyCostEur: null, // Dynamic
                plan: 'Pay-as-you-go',
            };

            if (usageRes.ok && usageRes.data) {
                // Total tokens this month → estimate cost
                const totalTokens = (usageRes.data.data || [])
                    .reduce((sum: number, d: any) => sum + (d.n_context_tokens_total || 0) + (d.n_generated_tokens_total || 0), 0);
                metrics.openai.totalTokensMonth = totalTokens;
                // GPT-4o-mini: $0.15/1M input, $0.60/1M output (rough estimate)
                metrics.openai.estimatedCostUsd = parseFloat((totalTokens / 1_000_000 * 0.30).toFixed(2));
            }
        }
    } catch { /* ignore */ }

    if (!metrics.openai) {
        const openaiCheck = await timedFetch('https://api.openai.com');
        metrics.openai = {
            latencyMs: openaiCheck.latencyMs,
            online: openaiCheck.status < 500,
            plan: 'Pay-as-you-go',
        };
    }

    // ─── 5. FIREBASE: FCM health check ───────────────────────────────────────
    const firebaseCheck = await timedFetch('https://fcm.googleapis.com');
    metrics.firebase = {
        latencyMs: firebaseCheck.latencyMs,
        online: firebaseCheck.status < 500,
        monthlyCostEur: 0.00,
        plan: 'Spark (Gratuito)',
    };

    // ─── 6. CLOUDFLARE R2: Account usage ─────────────────────────────────────
    try {
        const cfToken = process.env.CLOUDFLARE_R2_TOKEN;
        const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
        if (cfToken && cfAccountId) {
            const cfRes = await timedFetch(
                `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/r2/buckets`,
                { headers: { 'Authorization': `Bearer ${cfToken}` } }
            );
            if (cfRes.ok && cfRes.data?.result) {
                const buckets = cfRes.data.result;
                metrics.cloudflare = {
                    latencyMs: cfRes.latencyMs,
                    online: true,
                    buckets: buckets.length,
                    plan: 'R2 (10GB gratis / 0.015$/GB extra)',
                };
            }
        }
    } catch { /* ignore */ }

    if (!metrics.cloudflare) {
        const cfCheck = await timedFetch('https://cloudflare.com');
        metrics.cloudflare = {
            latencyMs: cfCheck.latencyMs,
            online: cfCheck.ok,
            plan: 'R2 Storage',
        };
    }

    // ─── Summary ──────────────────────────────────────────────────────────────
    const timestamp = new Date().toISOString();
    return NextResponse.json({ metrics, timestamp });
}
