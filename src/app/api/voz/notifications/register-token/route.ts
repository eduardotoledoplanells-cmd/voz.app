import { NextResponse } from 'next/server';
import { savePushToken, supabaseAdmin, getUserById } from '@/lib/db';

export async function POST(request: Request) {
    try {
        // 1. Validar autenticación con Token Bearer de Supabase
        let authenticatedUserId: string | null = null;
        const authHeader = request.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const { data: authUser } = await supabaseAdmin.auth.getUser(token);
                if (authUser?.user) {
                    authenticatedUserId = authUser.user.id;
                }
            } catch (e) {
                console.warn("Auth token validation failed in push register:", e);
            }
        }

        if (!authenticatedUserId) {
            return NextResponse.json({ error: 'Acceso denegado: Sesión inválida' }, { status: 401 });
        }

        const body = await request.json();
        const { userId, fcmToken, deviceType = 'android' } = body;

        if (!userId || !fcmToken) {
            return NextResponse.json({ error: 'Faltan parámetros requeridos (userId o fcmToken)' }, { status: 400 });
        }

        // 2. Verificar que el usuario autenticado coincide con el userId enviado
        const currentUser = await getUserById(authenticatedUserId);
        const cleanUserId = userId.replace('@', '');
        const cleanCurrentUserHandle = currentUser?.handle?.replace('@', '');

        if (!currentUser || (cleanCurrentUserHandle !== cleanUserId && currentUser.id !== userId)) {
            return NextResponse.json({ error: 'Acceso denegado: No puedes registrar tokens para otra cuenta' }, { status: 403 });
        }

        const formattedHandle = `@${cleanUserId}`;
        const success = await savePushToken(formattedHandle, fcmToken, deviceType);

        if (!success) {
            return NextResponse.json({ error: 'No se pudo guardar el token FCM' }, { status: 500 });
        }

        console.log(`[Push API] FCM Token registrado exitosamente para: ${formattedHandle}`);
        return NextResponse.json({ success: true, message: 'Token registrado exitosamente' });

    } catch (error: any) {
        console.error('[Push API Error] Excepción en register-token:', error);
        return NextResponse.json({ error: 'Error interno del servidor', details: error.message }, { status: 500 });
    }
}
