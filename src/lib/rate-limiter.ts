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
