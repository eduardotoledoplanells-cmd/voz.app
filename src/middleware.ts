import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
    // Interceptar todas las rutas de /api/voz y subrutas
    matcher: '/api/voz/:path*',
};

// Rutas públicas dentro de /api/voz que NO requieren token Bearer
const PUBLIC_ROUTES = [
    '/api/voz/auth',
    '/api/voz/client-error',
    '/api/voz/waitlist'
];

export async function middleware(request: NextRequest) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 1. CLONAR CABECERAS Y ELIMINAR CUALQUIER CABECERA DE SEGURIDAD INYECTADA POR EL CLIENTE (Header Spoofing Prevention)
    const requestHeaders = new Headers(request.headers);
    requestHeaders.delete('x-user-id');
    requestHeaders.delete('x-user-email');
    requestHeaders.delete('x-user-role');

    // 2. EXCLUSIONES PÚBLICAS
    const isPublic = PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'));
    const isPublicGetOnly = ['/api/voz/videos', '/api/voz/users/profile', '/api/voz/stats'].some(route => pathname === route || pathname.startsWith(route + '/'));

    if (isPublic || (request.method === 'GET' && isPublicGetOnly)) {
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

    // 4. VALIDACIÓN DE TOKEN (Retrocompatible)
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://thiftwzubmvcrdhuwcwm.supabase.co';
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (supabaseAnonKey && token && token.trim() !== '') {
            try {
                // Llamada ligera HTTP al endpoint Edge de Supabase Auth para validar el token
                const verifyRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
                    method: 'GET',
                    headers: {
                        'apikey': supabaseAnonKey,
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (verifyRes.ok) {
                    const user = await verifyRes.json();
                    if (user && user.id) {
                        // INYECTAR CABECERAS VERIFICADAS
                        requestHeaders.set('x-user-id', user.id);
                        requestHeaders.set('x-user-email', user.email || '');
                        requestHeaders.set('x-user-role', user.user_metadata?.role || 'user');
                    }
                } else {
                    console.warn(`[Middleware] Token JWT no válido o expirado (HTTP ${verifyRes.status}). Continuando sin cabecera x-user-id.`);
                }
            } catch (err: any) {
                console.error('[Middleware Error] Excepción al validar JWT:', err.message);
            }
        }
    }

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}
