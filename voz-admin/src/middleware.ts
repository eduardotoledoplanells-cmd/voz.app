import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Simple in-memory rate limit map (Instanced per Edge Function node)
// For a fully global solution, consider replacing this with Vercel KV or Upstash Redis.
const rateLimitMap = new Map<string, { count: number, resetTime: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // CORS for API routes
    if (pathname.startsWith('/api/voz')) {
        const response = NextResponse.next();
        response.headers.set('Access-Control-Allow-Origin', '*')
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        return response
    }

    // Rate Limiting for Login Route (Anti Brute Force)
    if (pathname === '/login' && request.method === 'POST') {
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        const now = Date.now();
        const limitRecord = rateLimitMap.get(ip);

        if (limitRecord) {
            if (now > limitRecord.resetTime) {
                // Window expired, reset
                rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
            } else if (limitRecord.count >= MAX_LOGIN_ATTEMPTS) {
                // Rate limit exceeded
                return new NextResponse('Too Many Requests. Try again in 15 minutes.', { status: 429 });
            } else {
                // Increment
                limitRecord.count++;
                rateLimitMap.set(ip, limitRecord);
            }
        } else {
            rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
        }
    }

    // Initialize Supabase Client for Middleware
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, {
                            ...options,
                            httpOnly: true,
                            secure: process.env.NODE_ENV === 'production',
                            sameSite: 'strict',
                        })
                    )
                },
            },
        }
    )

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Authentication and MFA Routing Logic
    const isPublicRoute = pathname.startsWith('/login');
    const isMfaRoute = pathname.startsWith('/2fa-setup') || pathname.startsWith('/2fa-verify');

    if (!user && !isPublicRoute) {
        // No user, trying to access protected route -> Redirect to login
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    if (user) {
        // Check MFA Status
        const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
        const { data: amrData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        
        const hasTotpFactor = factorsData?.totp?.length ? factorsData.totp.length > 0 : false;
        const currentAal = amrData?.currentLevel; // 'aal1' or 'aal2'

        if (currentAal === 'aal1') {
            // User is logged in with password but hasn't completed 2FA
            if (!isMfaRoute) {
                const url = request.nextUrl.clone();
                url.pathname = hasTotpFactor ? '/2fa-verify' : '/2fa-setup';
                return NextResponse.redirect(url);
            }
        } else if (currentAal === 'aal2') {
            // Fully authenticated (Password + 2FA)
            if (isPublicRoute || isMfaRoute) {
                // If they try to go to login or 2fa again, redirect to dashboard
                const url = request.nextUrl.clone();
                url.pathname = '/';
                return NextResponse.redirect(url);
            }
        }
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
