import { NextResponse } from 'next/server';
import { supabaseAdmin, addTransaction, getUserById, getUserByHandle, addAppUser, addNotification } from '@/lib/db';
import { processGift, executeLedgerTransaction, getOrCreateUserWallet, Money } from '@/lib/ledger';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { senderHandle, receiverHandle, amount, videoId, idempotencyKey: clientKey } = body;

        // Autenticación: verificar token Bearer (Supabase Auth JWT o User ID directo de la app)
        let authenticatedUserId: string | null = null;
        const authHeader = request.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const { data: authUser } = await supabaseAdmin.auth.getUser(token);
                if (authUser?.user) {
                    authenticatedUserId = authUser.user.id;
                }
            } catch (e) {
                console.warn("Auth token validation failed in gift:", e);
            }
            if (!authenticatedUserId && token) {
                const userById = await getUserById(token);
                if (userById) {
                    authenticatedUserId = userById.id;
                }
            }
        }

        if (!authenticatedUserId && senderHandle) {
            const userByH = await getUserByHandle(senderHandle);
            if (userByH) {
                authenticatedUserId = userByH.id;
            }
        }

        // Si no hay token válido ni usuario identificado, bloqueamos la petición
        if (!authenticatedUserId) {
            return NextResponse.json({ error: 'Acceso denegado: Token de sesión inválido o inexistente' }, { status: 401 });
        }

        if (!receiverHandle || !amount) {
            return NextResponse.json({ error: 'Missing required fields (receiverHandle, amount)' }, { status: 400 });
        }

        const giftAmount = Number(amount);
        if (isNaN(giftAmount) || giftAmount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        let sender = await getUserById(authenticatedUserId);
        let receiver: any = await getUserByHandle(receiverHandle);

        if (!sender) {
            return NextResponse.json({ error: 'Sender not found' }, { status: 404 });
        }

        if (!receiver) {
            // Auto-create user if it doesn't exist to ensure wallet creation works
            receiver = await addAppUser({
                id: crypto.randomUUID(),
                handle: receiverHandle,
                email: 'temp@lyvo.media',
                status: 'active',
                joinedAt: new Date().toISOString()
            });
            if (!receiver) {
                return NextResponse.json({ error: 'Failed to create receiver' }, { status: 500 });
            }
        }

        if (receiver.privacySettings?.receive_gifts === false) {
            return NextResponse.json({ error: 'Este creador ha desactivado la opción de recibir regalos.' }, { status: 400 });
        }

        // Si el saldo de monedas disponible es menor que el regalo, pero tiene saldo en ganancias acumuladas,
        // transferir automáticamente la diferencia para que el usuario pueda enviar el regalo sin fricción.
        const currentWallet = Number(sender.walletBalance || 0);
        const currentEarnings = Number(sender.earningsBalance || 0);
        if (currentWallet < giftAmount && (currentWallet + currentEarnings) >= giftAmount) {
            const neededFromEarnings = giftAmount - currentWallet;
            try {
                const userWalletId = await getOrCreateUserWallet(sender.id);
                const transferMicro = Money.fromCoins(neededFromEarnings).toMicrocoinsNumber();
                await executeLedgerTransaction(
                    'EARNINGS_TRANSFER',
                    [
                        { wallet_id: userWalletId, entry_type: 'PENDING', amount: -transferMicro },
                        { wallet_id: userWalletId, entry_type: 'AVAILABLE', amount: transferMicro }
                    ],
                    null,
                    `auto-transfer-gift-${sender.id}-${Date.now()}`,
                    { handle: sender.handle, reason: 'auto_gift_transfer' }
                );
            } catch (e) {
                console.warn("[Gift] Auto-transfer from earnings warning:", e);
            }
        }

        // 1. Process via Ledger (idempotencia cliente o fallback estable)
        const idempotencyKey = clientKey || `gift-${sender.id}-${receiver.id}-${giftAmount}-${videoId || ''}`;
        try {
            await processGift(sender.id, receiver.id, giftAmount, idempotencyKey);
        } catch (ledgerError: any) {
            console.error("Ledger Gift transaction failed:", ledgerError);
            return NextResponse.json({ error: ledgerError.message || 'Transaction failed' }, { status: 400 });
        }

        // 2. Add Transaction Log to Supabase
        await addTransaction({
            senderHandle,
            receiverHandle,
            amount: giftAmount,
            type: 'gift',
            videoId
        });

        const payoutAmount = giftAmount * 0.65;

        // Fetch updated sender balance
        const updatedSender = await getUserById(sender.id);
        const newSenderBalance = updatedSender ? updatedSender.walletBalance : 0;

        // 5. Enviar notificación al creador (recibe su parte)
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        await fetch(`${baseUrl}/api/voz/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipientId: receiverHandle,
                type: 'gift',
                title: '¡Te han enviado un regalo! 🎁',
                message: `${senderHandle} te ha apoyado con ${payoutAmount.toFixed(2)} €.`,
                senderId: senderHandle
            })
        }).catch(err => console.error("Error triggering gift notification to creator:", err));

        // 6. Enviar notificación al emisor (para que quede en su pestaña de Actividad)
        await fetch(`${baseUrl}/api/voz/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipientId: senderHandle,
                type: 'gift',
                title: '¡Regalo enviado! 🎁',
                message: `Has enviado un regalo de ${giftAmount} moneda(s) a ${receiverHandle}.`,
                senderId: senderHandle
            })
        }).catch(err => console.error("Error triggering gift notification to sender:", err));

        return NextResponse.json({ success: true, newSenderBalance });

    } catch (error) {
        console.error('Error processing gift:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
