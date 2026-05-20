import { NextResponse } from 'next/server';
import { getCoinSales, getBillingStats, getRedemptionRequests, getWithdrawalRequests, getCreators, getCampaigns, getCompanies } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const [sales, stats, redemptions, withdrawals, creators, campaigns, companies] = await Promise.all([
            getCoinSales(),
            getBillingStats(),
            getRedemptionRequests(),
            getWithdrawalRequests(),
            getCreators(),
            getCampaigns(),
            getCompanies()
        ]);

        return NextResponse.json({
            sales,
            stats,
            redemptions,
            withdrawals,
            creators,
            campaigns,
            companies
        });
    } catch (error: any) {
        console.error('Error fetching billing data:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch billing data' }, { status: 500 });
    }
}
