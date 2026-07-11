import { NextResponse } from 'next/server';
import { getUserById, getUserByHandle } from '@/lib/db';
import { executeLedgerTransaction, getOrCreateUserWallet, Money } from '@/lib/ledger';
import { logSystemAlert } from '@/lib/alerts';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { handle, userId: bodyUserId } = body;
        let amount = body.amount;

        if (typeof amount === 'string') {
            amount = Number(amount.replace(',', '.'));
        } else {
            amount = Number(amount);
        }

        let userId = request.headers.get('x-user-id');

        if (!userId) {
            if (bodyUserId) {
                userId = bodyUserId;
            } else if (handle) {
                const userByHandle = await getUserByHandle(handle);
                if (userByHandle) {
                    userId = userByHandle.id;
                }
            }
        }

        if (!userId || isNaN(amount) || amount <= 0) {
            return NextResponse.json({ success: false, error: 'Datos inválidos' }, { status: 400 });
        }

        const user = await getUserById(userId);

        if (!user) {
            return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
        }

        const currentEarnings = user.earningsBalance || 0;
        if (currentEarnings < amount) {
            return NextResponse.json({ success: false, error: 'Saldo en cartera insuficiente' }, { status: 400 });
        }

        // 1. Process via Ledger: Move from PENDING (earnings) to AVAILABLE (wallet balance)
        const userWalletId = await getOrCreateUserWallet(user.id);
        const idempotencyKey = `transfer-${user.id}-${Date.now()}`;
        const amountMicro = Money.fromCoins(amount).toMicrocoinsNumber();
        try {
            await executeLedgerTransaction(
                'EARNINGS_TRANSFER',
                [
                    {
                        wallet_id: userWalletId,
                        entry_type: 'PENDING',
                        amount: -amountMicro
                    },
                    {
                        wallet_id: userWalletId,
                        entry_type: 'AVAILABLE',
                        amount: amountMicro
                    }
                ],
                null,
                idempotencyKey,
                { handle: user.handle }
            );
        } catch (ledgerError: any) {
            console.error("Ledger Transfer transaction failed:", ledgerError);
            return NextResponse.json({ success: false, error: ledgerError.message || 'Saldo en cartera insuficiente' }, { status: 400 });
        }

        // Fetch updated user to get accurate balance
        const updatedUser = await getUserById(user.id);
        const finalEarnings = updatedUser ? updatedUser.earningsBalance : (currentEarnings - amount);
        const finalWallet = updatedUser ? updatedUser.walletBalance : ((user.walletBalance || 0) + amount);

        return NextResponse.json({ 
            success: true, 
            newEarnings: finalEarnings,
            newWallet: finalWallet
        });

    } catch (error) {
        console.error('Error in transfer:', error);
        await logSystemAlert('Wallet-Transfer', error);
        return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
    }
}
