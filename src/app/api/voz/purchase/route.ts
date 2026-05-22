import { NextRequest, NextResponse } from "next/server";
import { getAppUsers, addCoinSale, supabaseAdmin } from "@/lib/db";
import { stripe } from '@/lib/stripe';
import { processCoinPurchase } from '@/lib/ledger';

export const dynamic = 'force-dynamic';

const COIN_PACKS_SERVER = {
    'p2': { price: 12.10, coins: 10 },
    'p3': { price: 24.20, coins: 20 },
    'p4': { price: 60.50, coins: 50 },
    'ps': { price: 121.00, coins: 100 },
    'pVIP': { price: 605.00, coins: 500 },
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, packId, amount, paymentIntentId } = body;

        if (!userId || !packId || !amount || !paymentIntentId) {
            return NextResponse.json({ error: "Missing required fields (userId, packId, amount, paymentIntentId)" }, { status: 400 });
        }

        // 1. Validate Pack and Amount against Server Truth
        const pack = COIN_PACKS_SERVER[packId as keyof typeof COIN_PACKS_SERVER];
        if (!pack || pack.coins !== Number(amount)) {
            return NextResponse.json({ error: "Invalid pack or amount requested" }, { status: 400 });
        }

        // 1.5 IDEMPOTENCY CHECK — Si el webhook de Stripe ya procesó este paymentIntentId,
        // devolvemos el saldo actual sin ejecutar processCoinPurchase por segunda vez.
        // Esto evita la doble acreditación cuando ambos flujos (webhook + app) se ejecutan.
        const { data: existingTx } = await supabaseAdmin
            .from('ledger_transactions')
            .select('id')
            .eq('idempotency_key', paymentIntentId)
            .maybeSingle();

        if (existingTx) {
            console.log(`[Purchase] paymentIntentId '${paymentIntentId}' ya procesado por webhook. Devolviendo saldo actual.`);
            const users = await getAppUsers();
            const user = users.find(u => u.id === userId);
            return NextResponse.json({
                success: true,
                newBalance: user?.walletBalance ?? 0,
                alreadyProcessed: true
            });
        }

        // 2. Validate Payment with Stripe
        try {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            if (paymentIntent.status !== 'succeeded') {
                return NextResponse.json({ error: "Payment not successful" }, { status: 402 });
            }
        } catch (stripeError) {
            console.error("Stripe validation error:", stripeError);
            return NextResponse.json({ error: "Failed to validate payment" }, { status: 500 });
        }

        // 3. Process coin purchase via Ledger
        let ledgerResult;
        try {
            ledgerResult = await processCoinPurchase(userId, Number(amount), paymentIntentId);
        } catch (ledgerError: any) {
            console.error("Ledger transaction failed:", ledgerError);
            return NextResponse.json({ error: `Ledger error: ${ledgerError.message}` }, { status: 500 });
        }

        // 4. Get updated user balance
        const users = await getAppUsers();
        const user = users.find(u => u.id === userId);

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 5. Record the sale to prevent double-spending in the future
        try {
            await addCoinSale({
                userHandle: user.handle,
                packType: packId,
                price: pack.price,
                coins: pack.coins,
                stripePaymentIntentId: paymentIntentId,
                status: 'succeeded'
            });
        } catch (e) {
            console.error("Failed to log coin sale:", e);
        }

        return NextResponse.json({
            success: true,
            newBalance: user.walletBalance
        });

    } catch (error) {
        console.error("Purchase error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
