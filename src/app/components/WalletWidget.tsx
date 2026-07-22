'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Coins, Gift } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser as supabase } from '@/lib/supabaseBrowser';

interface WalletWidgetProps {
    handle?: string;
    initialWalletBalance?: number;
    initialEarningsBalance?: number;
    onRecargarClick?: () => void;
    onTransferClick?: () => void;
    showTransferButton?: boolean;
    compact?: boolean;
}

export default function WalletWidget({
    handle,
    initialWalletBalance = 0,
    initialEarningsBalance = 0,
    onRecargarClick,
    onTransferClick,
    showTransferButton = true,
    compact = false
}: WalletWidgetProps) {
    const router = useRouter();
    const [walletBalance, setWalletBalance] = useState<number>(Number(initialWalletBalance));
    const [earningsBalance, setEarningsBalance] = useState<number>(Number(initialEarningsBalance));
    const [isWalletUpdated, setIsWalletUpdated] = useState<boolean>(false);
    const [isEarningsUpdated, setIsEarningsUpdated] = useState<boolean>(false);
    
    const prevWallet = useRef<number>(Number(initialWalletBalance));
    const prevEarnings = useRef<number>(Number(initialEarningsBalance));

    // Update internal states if props change
    useEffect(() => {
        if (initialWalletBalance !== undefined) setWalletBalance(Number(initialWalletBalance));
        if (initialEarningsBalance !== undefined) setEarningsBalance(Number(initialEarningsBalance));
    }, [initialWalletBalance, initialEarningsBalance]);

    // Realtime WebSocket Subscription (Zero Polling / Zero Server Stress)
    useEffect(() => {
        let userHandle = handle;
        if (!userHandle && typeof window !== 'undefined') {
            try {
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    const parsed = JSON.parse(storedUser);
                    userHandle = parsed.handle || parsed.name;
                }
            } catch (e) {}
        }

        if (!userHandle) return;

        const cleanHandle = userHandle.replace('@', '').toLowerCase();

        // 1. Initial fetch once on load
        fetch(`/api/voz/users/profile?handle=${encodeURIComponent(userHandle)}&t=${Date.now()}`)
            .then(res => res.json())
            .then(data => {
                if (data.success && data.user) {
                    const newW = Number(data.user.walletBalance || data.user.wallet_balance || 0);
                    const newE = Number(data.user.earningsBalance || data.user.earnings_balance || 0);
                    prevWallet.current = newW;
                    prevEarnings.current = newE;
                    setWalletBalance(newW);
                    setEarningsBalance(newE);
                }
            })
            .catch(e => console.warn("Initial wallet fetch error:", e));

        // 2. Realtime WebSocket listener
        const channel = supabase
            .channel(`wallet-updates-${cleanHandle}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'app_users',
                    filter: `handle=eq.${cleanHandle}`
                },
                (payload: any) => {
                    const updatedUser = payload.new;
                    if (updatedUser) {
                        const newW = Number(updatedUser.wallet_balance || 0);
                        const newE = Number(updatedUser.earnings_balance || 0);

                        if (newW !== prevWallet.current) {
                            prevWallet.current = newW;
                            setWalletBalance(newW);
                            setIsWalletUpdated(true);
                            setTimeout(() => setIsWalletUpdated(false), 2000);
                        }

                        if (newE !== prevEarnings.current) {
                            prevEarnings.current = newE;
                            setEarningsBalance(newE);
                            setIsEarningsUpdated(true);
                            setTimeout(() => setIsEarningsUpdated(false), 2000);
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [handle]);

    const formattedWallet = walletBalance.toFixed(2).replace('.', ',');
    const formattedEarnings = earningsBalance.toFixed(2).replace('.', ',');

    if (compact) {
        return (
            <div 
                style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    backgroundColor: '#181818', 
                    padding: '8px 14px', 
                    borderRadius: '20px', 
                    border: '1px solid rgba(255,215,0,0.3)',
                    transition: 'all 0.3s ease',
                    boxShadow: isWalletUpdated ? '0 0 15px rgba(255, 215, 0, 0.8)' : 'none',
                    transform: isWalletUpdated ? 'scale(1.05)' : 'scale(1)'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Coins size={16} color="#FFD700" />
                    <span style={{ color: '#FFD700', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        {formattedWallet} 🪙
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div style={{ width: '100%' }}>
            {/* Sector 1: Saldo de Consumo */}
            <div 
                style={{ 
                    backgroundColor: '#222', 
                    borderRadius: '15px', 
                    padding: '20px', 
                    marginBottom: '12px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    boxShadow: isWalletUpdated ? '0 0 20px rgba(255, 215, 0, 0.6)' : 'none',
                    border: isWalletUpdated ? '1px solid #FFD700' : '1px solid rgba(255,255,255,0.05)',
                    transform: isWalletUpdated ? 'scale(1.02)' : 'scale(1)'
                }}
            >
                <div>
                    <div style={{ color: '#aaa', fontSize: '0.85rem', fontWeight: '500' }}>Saldo (Para gastar)</div>
                    <div style={{ color: '#FFD700', fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                        <span>{formattedWallet}</span>
                        <Coins size={22} color="#FFD700" style={{ display: 'inline-block' }} />
                    </div>
                </div>
                <button 
                    onClick={onRecargarClick || (() => router.push('/profile?settings=true'))} 
                    style={{ 
                        background: 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)', 
                        color: 'white', 
                        padding: '10px 16px', 
                        borderRadius: '12px', 
                        border: 'none', 
                        fontWeight: 'bold', 
                        fontSize: '0.9rem',
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(142, 45, 226, 0.4)'
                    }}
                >
                    <Gift size={16} color="white" />
                    <span>Recargar</span>
                </button>
            </div>

            {/* Sector 2: Cartera (Dinero ganado) */}
            <div 
                style={{ 
                    backgroundColor: '#1a1a1a', 
                    borderRadius: '15px', 
                    padding: '20px', 
                    border: isEarningsUpdated ? '2px solid #4CD964' : '1px dashed #4CD964',
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    boxShadow: isEarningsUpdated ? '0 0 20px rgba(76, 217, 100, 0.6)' : 'none',
                    transform: isEarningsUpdated ? 'scale(1.02)' : 'scale(1)'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showTransferButton ? '12px' : '0' }}>
                    <div>
                        <div style={{ color: '#4CD964', fontSize: '0.85rem', fontWeight: '500' }}>Cartera (Dinero ganado)</div>
                        <div style={{ color: '#4CD964', fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                            <span>{formattedEarnings}</span>
                            <Coins size={22} color="#4CD964" style={{ display: 'inline-block' }} />
                        </div>
                    </div>
                    <div style={{ backgroundColor: 'rgba(76, 217, 100, 0.15)', padding: '10px', borderRadius: '50%' }}>
                        <Gift size={22} color="#4CD964" />
                    </div>
                </div>

                {showTransferButton && onTransferClick && (
                    <div style={{ marginTop: '10px' }}>
                        <button 
                            onClick={onTransferClick}
                            style={{ 
                                width: '100%', 
                                backgroundColor: 'rgba(76, 217, 100, 0.15)', 
                                color: '#4CD964', 
                                border: '1px solid #4CD964', 
                                padding: '8px 14px', 
                                borderRadius: '10px', 
                                fontWeight: 'bold', 
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                            }}
                        >
                            Pasar a Saldo
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
