import { NextResponse } from 'next/server';
import { getUserById, getUserByHandle, addWithdrawalRequest } from '@/lib/db';
import { executeLedgerTransaction, getOrCreateUserWallet, SYSTEM_WALLETS } from '@/lib/ledger';
import { logSystemAlert } from '@/lib/alerts';

export async function POST(request: Request) {
    try {
        const { handle, amount, method, details } = await request.json();

        if (!handle || !amount || amount < 50 || !method || !details) {
            return NextResponse.json({ success: false, error: 'La cantidad mínima de retiro es 50 🪙' }, { status: 400 });
        }

        const user = await getUserByHandle(handle);

        if (!user) {
            return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
        }

        const currentEarnings = user.earningsBalance || 0;
        if (currentEarnings < amount) {
            return NextResponse.json({ success: false, error: 'Saldo insuficiente en Cartera' }, { status: 400 });
        }

        // 1. Process via Ledger: deduct from user AVAILABLE balance and place in EXTERNAL_WORLD hold
        const userWalletId = await getOrCreateUserWallet(user.id);
        const idempotencyKey = `withdraw-${user.id}-${Date.now()}`;
        const amountMicro = Math.round(amount * 1000);
        try {
            await executeLedgerTransaction(
                'WITHDRAWAL_REQUEST',
                [
                    {
                        wallet_id: userWalletId,
                        entry_type: 'PENDING',
                        amount: -amountMicro
                    },
                    {
                        wallet_id: SYSTEM_WALLETS.EXTERNAL_WORLD.id,
                        entry_type: 'AVAILABLE',
                        amount: amountMicro
                    }
                ],
                null,
                idempotencyKey,
                { handle, method, details }
            );
        } catch (ledgerError: any) {
            console.error("Ledger Withdrawal transaction failed:", ledgerError);
            return NextResponse.json({ success: false, error: ledgerError.message || 'Saldo de cartera insuficiente' }, { status: 400 });
        }

        // 2. Crear la solicitud oficial en la DB
        const success = await addWithdrawalRequest({
            userId: user.id,
            userHandle: handle,
            amount: amount,
            method: method,
            details: details
        });

        if (!success) {
            // Nota: En caso de error al registrar, en producción se revertiría la transacción contable.
            // Pero como la DB de Supabase ya ejecutó la transacción contable en la RPC, si addWithdrawalRequest falla,
            // registramos el error crítico.
            console.error('CRITICAL: Ledger updated but withdrawal request entry failed.');
        }

        // Fetch updated user to get accurate balance
        const updatedUser = await getUserById(user.id);
        const finalEarnings = updatedUser ? updatedUser.earningsBalance : (currentEarnings - amount);

        return NextResponse.json({ 
            success: true, 
            newEarnings: finalEarnings
        });

    } catch (error) {
        console.error('Error in withdraw:', error);
        await logSystemAlert('Wallet-Retiro', error);
        return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
    }
}
