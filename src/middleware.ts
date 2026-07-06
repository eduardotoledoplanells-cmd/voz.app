import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
    // Interceptar todas las rutas de /api/voz y subrutas
    matcher: '/api/voz/:path*',
};

export async function middleware(request: NextRequest) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 1. CLONAR CABECERAS Y ELIMINAR CUALQUIER CABECERA DE SEGURIDAD INYECTADA POR EL CLIENTE (Header Spoofing Prevention)
    const requestHeaders = new Headers(request.headers);
    requestHeaders.delete('x-user-id');
    requestHeaders.delete('x-user-email');
    requestHeaders.delete('x-user-role');

    // 2. EXCLUSIONES PÚBLICAS
    // Permitir reportes de errores sin autenticar para que no falle el ErrorBoundary en login/registro
    if (pathname === '/api/voz/client-error') {
        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
    }

    // 3. RUTAS CRON (Protegidas por CRON_SECRET)
    if (pathname.startsWith('/api/voz/cron/')) {
        const cronSecret = process.env.CRON_SECRET || 'VOZ_CRON_SEC_2026_x9';
        const clientCronSecret = request.headers.get('x-cron-secret');

        if (!clientCronSecret || clientCronSecret !== cronSecret) {
            console.warn(`[Security Alert] Intento de acceso no autorizado al CRON: ${pathname}`);
            return new NextResponse(
                JSON.stringify({ success: false, error: 'Acceso no autorizado al servicio de automatización' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn('[Middleware] Permitiendo petición sin token por retrocompatibilidad');
        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
    }

    const token = authHeader.split(' ')[1];
    
    // Configuración de Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://thiftwzubmvcrdhuwcwm.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseAnonKey) {
        console.error('CRITICAL [Middleware]: NEXT_PUBLIC_SUPABASE_ANON_KEY missing!');
        return new NextResponse(
            JSON.stringify({ success: false, error: 'Error interno de configuración del servidor de autenticación' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }

    try {
        // Llamada ligera HTTP al endpoint Edge de Supabase Auth para validar el token
        const verifyRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
            method: 'GET',
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${token}`
            }
        });

        if (!verifyRes.ok) {
            const errText = await verifyRes.text();
            console.warn(`[Security Alert] Validación de token JWT fallida. HTTP ${verifyRes.status}: ${errText}`);
            return new NextResponse(
                JSON.stringify({ success: false, error: 'Sesión expirada o inválida. Inicie sesión nuevamente.' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const user = await verifyRes.json();

        if (!user || !user.id) {
            return new NextResponse(
                JSON.stringify({ success: false, error: 'Formato de usuario inválido en respuesta de autenticación' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // 5. INYECTAR LAS CABECERAS VERIFICADAS Y DEJAR PASAR
        requestHeaders.set('x-user-id', user.id);
        requestHeaders.set('x-user-email', user.email || '');
        requestHeaders.set('x-user-role', user.user_metadata?.role || 'user');

        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });

    } catch (err: any) {
        console.error('[Middleware Error] Excepción al validar JWT de Supabase:', err.message);
        return new NextResponse(
            JSON.stringify({ success: false, error: 'Error de red conectando con el servidor de autenticación' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
