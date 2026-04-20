import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const rawRecipientId = searchParams.get('recipientId');

    try {
        let query = supabaseAdmin.from('notifications').select('*');
        if (rawRecipientId) {
            // Normalize recipientId: remove '@' and toLowerCase()
            const cleanId = rawRecipientId.replace('@', '').toLowerCase();
            query = query.eq('recipient_id', cleanId);
        }
        
        const { data, error } = await query.order('timestamp', { ascending: false });
        if (error) throw error;

        // Map database snake_case to API camelCase for mobile app consistency
        const mappedData = data.map((n: any) => ({
            id: n.id,
            recipientId: n.recipient_id,
            type: n.type,
            title: n.title,
            message: n.message,
            timestamp: n.timestamp,
            readStatus: n.read_status
        }));

        return NextResponse.json(mappedData);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { recipientId: rawRecipientId, type, title, message } = body;

        if (!rawRecipientId || !type || !title || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Sanitize input: remove '@' and lowercase to maintain DB consistency
        const recipientId = rawRecipientId.replace('@', '').toLowerCase();

        const newNotification = {
            recipient_id: recipientId,
            type,
            title,
            message,
            timestamp: new Date().toISOString(),
            read_status: false
        };

        const { data, error } = await supabaseAdmin.from('notifications').insert([newNotification]).select().single();
        if (error) throw error;

        // Attempt Push Notification via Expo
        try {
            const { data: userData } = await supabaseAdmin
                .from('app_users')
                .select('push_token')
                .eq('handle', recipientId)
                .single();

            if (userData && userData.push_token) {
                await fetch('https://exp.host/--/api/v2/push/send', {
                    method: 'POST',
                    headers: { 'Accept': 'application/json', 'Accept-encoding': 'gzip, deflate', 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: userData.push_token,
                        sound: 'default',
                        title: title,
                        body: message,
                        data: { type }
                    })
                });
            }
        } catch (e) { console.warn("Push error", e); }

        return NextResponse.json({
            id: data.id,
            recipientId: data.recipient_id,
            type: data.type,
            title: data.title,
            message: data.message,
            timestamp: data.timestamp,
            readStatus: data.read_status
        });
    } catch (error) {
        console.error('Error creating notification:', error);
        return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }
}
export async function PUT(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const recipientId = searchParams.get('recipientId');

        if (!recipientId) {
            return NextResponse.json({ error: 'Missing recipientId' }, { status: 400 });
        }

        // Sanitize recipientId: remove '@' and lowercase to match normalized DB format
        const cleanRecipientId = recipientId.replace('@', '').toLowerCase();

        // Mark all as read for this user
        const { error } = await supabaseAdmin
            .from('notifications')
            .update({ read_status: true })
            .eq('recipient_id', cleanRecipientId)
            .eq('read_status', false);

        if (error) throw error;

        return NextResponse.json({ success: true, message: 'Notifications marked as read' });
    } catch (error) {
        console.error('Error updating notifications:', error);
        return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
    }
}
