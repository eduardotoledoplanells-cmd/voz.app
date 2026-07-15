import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signAdminToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

// ── In-memory rate limiter ────────────────────────────────────────────────────
// Structure: { ip: { attempts: number, firstAttempt: timestamp, blockedUntil: timestamp } }
const loginAttempts = new Map<string, { attempts: number; firstAttempt: number; blockedUntil: number }>();

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;                        // 5 attempts per window
const BLOCK_DURATION_MS = 30 * 60 * 1000;     // 30 min block after exceeding limit

function checkRateLimit(ip: string): { allowed: boolean; retryAfterSeconds?: number } {
    const now = Date.now();
    const record = loginAttempts.get(ip);

    if (record) {
        // If blocked, check if block has expired
        if (record.blockedUntil && now < record.blockedUntil) {
            const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000);
            return { allowed: false, retryAfterSeconds };
        }

        // If outside the window, reset
        if (now - record.firstAttempt > RATE_LIMIT_WINDOW_MS) {
            loginAttempts.set(ip, { attempts: 1, firstAttempt: now, blockedUntil: 0 });
            return { allowed: true };
        }

        // Within window — increment
        if (record.attempts >= MAX_ATTEMPTS) {
            const blockedUntil = now + BLOCK_DURATION_MS;
            loginAttempts.set(ip, { ...record, blockedUntil });
            return { allowed: false, retryAfterSeconds: BLOCK_DURATION_MS / 1000 };
        }

        loginAttempts.set(ip, { ...record, attempts: record.attempts + 1 });
        return { allowed: true };
    }

    // First attempt from this IP
    loginAttempts.set(ip, { attempts: 1, firstAttempt: now, blockedUntil: 0 });
    return { allowed: true };
}

function recordSuccessfulLogin(ip: string) {
    // Reset attempt counter on successful login
    loginAttempts.delete(ip);
}

// Cleanup old entries every 30 minutes to avoid memory leak
setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of loginAttempts.entries()) {
        if (now - record.firstAttempt > RATE_LIMIT_WINDOW_MS && now > record.blockedUntil) {
            loginAttempts.delete(ip);
        }
    }
}, 30 * 60 * 1000);

// ── Login handler ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
    try {
        // Get client IP (Vercel provides x-forwarded-for)
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || 'unknown';

        // Rate limit check
        const rateCheck = checkRateLimit(ip);
        if (!rateCheck.allowed) {
            return NextResponse.json(
                { error: `Demasiados intentos fallidos. Espera ${Math.ceil((rateCheck.retryAfterSeconds || 1800) / 60)} minutos antes de intentarlo de nuevo.` },
                {
                    status: 429,
                    headers: { 'Retry-After': String(rateCheck.retryAfterSeconds || 1800) }
                }
            );
        }

        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
        }

        // Query the employees table
        const { data: employee, error } = await supabaseAdmin
            .from('employees')
            .select('*')
            .ilike('username', username.trim())
            .single();

        if (error || !employee) {
            // Deliberate vague error to prevent user enumeration
            return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
        }

        if (!employee.active) {
            return NextResponse.json({ error: 'Cuenta inactiva. Contacta con el Director.' }, { status: 403 });
        }

        // Verify password with bcrypt
        let isPasswordValid = false;
        if (employee.password && employee.password.startsWith('$2b$')) {
            isPasswordValid = await bcrypt.compare(password, employee.password);
        } else {
            // Plaintext fallback (should not exist in production after migrations)
            isPasswordValid = (password === employee.password);
        }

        if (!isPasswordValid) {
            return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
        }

        // ✅ Login successful — reset rate limit for this IP
        recordSuccessfulLogin(ip);

        // Issue JWT — the password NEVER needs to travel again
        const token = await signAdminToken({
            employeeId: employee.id,
            username: employee.username,
            role: Number(employee.role),
            workerNumber: employee.worker_number || '???',
        });

        // Update last_login timestamp in DB
        await supabaseAdmin
            .from('employees')
            .update({ last_login: new Date().toISOString() })
            .eq('id', employee.id);

        return NextResponse.json({
            success: true,
            token,  // ← JWT, expires in 8h
            employee: {
                id: employee.id,
                username: employee.username,
                role: employee.role,
                worker_number: employee.worker_number || '???',
            }
        });
    } catch (e: any) {
        console.error('Error in login API:', e);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
