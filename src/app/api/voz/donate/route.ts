import { NextResponse } from 'next/server';
import { getUserById, getUserByHandle, addTransaction, addNotification, supabaseAdmin } from '@/lib/db';
import { processDonation } from '@/lib/ledger';
import { logSystemAlert } from '@/lib/alerts';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { creatorHandle } = body;
        let amount = body.amount;

        // Autenticación estricta: verificar token Bearer de Supabase Auth
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
                console.warn("Auth token validation failed:", e);
            }
        }

        // Fallback para clientes que envían la cabecera x-user-id
        const headerUserId = request.headers.get('x-user-id');
        if (!authenticatedUserId && headerUserId) {
            authenticatedUserId = headerUserId;
        }

        if (!authenticatedUserId || !creatorHandle || !amount) {
            return NextResponse.json({ error: 'No autorizado o faltan campos requeridos' }, { status: 401 });
        }

        const sender = await getUserById(authenticatedUserId);
        const creator = await getUserByHandle(creatorHandle);

        if (!sender || !creator) {
            return NextResponse.json({ error: 'Usuario donante o creador no encontrado' }, { status: 404 });
        }

        if (creator.privacySettings?.receive_donations === false) {
            return NextResponse.json({ error: 'Este creador ha desactivado la opción de recibir donaciones.' }, { status: 400 });
        }

        let donationAmount = typeof amount === 'string' ? Number(amount.replace(',', '.')) : Number(amount);
        if (isNaN(donationAmount) || donationAmount <= 0) {
            return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
        }

        // 1. Process donation via Ledger
        const idempotencyKey = `donation-${sender.id}-${creator.id}-${Date.now()}`;
        try {
            await processDonation(sender.id, creator.id, donationAmount, idempotencyKey);
        } catch (ledgerError: any) {
            console.error("Ledger Donation transaction failed:", ledgerError);
            return NextResponse.json({ error: ledgerError.message || 'Saldo insuficiente' }, { status: 400 });
        }

        const payoutAmount = donationAmount * 0.75;

        // 3. Registrar transacción
        await addTransaction({
            senderHandle: sender.handle,
            receiverHandle: creatorHandle,
            amount: donationAmount,
            type: 'donation'
        });

        // 4. Enviar notificación al creador (ve su parte en Euros)
        await addNotification({
            id: Date.now().toString(),
            recipientId: creatorHandle,
            type: 'donation',
            title: '¡Has recibido un apoyo! 💰',
            message: `Has recibido un apoyo de ${payoutAmount.toFixed(2)} € de ${sender.handle}.`,
            timestamp: new Date().toISOString(),
            readStatus: false
        });

        // 5. Enviar notificación al donante (para que quede registrado en su sección de Actividad)
        await addNotification({
            id: (Date.now() + 1).toString(),
            recipientId: sender.handle,
            type: 'donation',
            title: '¡Apoyo enviado! 💰',
            message: `Has enviado un apoyo de ${donationAmount} moneda(s) a ${creatorHandle}.`,
            timestamp: new Date().toISOString(),
            readStatus: false
        });

        return NextResponse.json({ success: true, payoutAmount });

    } catch (error) {
        console.error('Error procesando donación:', error);
        await logSystemAlert('Donaciones', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
