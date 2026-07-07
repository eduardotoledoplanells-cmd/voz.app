"use client";
import React, { useState, useEffect } from 'react';
import { X, Tv, Gift, Coins, Maximize2, Minimize2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface LiveStreamModalProps {
    isOpen: boolean;
    onClose: () => void;
    liveUrl: string | null;
    creatorName: string | null;
    creatorHandle?: string | null;
}

export default function LiveStreamModal({ isOpen, onClose, liveUrl, creatorName, creatorHandle }: LiveStreamModalProps) {
    const { user } = useAuth();
    const [embedUrl, setEmbedUrl] = useState<string>('');
    const [streamError, setStreamError] = useState(false);
    const [platform, setPlatform] = useState<string>('');
    const [isMobile, setIsMobile] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [giftScale, setGiftScale] = useState(1);
    const [sendingGift, setSendingGift] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!liveUrl) {
            setStreamError(true);
            return;
        }

        setStreamError(false);
        let channelName = '';
        let detectedPlatform = '';

        if (liveUrl.includes('twitch.tv/')) {
            const channel = liveUrl.split('twitch.tv/')[1]?.split('/')[0]?.split('?')[0];
            if (channel) {
                channelName = channel;
                detectedPlatform = 'twitch';
            } else setStreamError(true);
        } else if (liveUrl.includes('kick.com/')) {
            const channel = liveUrl.split('kick.com/')[1]?.split('/')[0]?.split('?')[0];
            if (channel) {
                channelName = channel;
                detectedPlatform = 'kick';
            } else setStreamError(true);
        } else if (liveUrl.includes('youtube.com/') || liveUrl.includes('youtu.be/')) {
            if (liveUrl.includes('watch?v=')) {
                const videoId = liveUrl.split('watch?v=')[1]?.split('&')[0]?.split('?')[0];
                if (videoId) {
                    channelName = videoId;
                    detectedPlatform = 'youtube_video';
                } else setStreamError(true);
            } else if (liveUrl.includes('/live/')) {
                const videoId = liveUrl.split('/live/')[1]?.split('/')[0]?.split('?')[0];
                if (videoId) {
                    channelName = videoId;
                    detectedPlatform = 'youtube_video';
                } else setStreamError(true);
            } else if (liveUrl.includes('youtu.be/')) {
                const videoId = liveUrl.split('youtu.be/')[1]?.split('/')[0]?.split('?')[0];
                if (videoId) {
                    channelName = videoId;
                    detectedPlatform = 'youtube_video';
                } else setStreamError(true);
            } else {
                const parts = liveUrl.split('youtube.com/')[1]?.split('/');
                const channel = parts?.find(p => p.startsWith('@')) || parts?.[0]?.split('?')[0];
                if (channel) {
                    channelName = channel;
                    detectedPlatform = 'youtube_channel';
                } else setStreamError(true);
            }
        } else {
            setStreamError(true);
        }

        if (detectedPlatform && channelName) {
            setPlatform(detectedPlatform);
            let url = '';
            let parentDomain = 'localhost';
            if (typeof window !== 'undefined') {
                parentDomain = window.location.hostname;
            }
            if (detectedPlatform === 'twitch') {
                url = `https://player.twitch.tv/?channel=${channelName}&parent=${parentDomain}&muted=false`;
            } else if (detectedPlatform === 'kick') {
                url = `https://player.kick.com/${channelName}`;
            } else if (detectedPlatform === 'youtube_video') {
                url = `https://www.youtube.com/embed/${channelName}?autoplay=1&mute=0`;
            } else if (detectedPlatform === 'youtube_channel') {
                url = `https://www.youtube.com/embed/live?channel=${channelName}&autoplay=1&mute=0`;
            }
            setEmbedUrl(url);
        }
    }, [liveUrl, isOpen]);

    const handleSendGift = async () => {
        if (!user) {
            alert("Inicia sesión para enviar regalos");
            return;
        }
        const senderHandle = user.handle || user.username || user.email;
        if (!senderHandle) {
            alert("No se pudo identificar tu cuenta de usuario");
            return;
        }
        const receiver = creatorHandle || creatorName;
        if (!receiver) {
            alert("No se pudo identificar al creador de esta transmisión");
            return;
        }

        if (senderHandle === receiver) {
            alert("No puedes enviarte un regalo a ti mismo.");
            return;
        }

        setSendingGift(true);
        const audio = new Audio('/sounds/SonidoRegalo.mp3');
        audio.play().catch(e => console.log("Audio play prevented", e));
        
        setGiftScale(1.5);
        setTimeout(() => setGiftScale(1), 300);

        try {
            const res = await fetch('/api/voz/gift', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ senderHandle, receiverHandle: receiver, amount: 10 })
            });
            const data = await res.json();
            if (data.error) {
                if (data.error.includes("Insufficient funds") || data.error.includes("balance")) {
                    alert("No tienes suficientes monedas para enviar este regalo. ¡Recarga en tu perfil!");
                } else {
                    alert(data.error);
                }
            } else {
                alert("¡Regalo enviado con éxito! 🎁");
            }
        } catch (e) {
            console.error("Error sending live gift", e);
            alert("Error de conexión al enviar el regalo");
        } finally {
            setSendingGift(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10000,
            padding: isMaximized ? '0' : '20px'
        }}>
            <div style={{
                width: '100%',
                maxWidth: isMaximized ? '100%' : '1100px',
                height: isMaximized ? '100vh' : 'auto',
                backgroundColor: '#111',
                border: isMaximized ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: isMaximized ? '0' : '24px',
                overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
            }}>
                {/* Header (Hidden in maximized mode to maximize space) */}
                {!isMaximized && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px 24px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        backgroundColor: 'rgba(20, 20, 20, 0.8)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                backgroundColor: '#FF3B30',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                boxShadow: '0 0 10px rgba(255,59,48,0.4)',
                                animation: 'pulse-badge 1.5s infinite'
                            }}>
                                <span style={{ width: '6px', height: '6px', backgroundColor: 'white', borderRadius: '50%' }}></span>
                                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '0.8rem', letterSpacing: '0.5px' }}>ON AIR</span>
                            </div>
                            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                Directo de {creatorName || 'Creador'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <button 
                                onClick={() => setIsMaximized(true)}
                                title="Maximizar directo"
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: 'none',
                                    color: '#aaa',
                                    cursor: 'pointer',
                                    padding: '8px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s',
                                    marginRight: '8px'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = 'white'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = '#aaa'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                            >
                                <Maximize2 size={18} />
                            </button>
                            <button 
                                onClick={onClose}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: 'none',
                                    color: '#aaa',
                                    cursor: 'pointer',
                                    padding: '8px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = 'white'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = '#aaa'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Floating controls in maximized mode */}
                {isMaximized && (
                    <div style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        zIndex: 100,
                        display: 'flex',
                        gap: '10px'
                    }}>
                        <button 
                            onClick={() => setIsMaximized(false)}
                            title="Restaurar ventana"
                            style={{
                                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                color: 'white',
                                padding: '8px',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Minimize2 size={20} />
                        </button>
                        <button 
                            onClick={onClose}
                            style={{
                                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                color: 'white',
                                padding: '8px',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <X size={20} />
                        </button>
                    </div>
                )}

                {/* Main Content Area */}
                <div style={{ 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row',
                    width: '100%',
                    height: isMaximized ? '100%' : 'auto',
                    backgroundColor: '#000'
                }}>
                    {/* Video Block */}
                    <div style={{
                        flex: 1,
                        position: 'relative',
                        width: '100%',
                        paddingTop: isMaximized ? '0' : (isMobile ? '56.25%' : '0'),
                        height: isMaximized ? '100vh' : (isMobile ? 'auto' : '520px'),
                        backgroundColor: '#000'
                    }}>
                        {streamError ? (
                            <div style={{
                                position: 'absolute',
                                top: 0, left: 0, right: 0, bottom: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                color: '#ccc',
                                padding: '20px',
                                textAlign: 'center'
                            }}>
                                <Tv size={48} color="#FF3B30" style={{ marginBottom: '15px' }} />
                                <h3 style={{ margin: '0 0 10px 0', color: 'white' }}>Directo No Disponible</h3>
                                <p style={{ margin: 0, fontSize: '0.9rem', maxWidth: '400px' }}>
                                    La transmisión del creador ha finalizado o el formato de enlace no está soportado.
                                </p>
                            </div>
                        ) : (
                            <iframe 
                                src={embedUrl}
                                style={{
                                    position: isMaximized ? 'static' : 'absolute',
                                    top: 0, left: 0, width: '100%', height: '100%',
                                    border: 'none'
                                }}
                                allowFullScreen
                                allow="autoplay; encrypted-media; picture-in-picture"
                            />
                        )}
                    </div>

                    {/* Desktop Sidebar Panel */}
                    {!isMobile && !isMaximized && (
                        <div style={{
                            width: '320px',
                            backgroundColor: '#151515',
                            borderLeft: '1px solid rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: '24px'
                        }}>
                            <div style={{
                                textAlign: 'center',
                                width: '100%',
                                backgroundColor: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '20px',
                                padding: '28px 20px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '16px'
                            }}>
                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(142, 45, 226, 0.1)',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    border: '1.5px solid #8E2DE2',
                                    boxShadow: '0 0 15px rgba(142,45,226,0.3)',
                                    animation: 'gift-radar 2s infinite'
                                }}>
                                    <Gift size={30} color="#8E2DE2" />
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: 'white', fontWeight: 'bold' }}>Enviar Regalo</h4>
                                    <span style={{ fontSize: '0.8rem', color: '#888' }}>Apoya a {creatorName || 'Creador'}</span>
                                </div>
                                <div style={{ 
                                    fontSize: '1.3rem', 
                                    fontWeight: 'bold', 
                                    color: '#FFD700',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    10.00 <Coins size={18} color="#FFD700" />
                                </div>
                                <button 
                                    onClick={handleSendGift}
                                    disabled={sendingGift}
                                    style={{
                                        width: '100%',
                                        backgroundColor: '#8E2DE2',
                                        color: 'white',
                                        border: 'none',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        fontWeight: 'bold',
                                        cursor: sendingGift ? 'default' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        boxShadow: '0 4px 15px rgba(142,45,226,0.4)',
                                        transition: 'transform 0.2s',
                                        transform: `scale(${giftScale})`
                                    }}
                                >
                                    {sendingGift ? 'Enviando...' : 'Enviar Regalo 🎁'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Mobile Bottom Panel */}
                {isMobile && !isMaximized && (
                    <div style={{
                        backgroundColor: '#151515',
                        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                        padding: '15px 20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <div style={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Apoya a este directo</div>
                            <div style={{ color: 'gray', fontSize: '0.75rem' }}>Envía un regalo de 10 monedas</div>
                        </div>
                        <button 
                            onClick={handleSendGift}
                            disabled={sendingGift}
                            style={{
                                backgroundColor: '#8E2DE2',
                                color: 'white',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '10px',
                                fontWeight: 'bold',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                transition: 'transform 0.2s',
                                transform: `scale(${giftScale})`
                            }}
                        >
                            <Gift size={14} /> Regalo (10 🪙)
                        </button>
                    </div>
                )}

                {/* Floating Gift Button in Maximized Mode */}
                {isMaximized && (
                    <div style={{
                        position: 'absolute',
                        bottom: '24px',
                        right: '24px',
                        zIndex: 100,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <button 
                            onClick={handleSendGift}
                            disabled={sendingGift}
                            style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                backgroundColor: '#8E2DE2',
                                border: '2px solid white',
                                boxShadow: '0 0 20px rgba(142,45,226,0.7)',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                transform: `scale(${giftScale})`,
                                animation: 'gift-radar 2s infinite'
                            }}
                        >
                            <Gift size={28} color="white" />
                        </button>
                        <span style={{ 
                            color: 'white', 
                            fontSize: '0.75rem', 
                            fontWeight: 'bold', 
                            backgroundColor: 'rgba(0,0,0,0.6)', 
                            padding: '2px 8px', 
                            borderRadius: '10px',
                            textShadow: '1px 1px 2px black'
                        }}>
                            Regalar (10 🪙)
                        </span>
                    </div>
                )}
            </div>
            
            {/* Styles for badge and gift pulse */}
            <style jsx global>{`
                @keyframes pulse-badge {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.8; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes gift-radar {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(142, 45, 226, 0.4); }
                    70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(142, 45, 226, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(142, 45, 226, 0); }
                }
            `}</style>
        </div>
    );
}
