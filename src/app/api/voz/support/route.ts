import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userHandle = searchParams.get('userHandle');

        let query = supabaseAdmin.from('support_messages').select('*').order('created_at', { ascending: false });

        if (userHandle) {
            query = query.eq('user_handle', userHandle);
        }

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json({ success: true, messages: data });
    } catch (error) {
        console.error('Error fetching support messages:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch support messages' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userHandle, message, isFromAdmin } = body;

        if (!userHandle || !message) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Save to support_messages DB for logging/inbox
        const newMsg = {
            user_handle: userHandle,
            message: message,
            is_from_admin: isFromAdmin || false,
            read_status: false
        };

        const { data, error } = await supabaseAdmin.from('support_messages').insert([newMsg]).select().single();
        if (error) throw error;

        // 2. If it's an admin reply, send a notification to the user's Activity tab
        if (isFromAdmin) {
            // Get the current URL origin to make a local API call
            const protocol = request.headers.get('x-forwarded-proto') || 'http';
            const host = request.headers.get('host') || 'localhost:3000';
            const baseUrl = `${protocol}://${host}`;

            await fetch(`${baseUrl}/api/voz/notifications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipientId: userHandle,
                    type: 'admin_message',
                    title: '📢 Mensaje de VOZ',
                    message: message
                })
            }).catch(e => console.warn('Push error on support message:', e));
        }

        return NextResponse.json({ success: true, message: data });
    } catch (error) {
        console.error('Error sending support message:', error);
        return NextResponse.json({ success: false, error: 'Failed to process message' }, { status: 500 });
    }
}
