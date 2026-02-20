'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { Product } from '@/types';

interface FavoritesContextType {
    favorites: Product[];
    addToFavorites: (product: Product) => void;
    removeFromFavorites: (productId: string) => void;
    isFavorite: (productId: string) => boolean;
    toggleFavorite: (product: Product) => void;
    clearFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
    const [favorites, setFavorites] = useState<Product[]>([]);
    const { user, toggleFavorite: authToggleFavorite } = useAuth();
    const [allProducts, setAllProducts] = useState<Product[]>([]);

    useEffect(() => {
        // Load all products initially to resolve IDs to objects
        fetch('/api/products')
            .then(res => res.json())
            .then(data => setAllProducts(data))
            .catch(err => console.error('Error loading products for favorites context:', err));

        // Load guest favorites from localStorage
        if (!user) {
            const stored = localStorage.getItem('favorites');
            if (stored) {
                try {
                    setFavorites(JSON.parse(stored));
                } catch (e) {
                    console.error('Error parsing guest favorites:', e);
                }
            }
        }
    }, [user]);

    // Sync with User favorites or LocalStorage
    // Sync with User favorites
    // This effect runs when USER changes or PRODUCTS are loaded
    useEffect(() => {
        if (user && allProducts.length > 0) {
            if (Array.isArray(user.favorites)) {
                // Map user favorite IDs to full Product objects
                // Only update if we have a valid list
                const userFavs = allProducts.filter(p => user.favorites?.includes(p.id));
                setFavorites(userFavs);
            } else {
                setFavorites([]);
            }
        }
    }, [user, allProducts]); // REMOVED favorites from dependency array

    // Persist guest favorites to LocalStorage
    // This effect runs when FAVORITES change
    useEffect(() => {
        if (!user && favorites.length > 0) {
            localStorage.setItem('favorites', JSON.stringify(favorites));
        }
    }, [favorites, user]);

    const addToFavorites = (product: Product) => {
        setFavorites((prev) => {
            if (prev.some((p) => p.id === product.id)) return prev;
            const newFavs = [...prev, product];
            if (!user) {
                localStorage.setItem('favorites', JSON.stringify(newFavs));
            }
            return newFavs;
        });
    };

    const removeFromFavorites = (productId: string) => {
        setFavorites((prev) => {
            const newFavs = prev.filter((p) => p.id !== productId);
            if (!user) {
                localStorage.setItem('favorites', JSON.stringify(newFavs));
            }
            return newFavs;
        });
    };

    const isFavorite = (productId: string) => {
        // Check both local state and user object to be sure
        if (user && user.favorites) {
            return user.favorites.includes(productId);
        }
        return favorites.some((p) => p.id === productId);
    };

    const toggleFavorite = async (product: Product) => {
        if (user) {
            // Optimistic update
            const isFav = isFavorite(product.id);
            if (isFav) {
                removeFromFavorites(product.id);
            } else {
                addToFavorites(product);
            }

            await authToggleFavorite(product.id);
        } else {
            if (isFavorite(product.id)) {
                removeFromFavorites(product.id);
            } else {
                addToFavorites(product);
            }
        }
    };

    const clearFavorites = async () => {
        if (user) {
            // Call API to clear all (requires new endpoint or loop)
            // For now, loop
            if (user.favorites) {
                await Promise.all(user.favorites.map(id => authToggleFavorite(id)));
            }
            setFavorites([]);
        } else {
            setFavorites([]);
            localStorage.removeItem('favorites');
        }
    };

    return (
        <FavoritesContext.Provider
            value={{
                favorites,
                addToFavorites,
                removeFromFavorites,
                isFavorite,
                toggleFavorite,
                clearFavorites,
            }}
        >
            {children}
        </FavoritesContext.Provider>
    );
}

export function useFavorites() {
    const context = useContext(FavoritesContext);
    if (context === undefined) {
        throw new Error('useFavorites must be used within a FavoritesProvider');
    }
    return context;
}
