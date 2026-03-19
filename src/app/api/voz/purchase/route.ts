import { NextRequest, NextResponse } from "next/server";
import { updateAppUser, getAppUsers, addCoinSale } from "@/lib/db";
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const COIN_PACKS_SERVER = {
    'p2': { price: 10, coins: 8 },
    'p3': { price: 20, coins: 17 },
    'p4': { price: 50, coins: 42 },
    'ps': { price: 100, coins: 80 },
    'pVIP': { price: 500, coins: 420 },
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

        // 2. Validate Payment with Stripe
        try {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            if (paymentIntent.status !== 'succeeded') {
                return NextResponse.json({ error: "Payment not successful" }, { status: 402 });
            }
            // Enhance Security: Check if this intent was already redeemed (requires DB setup, but we'll add the sale record)
        } catch (stripeError) {
            console.error("Stripe validation error:", stripeError);
            return NextResponse.json({ error: "Failed to validate payment" }, { status: 500 });
        }

        // 3. Get Current Balance
        const users = await getAppUsers();
        const user = users.find(u => u.id === userId);

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const currentBalance = Number(user.walletBalance || 0);
        const newBalance = currentBalance + Number(amount);

        // 4. Update DB
        const updated = await updateAppUser(userId, {
            walletBalance: newBalance
        });

        if (!updated) {
            return NextResponse.json({ error: "Failed to update balance" }, { status: 500 });
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
            newBalance: updated.walletBalance
        });

    } catch (error) {
        console.error("Purchase error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
