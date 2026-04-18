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

        const newMsg = {
            user_handle: userHandle,
            message: message,
            is_from_admin: isFromAdmin || false,
            read_status: false
        };

        const { data, error } = await supabaseAdmin.from('support_messages').insert([newMsg]).select().single();
        if (error) throw error;

        // Si somos el admin enviando, disparamos a las notificaciones locales (del backend admin)
        if (isFromAdmin) {
            // Re-utilizamos la lógica de notificaciones de Supabase y Push de Expo
            const { data: userData } = await supabaseAdmin
                .from('app_users')
                .select('push_token')
                .eq('handle', userHandle.startsWith('@') ? userHandle.slice(1) : userHandle)
                .single();

            const newNotification = {
                recipient_id: userHandle.startsWith('@') ? userHandle.slice(1) : userHandle,
                type: 'admin_message',
                title: '📢 Mensaje de VOZ',
                message: message,
                timestamp: new Date().toISOString(),
                read_status: false
            };

            await supabaseAdmin.from('notifications').insert([newNotification]);

            if (userData && userData.push_token) {
                await fetch('https://exp.host/--/api/v2/push/send', {
                    method: 'POST',
                    headers: { 'Accept': 'application/json', 'Accept-encoding': 'gzip, deflate', 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: userData.push_token,
                        sound: 'default',
                        title: '📢 Mensaje de VOZ',
                        body: message,
                        data: { type: 'admin_message' }
                    })
                }).catch(e => console.warn('Push error', e));
            }
        }

        return NextResponse.json({ success: true, message: data });
    } catch (error) {
        console.error('Error sending support message:', error);
        return NextResponse.json({ success: false, error: 'Failed to process message' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { userHandle } = body;

        if (!userHandle) {
            return NextResponse.json({ success: false, error: 'Missing userHandle' }, { status: 400 });
        }

        // Marcar como leídos todos los mensajes del usuario que NO sean del admin
        const { error } = await supabaseAdmin
            .from('support_messages')
            .update({ read_status: true })
            .eq('user_handle', userHandle)
            .eq('is_from_admin', false);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating read status:', error);
        return NextResponse.json({ success: false, error: 'Failed to update read status' }, { status: 500 });
    }
}
