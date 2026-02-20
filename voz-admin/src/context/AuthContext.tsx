'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    login: (userData: User, rememberMe?: boolean) => void;
    logout: () => void;
    isLoading: boolean;
    updateUser: (userData: User) => void;
    toggleFavorite: (productId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check for stored user in localStorage or sessionStorage
        const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error('Failed to parse stored user:', error);
                localStorage.removeItem('user');
                sessionStorage.removeItem('user');
            }
        }
        setIsLoading(false);
    }, []);

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
        <AuthContext.Provider value={{ user, login, logout, isLoading, updateUser, toggleFavorite }}>
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
