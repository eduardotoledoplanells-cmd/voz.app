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
            const res = await fetch(`/api/voz/users/profile?${query}`);
            const data = await res.json();
            if (data.success && data.user) {
                const fresh = { ...u, ...data.user };
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
    }, []);

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
                    // Immediately fetch fresh data in the background to sync balance
                    setTimeout(() => refreshUserWithData(parsed), 800);
                } catch (error) {
                    console.error('Failed to parse stored user:', error);
                    localStorage.removeItem('user');
                    sessionStorage.removeItem('user');
                }
            }
            setIsLoading(false);
        };

        checkAuth();
    }, []);

    // Poll server every 30s to keep balance/coins in sync with app
    useEffect(() => {
        if (!user) return;
        const interval = setInterval(() => refreshUserWithData(user), 30000);
        return () => clearInterval(interval);
    }, [user?.id, refreshUserWithData]);

    const login = (userData: User, rememberMe: boolean = true) => {
        setUser(userData);
        if (rememberMe) {
            localStorage.setItem('user', JSON.stringify(userData));
            sessionStorage.removeItem('user');
        } else {
            sessionStorage.setItem('user', JSON.stringify(userData));
            localStorage.removeItem('user');
        }
        router.push('/profile');
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
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
