import { NextResponse } from 'next/server';
import { supabaseAdmin, getAppUsers, getTransactions, getRedemptionRequests } from '@/lib/db';

export async function GET() {
    try {
        // 1. Fetch total verified incoming Stripe coins
        const { data: sales, error: salesError } = await supabaseAdmin
            .from('coin_sales')
            .select('*')
            .eq('status', 'succeeded');

        if (salesError) {
            console.error('Error fetching coin sales for audit:', salesError);
            return NextResponse.json({ error: 'Failed to fetch coin sales' }, { status: 500 });
        }

        const stripeCoinsExpected = (sales || []).reduce((sum, sale) => sum + (Number(sale.coins) || 0), 0);

        // 2. Fetch admin bonuses (system gifts/promos)
        const { data: bonuses, error: bonusError } = await supabaseAdmin
            .from('transactions')
            .select('*')
            .eq('type', 'admin_bonus');

        if (bonusError) console.error('Error fetching admin bonuses:', bonusError);
        const adminBonusCoinsExpected = (bonuses || []).reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

        const TOTAL_EXPECTED_SUPPLY = stripeCoinsExpected + adminBonusCoinsExpected;

        // 3. Fetch all users and calculate Real Circulating Supply
        const users = await getAppUsers();
        const TOTAL_CIRCULATING_SUPPLY = users.reduce((sum, user) => sum + (Number(user.walletBalance) || 0), 0);

        // 4. Calculate individual discrepancies (Per-User Audit)
        const allTransactions = await getTransactions();
        const allRedemptions = await getRedemptionRequests();

        const suspiciousUsers = [];

        for (const user of users) {
            // Find all Stripe purchases by this user
            const userSales = (sales || []).filter(s => s.user_handle === user.handle);
            const userBoughtCoins = userSales.reduce((sum, s) => sum + (Number(s.coins) || 0), 0);

            // Find all gifts/bonuses received by this user
            const receivedTxs = allTransactions.filter(t => t.receiverId === user.handle);
            const coinsReceived = receivedTxs.reduce((sum, t) => {
                if (t.type === 'gift') return sum + (Number(t.amount) * 0.75);
                if (t.type === 'donation') return sum + (Number(t.amount) * 0.75);
                if (t.type === 'pm_completed') return sum + Number(t.amount);
                if (t.type === 'admin_bonus') return sum + Number(t.amount);
                return sum;
            }, 0);

            // Find all gifts sent by this user
            const sentTxs = allTransactions.filter(t => t.senderId === user.handle);
            const coinsSent = sentTxs.reduce((sum, t) => {
                if (t.type === 'gift') return sum + Number(t.amount);
                if (t.type === 'donation') return sum + Number(t.amount);
                if (t.type === 'pm_locked') return sum + Number(t.amount);
                return sum;
            }, 0);

            // Find all redemptions by this user
            const userRedemptions = allRedemptions.filter(r => r.userHandle === user.handle);
            const coinsRedeemed = userRedemptions.reduce((sum: number, r: any) => {
                if (r.status !== 'rejected') return sum + Number(r.amount);
                return sum;
            }, 0);

            const expectedBalance = userBoughtCoins + coinsReceived - coinsSent - coinsRedeemed;

            // Allow a tiny float precision error just in case
            if ((user.walletBalance || 0) > expectedBalance + 0.1) {
                suspiciousUsers.push({
                    handle: user.handle,
                    currentBalance: Number(user.walletBalance || 0).toFixed(2),
                    expectedBalance: expectedBalance.toFixed(2),
                    discrepancy: (Number(user.walletBalance || 0) - expectedBalance).toFixed(2),
                    reason: 'Mathematically impossible balance detected'
                });
            }
        }

        const isBreached = TOTAL_CIRCULATING_SUPPLY > TOTAL_EXPECTED_SUPPLY + 0.1 || suspiciousUsers.length > 0;

        return NextResponse.json({
            status: isBreached ? 'BREACHED' : 'HEALTHY',
            globalMath: {
                totalCoinsFromStripe: stripeCoinsExpected,
                totalCoinsFromAdmins: adminBonusCoinsExpected,
                totalExpectedSupply: TOTAL_EXPECTED_SUPPLY,
                totalRealCirculatingSupply: TOTAL_CIRCULATING_SUPPLY,
                globalDiscrepancy: TOTAL_CIRCULATING_SUPPLY - TOTAL_EXPECTED_SUPPLY
            },
            suspiciousUsers
        });

    } catch (error) {
        console.error('Audit API error:', error);
        return NextResponse.json({ error: 'Internal server error during audit' }, { status: 500 });
    }
}
