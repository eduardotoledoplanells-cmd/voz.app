"use client";
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Heart, Mic, Gift, Bookmark, Play, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import BottomNav from '../components/BottomNav';
import VoiceCommentsModal from '../components/VoiceCommentsModal';
import LiveStreamModal from '../components/LiveStreamModal';
import ReportModal from '../components/ReportModal';
import { isUserBlocked } from '@/utils/blockedUsers';

export const FeedItem = ({ 
    v, 
    autoScroll, 
    scrollNext, 
    currentUserHandle, 
    onCommentClick,
    onReportClick,
    isActive
}: { 
    v: any, 
    autoScroll: boolean, 
    scrollNext: () => void, 
    currentUserHandle?: string, 
    onCommentClick: (videoId: string) => void,
    onReportClick: (video: any) => void,
    isActive: boolean
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isManualPause, setIsManualPause] = useState(false);
    const [isLiveOpen, setIsLiveOpen] = useState(false);
    const [hasLiveSignal, setHasLiveSignal] = useState(false);

    useEffect(() => {
        let active = true;
        const liveActive = v.is_live || v.isLive;
        const targetUrl = v.live_url || v.liveUrl;
        if (liveActive && targetUrl) {
            setHasLiveSignal(true);
            fetch(`/api/voz/live?url=${encodeURIComponent(targetUrl)}`)
                .then(res => res.json())
                .then(data => {
                    if (active && data.streamUrl) {
                        // Extracted HLS stream URL available
                    }
                })
                .catch(() => {});
        } else {
            setHasLiveSignal(false);
        }
        return () => {
            active = false;
        };
    }, [v.is_live, v.isLive, v.live_url, v.liveUrl]);
    
    // Icon States
    const [isLiked, setIsLiked] = useState(v.isLikedByMe || false);
    const [likesCount, setLikesCount] = useState(v.likes || 0);
    const [isBookmarked, setIsBookmarked] = useState(v.isBookmarkedByMe || false);
    const [giftScale, setGiftScale] = useState(1);
    const [isMuted, setIsMuted] = useState(false);

    // Scrubber states
    const [progressPct, setProgressPct] = useState(0);
    const [videoDuration, setVideoDuration] = useState(0);
    const [isDraggingScrubber, setIsDraggingScrubber] = useState(false);
    const [dragPct, setDragPct] = useState(0);
    const scrubberBarRef = useRef<HTMLDivElement | null>(null);

    const formatScrubTime = (sec: number) => {
        if (!sec || isNaN(sec)) return '0:00';
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleVideoTimeUpdate = () => {
        if (!videoRef.current || isDraggingScrubber) return;
        const cur = videoRef.current.currentTime || 0;
        const dur = videoRef.current.duration || 0;
        if (dur > 0) {
            setVideoDuration(dur);
            setProgressPct((cur / dur) * 100);
        }
    };

    const computePctFromEvent = (clientX: number) => {
        if (!scrubberBarRef.current) return 0;
        const rect = scrubberBarRef.current.getBoundingClientRect();
        if (rect.width <= 0) return 0;
        const offset = clientX - rect.left;
        const rawPct = (offset / rect.width) * 100;
        return Math.max(0, Math.min(rawPct, 100));
    };

    const handleScrubMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        setIsDraggingScrubber(true);
        if (videoRef.current) {
            videoRef.current.pause();
        }
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const p = computePctFromEvent(clientX);
        setDragPct(p);
    };

    const handleScrubMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDraggingScrubber) return;
        e.stopPropagation();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const p = computePctFromEvent(clientX);
        setDragPct(p);
    };

    const handleScrubMouseUp = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDraggingScrubber) return;
        e.stopPropagation();
        setIsDraggingScrubber(false);
        if (videoRef.current && videoDuration > 0) {
            const targetSec = (dragPct / 100) * videoDuration;
            videoRef.current.currentTime = targetSec;
            setProgressPct(dragPct);
            if (isActive && !isManualPause) {
                videoRef.current.play().catch(() => {});
                setIsPlaying(true);
            }
        }
    };

    const hasViewed = useRef(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Extract background music url
    const musicUrl = useMemo(() => {
        if (!v.music) return null;
        if (typeof v.music === 'string') {
            if (v.music.includes('previewUrl')) {
                try { return JSON.parse(v.music).previewUrl; } catch (e) {}
            } else if (v.music.startsWith('http')) {
                return v.music;
            }
        } else if (v.music && v.music.previewUrl) {
            return v.music.previewUrl;
        }
        return null;
    }, [v.music]);

    // Manage background audio track sync for videos with music
    useEffect(() => {
        if (typeof window === 'undefined' || !musicUrl) return;
        if (!audioRef.current) {
            audioRef.current = new Audio(musicUrl);
            audioRef.current.loop = true;
        }
        audioRef.current.muted = isMuted;

        if (isPlaying) {
            audioRef.current.play().catch(e => console.log('Background music play prevented', e));
        } else {
            audioRef.current.pause();
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, [isPlaying, isMuted, musicUrl]);

    // Helper to log video view
    const logView = () => {
        if (!hasViewed.current) {
            hasViewed.current = true;
            let anonId = typeof window !== 'undefined' ? sessionStorage.getItem('voz_anon_id') : null;
            if (!anonId) {
                anonId = 'anon_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
                if (typeof window !== 'undefined') sessionStorage.setItem('voz_anon_id', anonId);
            }
            fetch('/api/voz/videos/view', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoId: v.id, userHandle: currentUserHandle || anonId })
            }).catch(e => console.log('Error logging view', e));
        }
    };

    // Pause video when tab is hidden
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && videoRef.current) {
                videoRef.current.pause();
                setIsPlaying(false);
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // Active playback control
    useEffect(() => {
        if (isActive) {
            if (!isManualPause && videoRef.current && !document.hidden) {
                const p = videoRef.current.play();
                if (p !== undefined) {
                    p.then(() => {
                        setIsPlaying(true);
                        logView();
                    }).catch((err) => {
                        console.log('Autoplay un-muted prevented by browser, retrying muted', err);
                        if (videoRef.current) {
                            videoRef.current.muted = true;
                            setIsMuted(true);
                            videoRef.current.play().then(() => {
                                setIsPlaying(true);
                                logView();
                            }).catch(e2 => console.log('Muted play also prevented', e2));
                        }
                    });
                }
            }
        } else {
            if (videoRef.current) {
                videoRef.current.pause();
                setIsPlaying(false);
                setIsManualPause(false); // reset manual pause on slide change
            }
        }
    }, [isActive, isManualPause]);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
                setIsPlaying(false);
                setIsManualPause(true);
            } else {
                if (videoRef.current.muted || isMuted) {
                    videoRef.current.muted = false;
                    setIsMuted(false);
                }
                videoRef.current.play().then(() => {
                    setIsPlaying(true);
                    setIsManualPause(false);
                }).catch(e => {
                    console.log('Play prevented', e);
                    if (videoRef.current) {
                        videoRef.current.muted = true;
                        setIsMuted(true);
                        videoRef.current.play().then(() => {
                            setIsPlaying(true);
                            setIsManualPause(false);
                        });
                    }
                });
            }
        }
    };

    const handleVideoEnded = () => {
        if (autoScroll) {
            scrollNext();
        } else if (videoRef.current) {
            videoRef.current.play().catch(e => console.log('Loop play prevented', e));
        }
    };

    const handleLike = async () => {
        const newLiked = !isLiked;
        setIsLiked(newLiked);
        setLikesCount((prev: number) => newLiked ? prev + 1 : prev - 1);

        try {
            const token = localStorage.getItem('token') || '';
            await fetch('/api/voz/videos/like', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ videoId: v.id, userHandle: currentUserHandle })
            });
        } catch (e) { console.error("Error liking video", e); }
    };

    const handleBookmark = async () => {
        const newBookmarked = !isBookmarked;
        setIsBookmarked(newBookmarked);

        try {
            const token = localStorage.getItem('token') || '';
            await fetch('/api/voz/videos/bookmark', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ videoId: v.id, userHandle: currentUserHandle })
            });
        } catch (e) { console.error("Error bookmarking video", e); }
    };

    const handleGift = async () => {
        if (!currentUserHandle) {
            alert("Inicia sesión para enviar un regalo");
            return;
        }

        const receiver = v.user || v.userHandle;
        if (currentUserHandle === receiver) {
            alert("No puedes enviarte un regalo a ti mismo.");
            return;
        }

        if (typeof window !== 'undefined') {
            const audio = new Audio('/sounds/SonidoRegalo.mp3');
            audio.play().catch(e => console.log("Audio play prevented", e));
        }
        
        setGiftScale(1.5);
        setTimeout(() => setGiftScale(1), 300);
        
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch('/api/voz/gift', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ senderHandle: currentUserHandle, receiverHandle: receiver, amount: 1, videoId: v.id })
            });
            const data = await res.json();
            if (data.error) {
                if (data.error.includes("Insufficient funds") || data.error.includes("balance")) {
                    alert("No tienes suficientes monedas para enviar este regalo. ¡Recarga en tu perfil!");
                } else {
                    alert(data.error);
                }
            }
        } catch (e) { console.error("Error sending gift", e); }
    };

    const handleComment = () => {
        if (!currentUserHandle) { alert("Inicia sesión para comentar"); return; }
        onCommentClick(v.id);
    };

    const [isLandscapeDetected, setIsLandscapeDetected] = useState(false);
    const [isManualHorizontalMode, setIsManualHorizontalMode] = useState(false);

    useEffect(() => {
        setIsLandscapeDetected(false);
        setIsManualHorizontalMode(false);
    }, [v.id, v.videoUrl]);

    return (
        <div style={{ width: '100%', height: '100dvh', scrollSnapAlign: 'start', flexShrink: 0, display: 'flex', justifyContent: 'center', backgroundColor: '#000' }}>
            <div style={{ width: '100%', maxWidth: isManualHorizontalMode ? '850px' : '450px', height: '100%', position: 'relative', backgroundColor: '#000', transition: 'max-width 0.3s ease' }}>
                {v.videoUrl ? (
                    <div style={{ width: '100%', height: '100%', position: 'relative', cursor: 'pointer' }} onClick={togglePlay}>
                        <video 
                            ref={videoRef}
                            src={v.videoUrl} 
                            style={{ width: '100%', height: '100%', objectFit: isManualHorizontalMode ? 'contain' : 'cover' }}
                            controls={false}
                            loop={!autoScroll}
                            muted={isMuted}
                            playsInline
                            preload="auto"
                            onEnded={handleVideoEnded}
                            onTimeUpdate={handleVideoTimeUpdate}
                            onLoadedMetadata={() => {
                                if (videoRef.current) {
                                    if (videoRef.current.duration) setVideoDuration(videoRef.current.duration);
                                    const w = videoRef.current.videoWidth || 0;
                                    const h = videoRef.current.videoHeight || 0;
                                    if (w > 0 && h > 0 && w > h * 1.1) {
                                        setIsLandscapeDetected(true);
                                    } else {
                                        setIsLandscapeDetected(false);
                                    }
                                }
                            }}
                        />

                        />
                        {/* Sound Badge if Browser forced muted play */}
                        {isMuted && isPlaying && (
                            <div 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (videoRef.current) {
                                        videoRef.current.muted = false;
                                        setIsMuted(false);
                                    }
                                }}
                                style={{
                                    position: 'absolute',
                                    top: '20px',
                                    right: '20px',
                                    backgroundColor: 'rgba(0,0,0,0.7)',
                                    color: 'white',
                                    padding: '6px 12px',
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    zIndex: 25,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    border: '1px solid rgba(255,255,255,0.2)'
                                }}
                            >
                                🔇 Toca para activar sonido
                            </div>
                        )}
                        {/* Play/Pause Icon overlay */}
                        {!isPlaying && (
                            <div style={{ 
                                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
                                backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '50%', padding: '20px', 
                                display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' 
                            }}>
                                <Play size={40} color="white" fill="white" />
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ width: '100%', height: '100%', backgroundColor: '#111', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <p style={{ color: '#888' }}>Vídeo no disponible</p>
                    </div>
                )}

                {/* User info overlay */}
                <div style={{ 
                    position: 'absolute', bottom: '115px', left: '16px', right: '85px', color: 'white', 
                    textShadow: '0px 2px 6px rgba(0,0,0,0.95)', zIndex: 35, pointerEvents: 'none' 
                }}>
                    <Link href={`/profile?handle=${encodeURIComponent(v.user || v.userHandle || '')}`} style={{ pointerEvents: 'auto', textDecoration: 'none', color: 'white', display: 'inline-block' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '50%', border: '2px solid white', overflow: 'hidden', backgroundColor: '#333', flexShrink: 0 }}>
                                {v.userImage ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img src={v.userImage} alt={v.userName || v.user} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '18px' }}>
                                        {(v.userName || v.user || '?').charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div>
                                <span style={{ fontWeight: 'bold', fontSize: '16px', display: 'block', color: 'white' }}>{v.userName || v.user}</span>
                                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>{v.userHandle ? (v.userHandle.startsWith('@') ? v.userHandle : '@' + v.userHandle) : (v.user ? (v.user.startsWith('@') ? v.user : '@' + v.user) : '')}</span>
                            </div>
                        </div>
                    </Link>
                    {v.description && (
                        <p style={{ margin: '4px 0 0', fontSize: '14px', lineHeight: '1.4', maxHeight: '60px', overflow: 'hidden', color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.9)', pointerEvents: 'auto' }}>{v.description}</p>
                    )}
                </div>

                {/* Right Action Icons */}
                <div className="action-icons">
                    {(v.is_live || v.isLive) && v.live_url && hasLiveSignal && (
                        <>
                            <div 
                                style={{ textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                                onClick={() => setIsLiveOpen(true)}
                            >
                                <div style={{ 
                                    width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#FF3B30', 
                                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                                    animation: 'sonar-pulse 1.2s infinite',
                                    border: '2px solid white',
                                    boxShadow: '0 0 10px #FF3B30'
                                }}>
                                    <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'white', letterSpacing: '0.5px' }}>LIVE</span>
                                </div>
                                <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#FF3B30' }}>ON AIR</span>
                            </div>
                            <style>{`
                                @keyframes sonar-pulse {
                                    0% { transform: scale(1); filter: drop-shadow(0 0 2px rgba(255,59,48,0.5)); }
                                    50% { transform: scale(1.08); filter: drop-shadow(0 0 12px rgba(255,59,48,0.9)); }
                                    100% { transform: scale(1); filter: drop-shadow(0 0 2px rgba(255,59,48,0.5)); }
                                }
                            `}</style>
                        </>
                    )}
                    <div style={{ textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s', transform: `scale(${giftScale})` }} onClick={handleGift}>
                        <Gift size={32} color="#D4AF37" fill="#8E2DE2" />
                        <span style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>Regalo</span>
                    </div>
                    <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={handleLike}>
                        <Heart size={32} color={isLiked ? '#FF3B30' : 'white'} fill={isLiked ? '#FF3B30' : 'none'} />
                        <span style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>{likesCount}</span>
                    </div>
                    <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={handleComment}>
                        <Mic size={32} color="white" />
                        <span style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>{v.commentsCount || 0}</span>
                    </div>
                    <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={handleBookmark}>
                        <Bookmark size={32} color={isBookmarked ? '#FFD700' : 'white'} fill={isBookmarked ? '#FFD700' : 'none'} />
                        <span style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>Favoritos</span>
                    </div>
                </div>

                {/* Scrubber Progress Bar (Línea con Bolita Roja idéntica a la App Móvil) */}
                <div 
                    ref={scrubberBarRef}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={handleScrubMouseDown}
                    onMouseMove={handleScrubMouseMove}
                    onMouseUp={handleScrubMouseUp}
                    onTouchStart={handleScrubMouseDown}
                    onTouchMove={handleScrubMouseMove}
                    onTouchEnd={handleScrubMouseUp}
                    style={{
                        position: 'absolute',
                        bottom: '75px',
                        left: '0',
                        right: '0',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 20px',
                        zIndex: 40,
                        cursor: 'pointer',
                        userSelect: 'none',
                        touchAction: 'none'
                    }}
                >
                    {/* Badge de Tiempo al arrastrar */}
                    {isDraggingScrubber && (
                        <div style={{
                            position: 'absolute',
                            top: '-32px',
                            left: `${dragPct}%`,
                            transform: 'translateX(-50%)',
                            backgroundColor: 'rgba(18, 18, 20, 0.92)',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 0, 85, 0.4)',
                            color: '#FFFFFF',
                            fontSize: '11px',
                            fontWeight: '700',
                            letterSpacing: '0.5px',
                            boxShadow: '0 2px 8px rgba(255,0,85,0.4)',
                            pointerEvents: 'none',
                            whiteSpace: 'nowrap'
                        }}>
                            <span style={{ color: '#FF0055' }}>{formatScrubTime((dragPct / 100) * videoDuration)}</span>
                            <span style={{ color: 'rgba(255,255,255,0.5)' }}> / </span>
                            {formatScrubTime(videoDuration)}
                        </div>
                    )}

                    {/* Track Base */}
                    <div style={{
                        width: '100%',
                        height: isDraggingScrubber ? '6px' : '4px',
                        backgroundColor: 'rgba(255, 255, 255, 0.25)',
                        borderRadius: '4px',
                        position: 'relative',
                        transition: 'height 0.15s ease'
                    }}>
                        {/* Relleno Activo */}
                        <div style={{
                            position: 'absolute',
                            left: '0',
                            top: '0',
                            bottom: '0',
                            backgroundColor: '#FF0055',
                            borderRadius: '4px',
                            width: `${isDraggingScrubber ? dragPct : progressPct}%`
                        }} />

                        {/* Bolita Roja (Thumb Dot) */}
                        <div style={{
                            position: 'absolute',
                            left: `${isDraggingScrubber ? dragPct : progressPct}%`,
                            top: '50%',
                            width: isDraggingScrubber ? '18px' : '14px',
                            height: isDraggingScrubber ? '18px' : '14px',
                            borderRadius: '50%',
                            backgroundColor: '#FF0055',
                            border: '2px solid #FFFFFF',
                            transform: 'translate(-50%, -50%)',
                            boxShadow: '0 0 8px rgba(255,0,85,0.8)',
                            transition: 'width 0.15s ease, height 0.15s ease'
                        }} />
                    </div>
                </div>

                {/* Top Left Overlay: Ad badge, Report button, Landscape Toggle */}
                <div style={{ position: 'absolute', top: '20px', left: '15px', zIndex: 30, display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {v.isAd && (
                        <div style={{ backgroundColor: 'rgba(255,215,0,0.8)', color: '#000', padding: '5px 10px', borderRadius: '5px', fontWeight: 'bold', fontSize: '12px', pointerEvents: 'none' }}>
                            Promocionado
                        </div>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); onReportClick(v); }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            backgroundColor: 'rgba(0, 0, 0, 0.65)',
                            border: '1px solid rgba(255, 59, 48, 0.4)',
                            color: '#FF3B30',
                            padding: '5px 10px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                            transition: 'all 0.2s'
                        }}
                        title="Denunciar vídeo"
                    >
                        <ShieldAlert size={14} color="#FF3B30" />
                        <span>Denunciar</span>
                    </button>
                    {isLandscapeDetected && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsManualHorizontalMode(!isManualHorizontalMode);
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                                border: '1px solid rgba(255, 215, 0, 0.5)',
                                color: '#FFD700',
                                padding: '5px 10px',
                                borderRadius: '20px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                backdropFilter: 'blur(8px)',
                                WebkitBackdropFilter: 'blur(8px)',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                                transition: 'all 0.2s'
                            }}
                        >
                            {isManualHorizontalMode ? '📱 Vertical' : '🖥️ Ver en Horizontal'}
                        </button>
                    )}
                </div>

                {/* Live stream modal */}
                {(v.is_live || v.isLive) && v.live_url && hasLiveSignal && (
                    <LiveStreamModal 
                        isOpen={isLiveOpen} 
                        onClose={() => setIsLiveOpen(false)} 
                        liveUrl={v.live_url} 
                        creatorName={v.userName || v.userHandle || v.user} 
                        creatorHandle={v.user || v.userHandle}
                    />
                )}
            </div>
        </div>
    );
};

