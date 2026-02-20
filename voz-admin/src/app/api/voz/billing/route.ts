import { NextResponse } from 'next/server';
import { getCoinSales, getBillingStats, getRedemptionRequests, getCreators, getCampaigns, getCompanies } from '@/lib/db';

export async function GET() {
    try {
        const sales = getCoinSales();
        const stats = getBillingStats();
        const redemptions = getRedemptionRequests();
        const creators = getCreators();

        return NextResponse.json({
            sales,
            stats,
            redemptions,
            creators,
            campaigns: getCampaigns(),
            companies: getCompanies()
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch billing data' }, { status: 500 });
    }
}
