import { NextResponse } from 'next/server';
import { supabaseAdmin, addNotification } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('withdrawal_requests')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json({ success: true, withdrawals: data });
    } catch (e) {
        return NextResponse.json({ success: false, error: 'Failed to fetch withdrawals' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const { id, status } = await request.json();

        if (!id || !status) {
            return NextResponse.json({ success: false, error: 'Missing id or status' }, { status: 400 });
        }

        // 1. Fetch current request to get user and amount
        const { data: withdrawal, error: fetchError } = await supabaseAdmin
            .from('withdrawal_requests')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !withdrawal) {
            return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 });
        }

        // Prevent processing if already completed/rejected
        if (withdrawal.status !== 'pending') {
            return NextResponse.json({ success: false, error: 'Request already processed' }, { status: 400 });
        }

        // 2. If REJECTED, refund money to user
        if (status === 'rejected') {
            // Get current user balance
            const { data: user, error: userError } = await supabaseAdmin
                .from('app_users')
                .select('id, earnings_balance')
                .eq('id', withdrawal.user_id)
                .single();

            if (userError || !user) throw new Error('User not found for refund');

            const newBalance = (Number(user.earnings_balance) || 0) + Number(withdrawal.amount);

            // Refund balance
            const { error: updateError } = await supabaseAdmin
                .from('app_users')
                .update({ earnings_balance: newBalance })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // Optional: Log refund as a transaction
            await supabaseAdmin
                .from('transactions')
                .insert([{
                    sender_handle: 'SYSTEM',
                    receiver_handle: withdrawal.user_handle,
                    amount: withdrawal.amount,
                    type: 'refund',
                    timestamp: new Date().toISOString()
                }]);
        }

        // 3. Update withdrawal request status
        const { error: updateExtError } = await supabaseAdmin
            .from('withdrawal_requests')
            .update({ 
                status: status,
                processed_at: new Date().toISOString()
            })
            .eq('id', id);

        if (updateExtError) throw updateExtError;

        // 4. Send Notification to User
        const notifTitle = status === 'approved' ? '¡Retiro Aprobado!' : 'Retiro Rechazado';
        const notifMessage = status === 'approved' 
            ? `Tu solicitud de retiro de ${withdrawal.amount} 🪙 ha sido aprobada. El dinero llegará pronto a tu cuenta.` 
            : `Tu solicitud de retiro de ${withdrawal.amount} 🪙 ha sido rechazada. Las monedas han sido devueltas a tu cartera.`;

        await addNotification({
            id: Date.now().toString(),
            recipientId: withdrawal.user_handle,
            type: 'billing',
            title: notifTitle,
            message: notifMessage,
            timestamp: new Date().toISOString(),
            readStatus: false
        });
        
        return NextResponse.json({ success: true, refunded: status === 'rejected' });
    } catch (e: any) {
        console.error('PATCH withdrawals error:', e);
        return NextResponse.json({ success: false, error: e.message || 'Failed to update withdrawal' }, { status: 500 });
    }
}
