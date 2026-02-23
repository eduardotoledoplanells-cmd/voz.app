import { NextResponse } from 'next/server';
import { getCoinSales, getBillingStats, getRedemptionRequests, getCreators, getCampaigns, getCompanies } from '@/lib/db';

export async function GET() {
    try {
        const [sales, stats, redemptions, creators, campaigns, companies] = await Promise.all([
            getCoinSales(),
            getBillingStats(),
            getRedemptionRequests(),
            getCreators(),
            getCampaigns(),
            getCompanies()
        ]);

        return NextResponse.json({
            sales,
            stats,
            redemptions,
            creators,
            campaigns,
            companies
        });
    } catch (error) {
        console.error('Error fetching billing data:', error);
        return NextResponse.json({ error: 'Failed to fetch billing data' }, { status: 500 });
    }
}
