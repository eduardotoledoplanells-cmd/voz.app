interface RateLimitEntry {
    count: number;
    resetTime: number;
}

class RateLimiter {
    private limits: Map<string, RateLimitEntry> = new Map();

    /**
     * Check if a request should be allowed
     * @param key - Unique identifier (e.g., IP address or user ID)
     * @param maxRequests - Maximum number of requests allowed
     * @param windowMs - Time window in milliseconds
     * @returns true if allowed, false if rate limited
     */
    check(key: string, maxRequests: number, windowMs: number): boolean {
        const now = Date.now();
        const entry = this.limits.get(key);

        // Clean up old entries periodically
        if (Math.random() < 0.01) {
            this.cleanup();
        }

        if (!entry || now > entry.resetTime) {
            // First request or window expired
            this.limits.set(key, {
                count: 1,
                resetTime: now + windowMs
            });
            return true;
        }

        if (entry.count < maxRequests) {
            // Within limit
            entry.count++;
            return true;
        }

        // Rate limited
        return false;
    }

    /**
     * Get time until rate limit resets
     * @param key - Unique identifier
     * @returns milliseconds until reset, or 0 if not limited
     */
    getResetTime(key: string): number {
        const entry = this.limits.get(key);
        if (!entry) return 0;

        const now = Date.now();
        return Math.max(0, entry.resetTime - now);
    }

    /**
     * Clean up expired entries
     */
    private cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.limits.entries()) {
            if (now > entry.resetTime) {
                this.limits.delete(key);
            }
        }
    }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Helper to get client IP from request
export function getClientIp(request: Request): string {
    // Try to get real IP from headers (for proxies/load balancers)
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    const realIp = request.headers.get('x-real-ip');
    if (realIp) {
        return realIp;
    }

    // Fallback to a default (in development, this might always be localhost)
    return 'unknown';
}

export interface LockoutCheckResult {
    allowed: boolean;
    lockedUntil?: number;
    attempts: number;
    message?: string;
}

class ProgressiveLockoutManager {
    private attemptsMap: Map<string, { attempts: number; lockedUntil: number }> = new Map();

    /**
     * Checks if a key (e.g. "login:user@example.com") is locked out
     */
    checkLockout(key: string): LockoutCheckResult {
        const now = Date.now();
        const record = this.attemptsMap.get(key);

        if (!record) {
            return { allowed: true, attempts: 0 };
        }

        if (record.lockedUntil > now) {
            const remainingMs = record.lockedUntil - now;
            const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
            const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));
            const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));

            let timeStr = `${remainingMinutes} minuto(s)`;
            if (remainingDays > 1) {
                timeStr = `${remainingDays} día(s)`;
            } else if (remainingHours > 1) {
                timeStr = `${remainingHours} hora(s)`;
            }

            return {
                allowed: false,
                lockedUntil: record.lockedUntil,
                attempts: record.attempts,
                message: `Has superado el límite de intentos fallidos. Tu acceso ha sido bloqueado por ${timeStr}.`
            };
        }

        return { allowed: true, attempts: record.attempts };
    }

    /**
     * Registers a failed attempt for a key
     * Tier rules:
     * - 3 fails: 15 min lock
     * - 6 fails: 1 hour lock
     * - 9 fails: 30 days lock (1 month)
     * - 12+ fails: Permanent ban
     */
    registerFailure(key: string): { attempts: number; locked: boolean; lockedDurationStr?: string; isPermanent?: boolean; message?: string } {
        const now = Date.now();
        const record = this.attemptsMap.get(key) || { attempts: 0, lockedUntil: 0 };
        record.attempts += 1;

        let lockMs = 0;
        let lockedDurationStr = '';
        let isPermanent = false;

        if (record.attempts >= 12) {
            isPermanent = true;
            record.lockedUntil = now + (365 * 10 * 24 * 60 * 60 * 1000); // 10 years (permanent)
            lockedDurationStr = 'de por vida (baneo permanente)';
        } else if (record.attempts >= 9) {
            lockMs = 30 * 24 * 60 * 60 * 1000; // 30 days
            lockedDurationStr = '30 días';
        } else if (record.attempts >= 6) {
            lockMs = 60 * 60 * 1000; // 1 hour
            lockedDurationStr = '1 hora';
        } else if (record.attempts >= 3) {
            lockMs = 15 * 60 * 1000; // 15 mins
            lockedDurationStr = '15 minutos';
        }

        if (lockMs > 0) {
            record.lockedUntil = now + lockMs;
        }

        this.attemptsMap.set(key, record);

        let message = `Credenciales incorrectas. Llevas ${record.attempts} intento(s) fallido(s).`;
        if (isPermanent) {
            message = `Has acumulado ${record.attempts} fallos consecutivos. Tu cuenta/IP ha sido bloqueada de por vida.`;
        } else if (lockMs > 0) {
            message = `Has fallado ${record.attempts} veces. Tu acceso ha sido bloqueado por ${lockedDurationStr}.`;
        }

        return {
            attempts: record.attempts,
            locked: record.lockedUntil > now,
            lockedDurationStr,
            isPermanent,
            message
        };
    }

    /**
     * Resets failure counter upon successful login or verification
     */
    reset(key: string): void {
        this.attemptsMap.delete(key);
    }
}

export const progressiveLockout = new ProgressiveLockoutManager();

