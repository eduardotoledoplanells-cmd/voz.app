"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ActivityModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const router = useRouter();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [touchStartY, setTouchStartY] = useState(0);
    const [pullOffset, setPullOffset] = useState(0);

    const loadNotifications = async (showLoading = true) => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            window.location.href = '/login';
            return;
        }

        const user = JSON.parse(storedUser);
        const recipientId = user.handle || `@${user.name}`;

        if (showLoading) setLoading(true);
        try {
            const res = await fetch(`/api/voz/notifications?recipientId=${encodeURIComponent(recipientId)}`);
            const data = await res.json();
            const notifs = Array.isArray(data) ? data : [];
            setNotifications(notifs);
            setLoading(false);
            setRefreshing(false);
            setPullOffset(0);

            // Mark as read after 2 seconds
            setTimeout(() => {
                fetch(`/api/voz/notifications?recipientId=${encodeURIComponent(recipientId)}`, {
                    method: 'PUT'
                }).catch(console.error);
            }, 2000);
        } catch (err) {
            console.error("Error fetching notifications:", err);
            setLoading(false);
            setRefreshing(false);
            setPullOffset(0);
        }
    };

    useEffect(() => {
        if (!isOpen) return;
        loadNotifications(true);
    }, [isOpen]);

    if (!isOpen) return null;

    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        const container = e.currentTarget;
        // Only trigger pull-to-refresh if we're at the top of the scrollable container
        if (container.scrollTop === 0) {
            setTouchStartY(touch.clientY);
        } else {
            setTouchStartY(0);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (touchStartY === 0 || refreshing) return;
        const touch = e.touches[0];
        const diff = touch.clientY - touchStartY;
        if (diff > 0) {
            // Cap pull-to-refresh offset at 80px
            setPullOffset(Math.min(diff * 0.4, 80));
        }
    };

    const handleTouchEnd = () => {
        if (pullOffset > 50 && !refreshing) {
            setRefreshing(true);
            loadNotifications(false);
        } else {
            setPullOffset(0);
        }
        setTouchStartY(0);
    };

    const getIconForType = (type: string) => {
        switch (type) {
            case 'like': return '❤️';
            case 'comment': return '💬';
            case 'follow': return '👤';
            case 'gift': return '🎁';
            case 'donation': return '💰';
            case 'pm': return '✉️';
            case 'live_alert': return '🔴';
            default: return '🔔';
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            zIndex: 9999,
            display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start',
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                width: '100%', maxWidth: '450px', height: '100vh', maxHeight: '100vh',
                backgroundColor: '#111',
                borderRadius: '20px 0 0 20px',
                display: 'flex', flexDirection: 'column',
                boxShadow: '-5px 0 25px rgba(0,0,0,0.5)'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '18px 20px', borderBottom: '1px solid #333'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'white' }}>Actividad</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button 
                            onClick={() => { onClose(); router.push('/messages'); }}
                            style={{ 
                                backgroundColor: 'rgba(142, 45, 226, 0.2)', color: '#8E2DE2', border: '1px solid #8E2DE2',
                                borderRadius: '15px', padding: '5px 12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' 
                            }}
                        >
                            💬 Mensajes
                        </button>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
                    </div>
                </div>

                {/* Pull down indicator */}
                {(pullOffset > 0 || refreshing) && (
                    <div style={{
                        height: refreshing ? '40px' : `${pullOffset}px`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#8E2DE2',
                        fontSize: '13px',
                        overflow: 'hidden',
                        transition: refreshing ? 'height 0.2s' : 'none',
                        backgroundColor: 'rgba(255,255,255,0.02)',
                        borderBottom: '1px solid rgba(255,255,255,0.02)',
                        fontWeight: '600'
                    }}>
                        {refreshing ? 'Actualizando...' : pullOffset > 50 ? 'Suelta para actualizar' : 'Desliza hacia abajo para actualizar'}
                    </div>
                )}

                {/* Body */}
                <div 
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    style={{ 
                        padding: '20px', 
                        overflowY: 'auto', 
                        flex: 1,
                        transform: pullOffset > 0 && !refreshing ? `translateY(${pullOffset}px)` : 'none',
                        transition: touchStartY === 0 ? 'transform 0.2s' : 'none'
                    }}
                >
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'gray' }}>Cargando...</div>
                    ) : notifications.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'gray' }}>
                            <span style={{ fontSize: '40px', display: 'block', marginBottom: '10px', opacity: 0.5 }}>📭</span>
                            No tienes notificaciones recientes.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {notifications.map(notif => (
                                <div 
                                    key={notif.id} 
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'flex-start', 
                                        backgroundColor: notif.readStatus ? 'transparent' : 'rgba(142, 45, 226, 0.1)',
                                        padding: '15px', 
                                        borderRadius: '10px',
                                        border: '1px solid rgba(255,255,255,0.05)'
                                    }}
                                >
                                    <div style={{ fontSize: '24px', marginRight: '15px', minWidth: '30px', textAlign: 'center' }}>
                                        {getIconForType(notif.type)}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 'bold', marginBottom: '5px', color: 'white' }}>{notif.title}</div>
                                        <div style={{ color: 'gray', fontSize: '14px', lineHeight: '1.4' }}>{notif.message}</div>
                                        <div style={{ color: '#555', fontSize: '12px', marginTop: '8px' }}>
                                            {new Date(notif.timestamp).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    {!notif.readStatus && (
                                        <div style={{ width: '8px', height: '8px', backgroundColor: '#8E2DE2', borderRadius: '50%', marginTop: '5px' }} />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
