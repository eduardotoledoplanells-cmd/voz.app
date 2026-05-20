import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/ledger';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        // Enforce cron authorization check if a secret is configured
        const authHeader = request.headers.get('Authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Fetch DB-side reconciliation report
        const { data: report, error: rpcError } = await supabaseAdmin.rpc('reconcile_balances');
        if (rpcError) throw rpcError;

        const isHealthy = report.isHealthy;

        // 2. Log the reconciliation report to server console
        console.log(`[RECONCILIATION] Status: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'}, Available Drift: ${report.availableDrift}, Pending Drift: ${report.pendingDrift}`);

        // 3. Try logging to reconciliation_logs table
        try {
            await supabaseAdmin.from('reconciliation_logs').insert([{
                total_wallet_available: report.totalWalletAvailable,
                total_wallet_pending: report.totalWalletPending,
                total_ledger_available: report.totalLedgerAvailable,
                total_ledger_pending: report.totalLedgerPending,
                available_drift: report.availableDrift,
                pending_drift: report.pendingDrift,
                double_entry_imbalance: report.doubleEntryImbalance,
                total_minted: report.totalMinted,
                coins_in_circulation: report.coinsInCirculation,
                status: isHealthy ? 'HEALTHY' : 'DRIFT_DETECTED'
            }]);
        } catch (dbLogError) {
            console.error('[RECONCILIATION] Failed to write db log (table might not exist yet):', dbLogError);
        }

        return NextResponse.json({
            success: true,
            status: isHealthy ? 'HEALTHY' : 'DRIFT_DETECTED',
            report
        });
    } catch (e: any) {
        console.error('[CRON RECONCILE] Error:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
