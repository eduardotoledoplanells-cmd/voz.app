import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase, getUserPushTokens } from '@/lib/db';
import { sendNativePush } from '@/lib/firebaseAdmin';
import { logSystemAlert } from '@/lib/alerts';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const rawRecipientId = searchParams.get('recipientId');

    try {
        let query = supabaseAdmin.from('notifications').select('*');
        if (rawRecipientId) {
            const cleanId = rawRecipientId.replace('@', '');
            query = query.or(`recipient_id.ilike.${cleanId},recipient_id.ilike.@${cleanId}`);
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
        await logSystemAlert('Notificaciones', error);
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

        // Attempt Real Native Push Notification via Firebase FCM if settings allow
        try {
            const { data: userData } = await supabaseAdmin
                .from('app_users')
                .select('push_token, notification_settings')
                .or(`handle.ilike.${recipientId},handle.ilike.@${recipientId}`)
                .single();
            
            const settings = userData?.notification_settings || {};
            
            // Map notification type to setting key
            const typeToSetting: any = {
                'comment': 'notify_comments',
                'reply': 'notify_replies',
                'donation': 'notify_donations',
                'gift': 'notify_gifts',
                'pm': 'notify_pms',
                'pm_locked': 'notify_pms',
                'system': 'notify_system',
                'like': 'notify_likes',
                'follow': 'notify_followers',
                'balance': 'notify_balance',
                'billing': 'notify_balance',
                'strike': 'notify_strikes',
                'live_alert': 'notify_live'
            };

            const settingKey = typeToSetting[type];
            const isEnabled = settingKey ? (settings[settingKey] !== false) : true;

            if (isEnabled) {
                // 1. Enviar push nativa real FCM si existe token en push_tokens
                const nativeTokens = await getUserPushTokens(recipientId);
                const handleWithAt = `@${recipientId}`;
                const nativeTokensWithAt = await getUserPushTokens(handleWithAt);
                const allNativeTokens = Array.from(new Set([...nativeTokens, ...nativeTokensWithAt]));

                if (allNativeTokens.length > 0) {
                    console.log(`[Push Notification Real] Enviando a ${allNativeTokens.length} tokens FCM para usuario ${recipientId}`);
                    for (const token of allNativeTokens) {
                        await sendNativePush(token, title, message, { type, notificationId: data?.id });
                    }
                } else if (userData && userData.push_token) {
                    // 2. Fallback a Expo si aún no ha registrado token nativo
                    await fetch('https://exp.host/--/api/v2/push/send', {
                        method: 'POST',
                        headers: { 'Accept': 'application/json', 'Accept-encoding': 'gzip, deflate', 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: userData.push_token,
                            sound: 'default',
                            priority: 'high',
                            channelId: 'voz_high_priority',
                            title: title,
                            body: message,
                            data: { type }
                        })
                    });
                }
            }
        } catch (e) { console.warn("Push dispatch error", e); }

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
        await logSystemAlert('Notificaciones', error);
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
        const cleanRecipientId = recipientId.replace('@', '');

        // Mark all as read for this user
        const { error } = await supabaseAdmin
            .from('notifications')
            .update({ read_status: true })
            .or(`recipient_id.ilike.${cleanRecipientId},recipient_id.ilike.@${cleanRecipientId}`)
            .eq('read_status', false);

        if (error) throw error;

        return NextResponse.json({ success: true, message: 'Notifications marked as read' });
    } catch (error) {
        console.error('Error updating notifications:', error);
        await logSystemAlert('Notificaciones', error);
        return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
    }
}