export default function FeedPage() {
    const { user } = useAuth();
    const [videos, setVideos] = useState<any[]>([]);
    const [initialVideos, setInitialVideos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [autoScroll, setAutoScroll] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    
    // Voice Comments Modal state
    const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
    const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);

    // Report Modal state
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportVideo, setReportVideo] = useState<any>(null);

    const handleOpenReport = (videoToReport: any) => {
        setReportVideo(videoToReport);
        setIsReportModalOpen(true);
    };

    const handleCommentAdded = (videoId: string) => {
        setVideos(prevVideos => 
            prevVideos.map(v => 
                v.id === videoId 
                    ? { ...v, commentsCount: (v.commentsCount || 0) + 1 } 
                    : v
            )
        );
    };

    const containerRef = useRef<HTMLDivElement>(null);
    const fetchingRef = useRef(false);
    const [hasMore, setHasMore] = useState(true);

    const fetchVideos = async (offset = 0) => {
        try {
            fetchingRef.current = true;
            const res = await fetch(`/api/voz/videos?limit=10&offset=${offset}`);
            const data = await res.json();
            const rawFetched = Array.isArray(data) ? data : data.videos || [];
            const fetchedVideos = rawFetched.filter((v: any) => !isUserBlocked(v.user || v.userHandle || v.user_handle));
            
            if (rawFetched.length < 10) {
                setHasMore(false);
            }
            
            if (offset === 0) {
                setVideos(fetchedVideos);
                setInitialVideos(fetchedVideos);
            } else if (fetchedVideos.length > 0) {
                setVideos(prev => {
                    const existingIds = new Set(prev.map(v => v.id));
                    const newVideos = fetchedVideos.filter((v: any) => !existingIds.has(v.id));
                    return [...prev, ...newVideos];
                });
            }
        } catch (error) {
            console.error('Error fetching videos:', error);
        } finally {
            setLoading(false);
            fetchingRef.current = false;
        }
    };

    useEffect(() => {
        fetchVideos(0);
    }, []);

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        // Completely disable mouse wheel scrolling on feed page as requested
        e.preventDefault();
        e.stopPropagation();
    };

    const scrollNext = () => {
        if (containerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
            if (scrollLeft + clientWidth >= scrollWidth - 50) {
                if (initialVideos.length > 0 && !hasMore) {
                    containerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                    setActiveIndex(0);
                    return;
                }
            }
            const nextIdx = Math.min(activeIndex + 1, videos.length - 1);
            setActiveIndex(nextIdx);
            containerRef.current.scrollTo({ left: nextIdx * window.innerWidth, behavior: 'smooth' });
        }
    };

    const scrollPrev = () => {
        if (containerRef.current) {
            const { scrollLeft } = containerRef.current;
            if (scrollLeft <= 10 && videos.length > 0) {
                const lastIdx = videos.length - 1;
                setActiveIndex(lastIdx);
                containerRef.current.scrollTo({ left: containerRef.current.scrollWidth, behavior: 'smooth' });
                return;
            }
            const prevIdx = Math.max(activeIndex - 1, 0);
            setActiveIndex(prevIdx);
            containerRef.current.scrollTo({ left: prevIdx * window.innerWidth, behavior: 'smooth' });
        }
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const width = target.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 1);
        if (width > 0) {
            const idx = Math.round(target.scrollLeft / width);
            if (idx !== activeIndex && idx >= 0 && idx < videos.length) {
                setActiveIndex(idx);
            }
        }
        if (target.scrollWidth - target.scrollLeft <= target.clientWidth + 500) {
            if (!fetchingRef.current && videos.length > 0) {
                if (hasMore) {
                    fetchVideos(videos.length);
                } else if (initialVideos.length > 0) {
                    fetchingRef.current = true;
                    setTimeout(() => {
                        const loopId = Math.random().toString(36).substring(2, 7);
                        setVideos(prev => [
                            ...prev,
                            ...initialVideos.map(v => ({
                                ...v,
                                loopKey: `${v.id}_loop_${loopId}`
                            }))
                        ]);
                        fetchingRef.current = false;
                    }, 200);
                }
            }
        }
    };

    return (
        <div style={{ backgroundColor: '#000', width: '100%', height: '100dvh', overflow: 'hidden', position: 'fixed', top: 0, left: 0 }}>
            
            {/* Mobile top bar */}
            <div className="mobile-top-bar">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo/logo-white.png" alt="LYVO" style={{ height: '32px', objectFit: 'contain' }} />
                <div style={{ fontSize: '11px', color: '#555', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>Feed</div>
                <div style={{ width: '32px' }} />
            </div>
            
            <style>{`
                .action-icons {
                    position: absolute;
                    bottom: 20px;
                    right: 15px;
                    color: white;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    align-items: center;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
                    z-index: 20;
                }
                .nav-arrow {
                    display: none;
                    position: fixed;
                    top: 50%;
                    transform: translateY(-50%);
                    background: rgba(255,255,255,0.1);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 60px;
                    height: 60px;
                    font-size: 24px;
                    cursor: pointer;
                    z-index: 50;
                    backdrop-filter: blur(5px);
                }
                .nav-arrow:hover {
                    background: rgba(255,255,255,0.2);
                }
                .nav-arrow.left { left: 20px; }
                .nav-arrow.right { right: 20px; }
                .feed-autoscroll-toggle {
                    position: fixed;
                    top: 70px;
                    right: 16px;
                    z-index: 100;
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(0,0,0,0.6);
                    padding: 8px 14px;
                    border-radius: 20px;
                    backdrop-filter: blur(8px);
                    font-size: 13px;
                }
                /* === HORIZONTAL SCROLL FEED === */
                .feed-scroll-container {
                    height: 100dvh;
                    width: 100vw;
                    display: flex;
                    flex-direction: row;
                    overflow-x: scroll;
                    overflow-y: hidden;
                    scroll-snap-type: x mandatory;
                    scroll-behavior: smooth;
                    -webkit-overflow-scrolling: touch;
                    scrollbar-width: none;
                    touch-action: pan-x;
                }
                .feed-scroll-container::-webkit-scrollbar { display: none; }
                .feed-scroll-container > div {
                    min-width: 100vw;
                    height: 100dvh;
                    flex-shrink: 0;
                    scroll-snap-align: start;
                }
                @media (min-width: 768px) {
                    .action-icons {
                        bottom: 50%;
                        transform: translateY(50%);
                        right: -80px;
                    }
                    .nav-arrow {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .feed-autoscroll-toggle { top: 20px; }
                }
                @media (min-width: 1025px) {
                    .feed-scroll-container {
                        height: 100dvh;
                    }
                    .feed-autoscroll-toggle { top: 20px; }
                }
            `}</style>

            {/* Auto-scroll toggle */}
            <div className="feed-autoscroll-toggle">
                <label style={{ fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }} htmlFor="autoscroll">Pasar automático</label>
                <input id="autoscroll" type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} style={{ cursor: 'pointer', width: '18px', height: '18px' }} />
            </div>

            {/* Desktop Navigation Arrows */}
            <button className="nav-arrow left" onClick={scrollPrev}>{"<"}</button>
            <button className="nav-arrow right" onClick={scrollNext}>{">"}</button>

            {/* Horizontal Scroll Snap Container */}
            <div 
                ref={containerRef}
                onScroll={handleScroll}
                onWheel={handleWheel}
                className="feed-scroll-container"
            >
                {loading ? (
                    <div style={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
                        Cargando Feed...
                    </div>
                ) : (
                    videos.map((v, index) => (
                        <FeedItem 
                            key={v.loopKey || `${v.id || 'vid'}-${index}`} 
                            v={v} 
                            isActive={index === activeIndex}
                            autoScroll={autoScroll} 
                            scrollNext={scrollNext} 
                            currentUserHandle={user?.handle}
                            onCommentClick={(id) => {
                                setCurrentVideoId(id);
                                setIsCommentModalOpen(true);
                            }}
                            onReportClick={handleOpenReport}
                        />
                    ))
                )}
            </div>
            
            <VoiceCommentsModal 
                isOpen={isCommentModalOpen}
                onClose={() => {
                    setIsCommentModalOpen(false);
                    setCurrentVideoId(null);
                }}
                videoId={currentVideoId || ''}
                currentUserHandle={user?.handle}
                videoOwnerHandle={videos.find(v => v.id === currentVideoId)?.user || videos.find(v => v.id === currentVideoId)?.user_handle}
                onCommentAdded={() => {
                    if (currentVideoId) {
                        handleCommentAdded(currentVideoId);
                    }
                }}
            />
            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => {
                    setIsReportModalOpen(false);
                    setReportVideo(null);
                }}
                video={reportVideo}
            />
            <BottomNav />
        </div>
    );
}