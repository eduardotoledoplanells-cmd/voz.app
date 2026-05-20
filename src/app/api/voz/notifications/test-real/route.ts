import { NextResponse } from 'next/server';
import { addNotification, supabaseAdmin } from '@/lib/db';
import { sendNativePush } from '@/lib/firebaseAdmin';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, title = "🚀 ¡PRUEBA NATIVA REAL VOZ v1.2.6!", message = "¡Esta es la notificación 100% nativa con sonido y vibración en Android!" } = body;

        if (!userId) {
            return NextResponse.json({ error: 'Falta el parámetro userId en el cuerpo' }, { status: 400 });
        }

        const cleanHandle = userId.startsWith('@') ? userId : `@${userId}`;
        const rawHandle = cleanHandle.replace('@', '');

        // 1. Guardar la notificación en la base de datos
        const notif = await addNotification({
            id: Date.now().toString(),
            recipientId: userId,
            type: 'test_real',
            title,
            message,
            timestamp: new Date().toISOString(),
            readStatus: false
        });

        // 2. Extraer todos los tokens de la tabla push_tokens nativa
        const { data: fcmTokens } = await supabaseAdmin
            .from('push_tokens')
            .select('fcm_token, device_type')
            .or(`user_id.eq.${cleanHandle},user_id.eq.${rawHandle}`);

        // 3. Extraer el token de app_users
        const { data: userData } = await supabaseAdmin
            .from('app_users')
            .select('push_token')
            .or(`handle.eq.${cleanHandle},handle.eq.${rawHandle}`)
            .single();

        const allTokens: string[] = [];
        if (fcmTokens && fcmTokens.length > 0) {
            fcmTokens.forEach(t => { if (t.fcm_token) allTokens.push(t.fcm_token); });
        }
        if (userData && userData.push_token) {
            allTokens.push(userData.push_token);
        }

        const uniqueTokens = Array.from(new Set(allTokens));
        const dispatchLogs: any[] = [];

        for (const token of uniqueTokens) {
            if (token.includes('ExponentPush') || token.includes('ExpoPush')) {
                dispatchLogs.push({
                    token: token,
                    type: 'expo_fallback',
                    status: 'dispatched_to_expo'
                });
            } else {
                const fcmResult = await sendNativePush(token, title, message, { test_real: "true", notifId: notif?.id || '' });
                dispatchLogs.push({
                    token: token,
                    tokenPreview: token.substring(0, 25) + '...',
                    type: 'firebase_admin_sdk',
                    result: fcmResult
                });
            }
        }

        return NextResponse.json({ 
            success: true, 
            totalTokensFound: uniqueTokens.length,
            tokensListPreview: uniqueTokens.map(t => t.substring(0, 20) + '...'),
            dispatchLogs,
            notif 
        });

    } catch (error: any) {
        console.error('[Test Real Push Error]:', error);
        return NextResponse.json({ error: error.message || error, fullStack: error.stack }, { status: 500 });
    }
}
