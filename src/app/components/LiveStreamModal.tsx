"use client";
import React, { useState, useEffect } from 'react';
import { X, Tv } from 'lucide-react';

interface LiveStreamModalProps {
    isOpen: boolean;
    onClose: () => void;
    liveUrl: string | null;
    creatorName: string | null;
}

export default function LiveStreamModal({ isOpen, onClose, liveUrl, creatorName }: LiveStreamModalProps) {
    const [embedUrl, setEmbedUrl] = useState<string>('');
    const [streamError, setStreamError] = useState(false);
    const [platform, setPlatform] = useState<string>('');

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
            // parent needs to include current host for Twitch player to work
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

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10000,
            padding: '20px'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '960px',
                backgroundColor: '#111',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
            }}>
                {/* Header */}
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

                {/* Video Embed Frame */}
                <div style={{
                    position: 'relative',
                    width: '100%',
                    paddingTop: '56.25%', // 16:9 Aspect Ratio
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
                                position: 'absolute',
                                top: 0, left: 0, width: '100%', height: '100%',
                                border: 'none'
                            }}
                            allowFullScreen
                            allow="autoplay; encrypted-media; picture-in-picture"
                        />
                    )}
                </div>
            </div>
            
            {/* Inject pulse animation */}
            <style jsx global>{`
                @keyframes pulse-badge {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.8; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
