import { NextResponse } from 'next/server';
import { savePushToken } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, fcmToken, deviceType = 'android' } = body;

        if (!userId || !fcmToken) {
            return NextResponse.json({ error: 'Faltan parámetros requeridos (userId o fcmToken)' }, { status: 400 });
        }

        // Limpiar el userId (quitar el '@' si viene como handle)
        const cleanUserId = userId.startsWith('@') ? userId : `@${userId}`;

        const success = await savePushToken(cleanUserId, fcmToken, deviceType);

        if (!success) {
            return NextResponse.json({ error: 'No se pudo guardar el token FCM en la base de datos' }, { status: 500 });
        }

        console.log(`[Push API] FCM Token registrado exitosamente para: ${cleanUserId}`);
        return NextResponse.json({ success: true, message: 'Token registrado exitosamente' });

    } catch (error: any) {
        console.error('[Push API Error] Excepción en register-token:', error);
        return NextResponse.json({ error: 'Error interno del servidor', details: error.message }, { status: 500 });
    }
}
