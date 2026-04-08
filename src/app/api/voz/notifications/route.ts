import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const recipientId = searchParams.get('recipientId');

    try {
        let query = supabase.from('notifications').select('*');
        if (recipientId) {
            query = query.eq('recipientId', recipientId);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { recipientId, type, title, message } = body;

        if (!recipientId || !type || !title || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newNotification = {
            id: 'nt-' + Date.now(),
            recipientId,
            type,
            title,
            message,
            timestamp: new Date().toISOString(),
            readStatus: false
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

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error creating notification:', error);
        return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }
}
