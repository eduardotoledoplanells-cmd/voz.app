'use client';

const BLOCKED_USERS_KEY = 'voz_blocked_users';

export function getBlockedUsers(): string[] {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(BLOCKED_USERS_KEY);
        if (!stored) return [];
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed.map(u => normalizeHandle(u)) : [];
    } catch (e) {
        console.error('Error reading blocked users from localStorage:', e);
        return [];
    }
}

export function normalizeHandle(handle?: string): string {
    if (!handle) return '';
    const clean = handle.trim().toLowerCase();
    return clean.startsWith('@') ? clean : `@${clean}`;
}

export function isUserBlocked(handle?: string): boolean {
    if (!handle) return false;
    const target = normalizeHandle(handle);
    const blockedList = getBlockedUsers();
    return blockedList.includes(target);
}

export async function blockUser(blockerHandle: string, targetHandle: string): Promise<boolean> {
    if (!targetHandle) return false;
    const target = normalizeHandle(targetHandle);
    const current = getBlockedUsers();
    
    if (!current.includes(target)) {
        const updated = [...current, target];
        if (typeof window !== 'undefined') {
            localStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(updated));
        }
    }

    try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        await fetch('/api/voz/block', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                blocker: blockerHandle,
                blocked: target,
                action: 'block'
            })
        });
    } catch (e) {
        console.error('Error calling block API:', e);
    }

    return true;
}

export async function unblockUser(blockerHandle: string, targetHandle: string): Promise<boolean> {
    if (!targetHandle) return false;
    const target = normalizeHandle(targetHandle);
    const current = getBlockedUsers();
    const updated = current.filter(h => h !== target);

    if (typeof window !== 'undefined') {
        localStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(updated));
    }

    try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        await fetch('/api/voz/block', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                blocker: blockerHandle,
                blocked: target,
                action: 'unblock'
            })
        });
    } catch (e) {
        console.error('Error calling unblock API:', e);
    }

    return true;
}
