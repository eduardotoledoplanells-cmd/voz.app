/**
 * Admin Auth Helper — VOZ Admin Panel
 * 
 * Centralises header generation for authenticated API calls.
 * Use getAdminHeaders() instead of manually building auth headers.
 * 
 * With JWT (new, preferred):
 *   Authorization: Bearer <jwt_token>
 * 
 * Backward compat (deprecated, will stop working in future):
 *   x-employee-id, x-employee-username, x-employee-password
 */

export interface AdminSessionData {
    id: string;
    username: string;
    role: number;
    worker_number: string;
    token?: string;       // JWT (new sessions)
    password?: string;    // DEPRECATED — old sessions only
}

/**
 * Reads the current employee session from localStorage.
 */
export function getEmployeeSession(): AdminSessionData | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('vozEmployee');
    if (!stored) return null;
    try {
        return JSON.parse(stored) as AdminSessionData;
    } catch {
        return null;
    }
}

/**
 * Returns auth headers for admin API calls.
 * Prefers JWT Bearer token if available, falls back to legacy headers.
 */
export function getAdminHeaders(emp?: AdminSessionData | null): Record<string, string> {
    const session = emp ?? getEmployeeSession();
    if (!session) return {};

    // ✅ JWT path (secure — no password in headers)
    if (session.token) {
        return {
            'Authorization': `Bearer ${session.token}`,
        };
    }

    // ⚠️ Legacy path (deprecated — password in header, only for old sessions)
    const headers: Record<string, string> = {};
    if (session.id) headers['x-employee-id'] = session.id;
    if (session.username) headers['x-employee-username'] = session.username;
    if (session.password) headers['x-employee-password'] = session.password;
    return headers;
}

/**
 * Convenience: returns headers already merged with Content-Type: application/json
 */
export function getAdminJsonHeaders(emp?: AdminSessionData | null): Record<string, string> {
    return {
        'Content-Type': 'application/json',
        ...getAdminHeaders(emp),
    };
}
