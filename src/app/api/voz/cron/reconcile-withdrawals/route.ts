import { NextResponse } from 'next/server';
import { supabaseAdmin, addNotification } from '@/lib/db';
import { executeLedgerTransaction, getOrCreateUserWallet, SYSTEM_WALLETS } from '@/lib/ledger';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const ageMinutes = parseInt(url.searchParams.get('age') || '5', 10);
        
        console.log(`[Reconciliation Cron] Starting scan for stuck withdrawals older than ${ageMinutes} minutes...`);

        // Calculate time threshold
        const thresholdDate = new Date();
        thresholdDate.setMinutes(thresholdDate.getMinutes() - ageMinutes);
        const thresholdIso = thresholdDate.toISOString();

        // 1. Fetch withdrawal requests stuck in 'processing' or 'stripe_submitted'
        const { data: stuckRequests, error: fetchError } = await supabaseAdmin
            .from('withdrawal_requests')
            .select('*')
            .in('status', ['processing', 'stripe_submitted'])
            .lt('created_at', thresholdIso);

        if (fetchError) {
            console.error('[Reconciliation Cron] Error fetching stuck requests:', fetchError);
            return NextResponse.json({ success: false, error: 'Database query failed' }, { status: 500 });
        }

        console.log(`[Reconciliation Cron] Found ${stuckRequests?.length || 0} stuck requests to reconcile.`);
        
        const results = [];

        if (stuckRequests && stuckRequests.length > 0) {
            for (const requestRow of stuckRequests) {
                const reqId = requestRow.id;
                const userId = requestRow.user_id;
                const amount = parseFloat(requestRow.amount);
                const amountMicro = Math.round(amount * 1000);
                const vozFee = parseFloat(requestRow.fee_amount || (amount * 0.25).toFixed(2));
                const creatorNet = parseFloat(requestRow.net_amount || (amount * 0.75).toFixed(2));
                
                console.log(`[Reconciliation Cron] Reconciling withdrawal ${reqId} for user ${userId} ($${amount})...`);

                try {
                    // Fetch user's stripe details
                    const { data: user, error: userError } = await supabaseAdmin
                        .from('app_users')
                        .select('stripe_account_id, handle, name')
                        .eq('id', userId)
                        .single();

                    if (userError || !user) {
                        console.error(`[Reconciliation Cron] User not found for request ${reqId}:`, userError);
                        continue;
                    }

                    if (!user.stripe_account_id) {
                        console.warn(`[Reconciliation Cron] No stripe account for user in request ${reqId}. Reversing.`);
                        await reverseWithdrawal(reqId, userId, amountMicro, 'No Stripe account linked');
                        results.push({ id: reqId, status: 'reversed', reason: 'No Stripe account linked' });
                        continue;
                    }

                    // Check if transfer exists in Stripe Connect by listing transfers and filtering by metadata
                    const transfersList = await stripe.transfers.list({
                        destination: user.stripe_account_id,
                        limit: 100
                    });

                    const existingTransfer = transfersList.data.find(
                        (t: any) => t.metadata && t.metadata.withdrawal_id === reqId
                    );

                    if (existingTransfer) {
                        console.log(`[Reconciliation Cron] Found matching Stripe transfer ${existingTransfer.id} for request ${reqId}. Confirming.`);
                        
                        // Execute confirmation transaction in Ledger (WITHDRAWALS_PENDING -> EXTERNAL_WORLD)
                        try {
                            await executeLedgerTransaction(
                                'WITHDRAWAL_CONFIRM',
                                [
                                    { wallet_id: SYSTEM_WALLETS.WITHDRAWALS_PENDING.id, entry_type: 'AVAILABLE', amount: -amountMicro },
                                    { wallet_id: SYSTEM_WALLETS.EXTERNAL_WORLD.id, entry_type: 'AVAILABLE', amount: amountMicro }
                                ],
                                reqId,
                                `confirm_${reqId}`,
                                { stripe_transfer_id: existingTransfer.id, reconciled: true }
                            );
                        } catch (err: any) {
                            // If it fails because it was already confirmed, that's fine. Otherwise, log it.
                            if (!err.message.includes('unique constraint') && !err.message.includes('idempotency')) {
                                console.error(`[Reconciliation Cron] Ledger confirmation failed for ${reqId}:`, err);
                            }
                        }

                        // Update request to approved
                        const stripeRequestId = (existingTransfer as any).lastResponse?.headers?.get('request-id') || null;
                        await supabaseAdmin
                            .from('withdrawal_requests')
                            .update({
                                status: 'approved',
                                stripe_transfer_id: existingTransfer.id,
                                details: {
                                    stripe_transfer_id: existingTransfer.id,
                                    net_amount: creatorNet,
                                    fee_amount: vozFee,
                                    stripe_request_id: stripeRequestId,
                                    reconciled: true
                                }
                            })
                            .eq('id', reqId);

                        results.push({ id: reqId, status: 'approved', transfer_id: existingTransfer.id });
                    } else {
                        // Stripe transfer was NEVER created. Safely reverse the balance.
                        console.log(`[Reconciliation Cron] Stripe transfer NOT found for request ${reqId}. Reversing (Compensating).`);
                        
                        await reverseWithdrawal(reqId, userId, amountMicro, 'Reconciled: transfer not found on Stripe');
                        results.push({ id: reqId, status: 'reversed', reason: 'Stripe transfer not found' });
                    }

                } catch (requestErr: any) {
                    console.error(`[Reconciliation Cron] Failed to reconcile request ${reqId}:`, requestErr);
                    results.push({ id: reqId, status: 'error', error: requestErr.message });
                }
            }
        }

        return NextResponse.json({
            success: true,
            scanned: stuckRequests?.length || 0,
            reconciled: results
        });

    } catch (error: any) {
        console.error('[Reconciliation Cron] General exception:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

async function reverseWithdrawal(reqId: string, userId: string, amountMicro: number, reason: string) {
    const userWalletId = await getOrCreateUserWallet(userId);
    
    // 1. Execute Ledger transaction to return reserved funds
    try {
        await executeLedgerTransaction(
            'WITHDRAWAL_REVERSE',
            [
                { wallet_id: SYSTEM_WALLETS.WITHDRAWALS_PENDING.id, entry_type: 'AVAILABLE', amount: -amountMicro },
                { wallet_id: userWalletId, entry_type: 'PENDING', amount: amountMicro }
            ],
            reqId,
            `reverse_${reqId}`,
            { error: reason, reconciled: true }
        );
    } catch (err: any) {
        if (!err.message.includes('unique constraint') && !err.message.includes('idempotency')) {
            console.error(`[Reconciliation Cron] Ledger reversal failed for ${reqId}:`, err);
        }
    }

    // 2. Mark withdrawal request as failed
    await supabaseAdmin
        .from('withdrawal_requests')
        .update({
            status: 'failed',
            details: { error: reason, reconciled: true }
        })
        .eq('id', reqId);

    // 3. Send notification
    await addNotification({
        id: Date.now().toString(),
        recipientId: userId,
        type: 'system',
        title: 'Retiro Fallido - Fondos Devueltos',
        message: `No se pudo procesar tu retiro. Los fondos han sido devueltos a tu billetera.`,
        timestamp: new Date().toISOString(),
        readStatus: false
    });
}
