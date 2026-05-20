import { NextResponse } from 'next/server';
import { getAppUsers } from '@/lib/db';
import { executeLedgerTransaction, getOrCreateUserWallet } from '@/lib/ledger';

export async function POST(request: Request) {
    try {
        const { handle, amount } = await request.json();

        if (!handle || !amount || amount <= 0) {
            return NextResponse.json({ success: false, error: 'Datos inválidos' }, { status: 400 });
        }

        const users = await getAppUsers();
        const user = users.find(u => u.handle === handle);

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
        try {
            await executeLedgerTransaction(
                'EARNINGS_TRANSFER',
                [
                    {
                        wallet_id: userWalletId,
                        entry_type: 'PENDING',
                        amount: -amount
                    },
                    {
                        wallet_id: userWalletId,
                        entry_type: 'AVAILABLE',
                        amount: amount
                    }
                ],
                null,
                idempotencyKey,
                { handle }
            );
        } catch (ledgerError: any) {
            console.error("Ledger Transfer transaction failed:", ledgerError);
            return NextResponse.json({ success: false, error: ledgerError.message || 'Saldo en cartera insuficiente' }, { status: 400 });
        }

        // Fetch updated user to get accurate balance
        const updatedUsers = await getAppUsers();
        const updatedUser = updatedUsers.find(u => u.id === user.id);
        const finalEarnings = updatedUser ? updatedUser.earningsBalance : (currentEarnings - amount);
        const finalWallet = updatedUser ? updatedUser.walletBalance : ((user.walletBalance || 0) + amount);

        return NextResponse.json({ 
            success: true, 
            newEarnings: finalEarnings,
            newWallet: finalWallet
        });

    } catch (error) {
        console.error('Error in transfer:', error);
        return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
    }
}
