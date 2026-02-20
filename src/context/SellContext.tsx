'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/types';

interface SellItem extends Product {
    quantity: number;
}

interface SellContextType {
    sellItems: SellItem[];
    addToSellCart: (product: Product) => void;
    removeFromSellCart: (productId: string) => void;
    clearSellCart: () => void;
    totalSellPrice: number;
    sellItemCount: number;
}

const SellContext = createContext<SellContextType | undefined>(undefined);

export function SellProvider({ children }: { children: React.ReactNode }) {
    const [sellItems, setSellItems] = useState<SellItem[]>([]);

    // Load sell cart from localStorage on mount
    useEffect(() => {
        const savedSellCart = localStorage.getItem('sellCart');
        if (savedSellCart) {
            setSellItems(JSON.parse(savedSellCart));
        }
    }, []);

    // Save sell cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('sellCart', JSON.stringify(sellItems));
    }, [sellItems]);

    const addToSellCart = (product: Product) => {
        setSellItems(currentItems => {
            const existingItem = currentItems.find(item => item.id === product.id);

            if (existingItem) {
                // If item already exists, maybe just increase quantity or do nothing if unique?
                // For selling, usually you sell one unique item unless you have multiples.
                // Let's assume quantity increase for now.
                return currentItems.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }

            return [...currentItems, { ...product, quantity: 1 }];
        });
    };

    const removeFromSellCart = (productId: string) => {
        setSellItems(currentItems => currentItems.filter(item => item.id !== productId));
    };

    const clearSellCart = () => {
        setSellItems([]);
    };

    const totalSellPrice = sellItems.reduce((sum, item) => {
        const price = item.buyPrice || 0;
        return sum + (price * item.quantity);
    }, 0);

    const sellItemCount = sellItems.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <SellContext.Provider value={{ sellItems, addToSellCart, removeFromSellCart, clearSellCart, totalSellPrice, sellItemCount }}>
            {children}
        </SellContext.Provider>
    );
}

export function useSellCart() {
    const context = useContext(SellContext);
    if (!context) {
        throw new Error('useSellCart must be used within SellProvider');
    }
    return context;
}
