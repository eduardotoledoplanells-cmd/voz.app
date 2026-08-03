'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '@/types';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    login: (userData: User, rememberMe?: boolean) => void;
    logout: () => void;
    isLoading: boolean;
    updateUser: (userData: User) => void;
    refreshUser: () => Promise<void>;
    toggleFavorite: (productId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Fetch fresh user data from server and update state + storage
    const refreshUserWithData = useCallback(async (u: User) => {
        if (!u?.id && !u?.handle) return;
        try {
            const query = u.id ? `id=${encodeURIComponent(u.id)}` : `handle=${encodeURIComponent(u.handle || '')}`;
            const res = await fetch(`/api/voz/users/profile?${query}&t=${Date.now()}`);
            const data = await res.json();
            if (data.success && data.user) {
                const fresh = { ...u, ...data.user };
                const storedLogout = localStorage.getItem('last_logout_ts') || sessionStorage.getItem('last_logout_ts');
                if (data.user.last_logout && storedLogout && data.user.last_logout !== storedLogout) {
                    // Logged out on another device/app
                    setUser(null);
                    localStorage.removeItem('user');
                    sessionStorage.removeItem('user');
                    localStorage.removeItem('last_logout_ts');
                    sessionStorage.removeItem('last_logout_ts');
                    router.push('/login');
                    return;
                }
                if (data.user.last_logout) {
                    if (localStorage.getItem('user')) localStorage.setItem('last_logout_ts', data.user.last_logout);
                    else sessionStorage.setItem('last_logout_ts', data.user.last_logout);
                }
                setUser(fresh);
                if (localStorage.getItem('user')) {
                    localStorage.setItem('user', JSON.stringify(fresh));
                } else if (sessionStorage.getItem('user')) {
                    sessionStorage.setItem('user', JSON.stringify(fresh));
                }
            }
        } catch (e) {
            console.warn('[Auth] refreshUser failed:', e);
        }
    }, [router]);

    const refreshUser = useCallback(async () => {
        setUser(current => {
            if (current) {
                refreshUserWithData(current);
            }
            return current;
        });
    }, [refreshUserWithData]);

    useEffect(() => {
        const checkAuth = async () => {
            // Check for auto-login parameters in the URL
            if (typeof window !== 'undefined') {
                const urlParams = new URLSearchParams(window.location.search);
                const uid = urlParams.get('uid') || urlParams.get('token') || urlParams.get('userId');
                
                if (uid) {
                    try {
                        const res = await fetch(`/api/voz/users/profile?id=${encodeURIComponent(uid)}`);
                        const data = await res.json();
                        if (data.success && data.user) {
                            setUser(data.user);
                            localStorage.setItem('user', JSON.stringify(data.user));
                            if (data.user.last_logout) localStorage.setItem('last_logout_ts', data.user.last_logout);
                            setIsLoading(false);
                            return;
                        }
                    } catch (err) {
                        console.error('Auto-login failed:', err);
                    }
                }
            }

            // Check for stored user in localStorage or sessionStorage
            const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
            if (storedUser) {
                try {
                    const parsed = JSON.parse(storedUser);
                    setUser(parsed);
                    // Immediately fetch fresh data in the background to sync balance & session
                    setTimeout(() => refreshUserWithData(parsed), 300);
                } catch (error) {
                    console.error('Failed to parse stored user:', error);
                    localStorage.removeItem('user');
                    sessionStorage.removeItem('user');
                }
            }
            setIsLoading(false);
        };

        checkAuth();
    }, [refreshUserWithData]);

    // Poll server every 10s to keep session and balance in sync with mobile app
    useEffect(() => {
        if (!user) return;
        const interval = setInterval(() => refreshUserWithData(user), 10000);
        return () => clearInterval(interval);
    }, [user, refreshUserWithData]);

    const login = (userData: User, rememberMe: boolean = true) => {
        setUser(userData);
        if (rememberMe) {
            localStorage.setItem('user', JSON.stringify(userData));
            if (userData.last_logout) localStorage.setItem('last_logout_ts', (userData as any).last_logout);
            sessionStorage.removeItem('user');
            sessionStorage.removeItem('last_logout_ts');
        } else {
            sessionStorage.setItem('user', JSON.stringify(userData));
            if (userData.last_logout) sessionStorage.setItem('last_logout_ts', (userData as any).last_logout);
            localStorage.removeItem('user');
            localStorage.removeItem('last_logout_ts');
        }
        router.push('/profile');
    };

    const logout = async () => {
        const currentUser = user;
        setUser(null);
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
        localStorage.removeItem('last_logout_ts');
        sessionStorage.removeItem('last_logout_ts');

        if (currentUser?.id || currentUser?.handle) {
            try {
                const nowIso = new Date().toISOString();
                await fetch('/api/voz/users/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: currentUser.id,
                        handle: currentUser.handle,
                        last_logout: nowIso
                    })
                });
            } catch (e) {
                console.warn("Failed to sync logout timestamp with server:", e);
            }
        }

        router.push('/login');
    };

    const updateUser = (userData: User) => {
        setUser(userData);
        if (localStorage.getItem('user')) {
            localStorage.setItem('user', JSON.stringify(userData));
        } else if (sessionStorage.getItem('user')) {
            sessionStorage.setItem('user', JSON.stringify(userData));
        }
    };

    const toggleFavorite = async (productId: string) => {
        if (!user) return;
        try {
            const res = await fetch('/api/users/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, productId }),
            });
            if (res.ok) {
                const data = await res.json();
                updateUser(data.user);
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading, updateUser, refreshUser, toggleFavorite }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
