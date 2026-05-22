import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/voz/admin/donations-by-user?creatorHandle=@username
// Endpoint exclusivo para administradores. Requiere header x-admin-key.
export async function GET(request: Request) {
    // --- Guardia de Administrador ---
    const adminKey = request.headers.get('x-admin-key');
    if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
        return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const creatorHandle = searchParams.get('creatorHandle');

    if (!creatorHandle) {
        return NextResponse.json({ error: 'Falta el parámetro creatorHandle' }, { status: 400 });
    }

    try {
        // Consulta a la tabla de transacciones filtrando por donaciones al creador
        const { data: transactions, error } = await supabaseAdmin
            .from('transactions')
            .select('sender_handle, receiver_handle, amount, type, created_at')
            .eq('receiver_handle', creatorHandle)
            .eq('type', 'donation')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!transactions || transactions.length === 0) {
            return NextResponse.json({
                creatorHandle,
                donations: [],
                total_received_euros: 0,
                total_received_coins: 0,
                count: 0
            });
        }

        // Convertir monedas a euros reales (1 moneda = 1 EUR, creador se queda 75%)
        const CREATOR_SHARE = 0.75;
        const enrichedDonations = transactions.map(tx => ({
            sender_handle: tx.sender_handle,
            coins_sent: tx.amount,
            euros_received: parseFloat((tx.amount * CREATOR_SHARE).toFixed(2)),
            timestamp: tx.created_at
        }));

        const totalCoins = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
        const totalEuros = parseFloat((totalCoins * CREATOR_SHARE).toFixed(2));

        return NextResponse.json({
            creatorHandle,
            donations: enrichedDonations,
            total_received_euros: totalEuros,
            total_received_coins: totalCoins,
            count: enrichedDonations.length
        });

    } catch (error) {
        console.error('[Admin] Error fetching donations by user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
