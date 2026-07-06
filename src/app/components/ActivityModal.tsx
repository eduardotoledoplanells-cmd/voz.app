"use client";
import React, { useState, useEffect } from 'react';

export default function ActivityModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen) return;
        
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            window.location.href = '/login';
            return;
        }

        const user = JSON.parse(storedUser);
        const recipientId = user.handle || `@${user.name}`;

        setLoading(true);
        fetch(`/api/voz/notifications?recipientId=${encodeURIComponent(recipientId)}`)
            .then(res => res.json())
            .then(data => {
                const notifs = Array.isArray(data) ? data : [];
                setNotifications(notifs);
                setLoading(false);
                
                // Mark as read after 2 seconds
                setTimeout(() => {
                    fetch(`/api/voz/notifications?recipientId=${encodeURIComponent(recipientId)}`, {
                        method: 'PUT'
                    }).catch(console.error);
                }, 2000);
            })
            .catch(err => {
                console.error("Error fetching notifications:", err);
                setLoading(false);
            });
    }, [isOpen]);

    if (!isOpen) return null;

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
                    padding: '20px', borderBottom: '1px solid #333'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'white' }}>Actividad</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
                </div>

                {/* Body */}
                <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
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
