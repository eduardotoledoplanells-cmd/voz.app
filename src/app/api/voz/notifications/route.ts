import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const rawRecipientId = searchParams.get('recipientId');

    try {
        let query = supabaseAdmin.from('notifications').select('*');
        if (rawRecipientId) {
            // Support both formats (with and without '@') to ensure delivery
            const cleanId = rawRecipientId.startsWith('@') ? rawRecipientId.slice(1) : rawRecipientId;
            const atId = '@' + cleanId;
            query = query.or(`recipient_id.eq.${cleanId},recipient_id.eq.${atId}`);
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

        // Sanitize input: remove '@' if present
        const recipientId = rawRecipientId.startsWith('@') ? rawRecipientId.slice(1) : rawRecipientId;

        const newNotification = {
            id: 'nt-' + Date.now(),
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
