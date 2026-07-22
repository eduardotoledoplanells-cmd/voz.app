"use client";
import { useState, useEffect } from 'react';
import BottomNav from '../components/BottomNav';

export default function ActivityPage() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            window.location.href = '/login';
            return;
        }

        const user = JSON.parse(storedUser);
        const recipientId = user.handle || `@${user.name}`;
        const token = localStorage.getItem('token') || user.id || '';
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        fetch(`/api/voz/notifications?recipientId=${encodeURIComponent(recipientId)}`, { headers })
            .then(res => res.json())
            .then(data => {
                const notifs = Array.isArray(data) ? data : [];
                setNotifications(notifs);
                setLoading(false);
                
                // Mark as read after 2 seconds
                setTimeout(() => {
                    fetch(`/api/voz/notifications?recipientId=${encodeURIComponent(recipientId)}`, {
                        method: 'PUT',
                        headers
                    }).catch(console.error);
                }, 2000);
            })
            .catch(err => {
                console.error("Error fetching notifications:", err);
                setLoading(false);
            });
    }, []);

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
        <div style={{ backgroundColor: '#000', color: 'white', minHeight: '100vh', width: '100vw', paddingBottom: '70px', overflowX: 'hidden' }}>
            <div style={{ padding: '20px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Actividad</h2>

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
                                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{notif.title}</div>
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
            <BottomNav />
        </div>
    );
}

