"use client";
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Heart, Mic, Gift, Bookmark, Play, ShieldAlert, Share2, Maximize, ThumbsDown, MoreVertical, EyeOff } from 'lucide-react';
import Link from 'next/link';
import '../feeditem.css';
import LiveStreamModal from './LiveStreamModal';

const formatVideoDate = (dateString: string) => {
    if (!dateString) return '';
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return '';
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    } catch {
        return '';
    }
};

export const FeedItem = ({ 
    v, 
    autoScroll, 
    scrollNext, 
    currentUserHandle, 
    onCommentClick,
    onReportClick,
    onHideUserVideos,
    isActive,
    hasBottomNav
}: { 
    v: any, 
    autoScroll: boolean, 
    scrollNext: () => void, 
    currentUserHandle?: string, 
    onCommentClick: (videoId: string) => void,
    onReportClick: (video: any) => void,
    onHideUserVideos?: (creatorHandle: string) => void,
    isActive: boolean,
    hasBottomNav?: boolean
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isManualPause, setIsManualPause] = useState(false);
    const [isLiveOpen, setIsLiveOpen] = useState(false);
    const [hasLiveSignal, setHasLiveSignal] = useState(false);

    useEffect(() => {
        let active = true;
        let intervalId: NodeJS.Timeout | null = null;
        
        const checkLive = () => {
            if (!active) return;
            const targetUrl = v.live_url || v.liveUrl;
            fetch(`/api/voz/live?url=${encodeURIComponent(targetUrl)}`)
                .then(res => res.json())
                .then(data => {
                    if (active) {
                        if (data.is_live || data.streamUrl) {
                            setHasLiveSignal(true);
                        } else {
                            setHasLiveSignal(false);
                        }
                    }
                })
                .catch(() => {
                    if (active) setHasLiveSignal(false);
                });
        };

        const liveActive = v.is_live || v.isLive;
        const targetUrl = v.live_url || v.liveUrl;
        
        if (liveActive && targetUrl) {
            setHasLiveSignal(false); // Estrictamente false mientras se valida
            checkLive();
            intervalId = setInterval(checkLive, 45000);
        } else {
            setHasLiveSignal(false);
        }
        return () => {
            active = false;
            if (intervalId) clearInterval(intervalId);
        };
    }, [v.is_live, v.isLive, v.live_url, v.liveUrl]);
    
    // Icon States
    const [isLiked, setIsLiked] = useState(v.isLikedByMe || false);
    const [likesCount, setLikesCount] = useState(v.likes || 0);
    const [isDisliked, setIsDisliked] = useState(v.isDislikedByMe || false);
    const [dislikesCount, setDislikesCount] = useState(v.dislikes || v.dislikesCount || 0);
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

    // Reset manual pause state when video ID or URL changes
    useEffect(() => {
        setIsManualPause(false);
    }, [v.id, v.videoUrl, v.video_url]);

    // Active playback control
    useEffect(() => {
        if (isActive && !isLiveOpen) {
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
                if (!isActive) {
                    setIsManualPause(false); // reset manual pause on slide change, but not on live modal open
                }
            }
        }
    }, [isActive, isManualPause, isLiveOpen, v.id, v.videoUrl, v.video_url]);

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
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ videoId: v.id, userHandle: currentUserHandle, isLiked: newLiked })
            });
        } catch (e) { console.error("Error liking video", e); }
    };

    const handleDislike = async () => {
        const newDisliked = !isDisliked;
        setIsDisliked(newDisliked);
        setDislikesCount((prev: number) => newDisliked ? prev + 1 : Math.max(0, prev - 1));

        try {
            const token = localStorage.getItem('token') || '';
            await fetch('/api/voz/videos/dislike', {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ videoId: v.id, userHandle: currentUserHandle, isDisliked: newDisliked })
            });
        } catch (e) { console.error("Error toggling dislike", e); }
    };

    const handleBookmark = async () => {
        const newBookmarked = !isBookmarked;
        setIsBookmarked(newBookmarked);

        try {
            const token = localStorage.getItem('token') || '';
            await fetch('/api/voz/videos/bookmark', {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ videoId: v.id, userHandle: currentUserHandle, isBookmarked: newBookmarked })
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
    const [showVideoOptions, setShowVideoOptions] = useState(false);

    useEffect(() => {
        setIsLandscapeDetected(false);
        setIsManualHorizontalMode(false);
        setShowVideoOptions(false);
    }, [v.id, v.videoUrl]);

    useEffect(() => {
        const handleDocClick = () => setShowVideoOptions(false);
        if (showVideoOptions) {
            document.addEventListener('click', handleDocClick);
            return () => document.removeEventListener('click', handleDocClick);
        }
    }, [showVideoOptions]);

    return (
        <div style={{ width: '100%', height: '100dvh', scrollSnapAlign: 'start', flexShrink: 0, display: 'flex', justifyContent: 'center', backgroundColor: '#000' }}>
            <div className={hasBottomNav !== false ? 'with-bottom-nav' : ''} style={{ width: '100%', maxWidth: isManualHorizontalMode ? '850px' : '450px', height: '100%', position: 'relative', backgroundColor: '#000', transition: 'max-width 0.3s ease' }}>
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

                {/* Top Right Profile Picture (Like App) */}
                <div style={{ position: 'absolute', top: '60px', right: '20px', zIndex: 45, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Link href={`/profile?handle=${encodeURIComponent(v.user || v.userHandle || '')}`} style={{ pointerEvents: 'auto' }}>
                        <div style={{ width: '50px', height: '50px', borderRadius: '50%', border: '2px solid white', overflow: 'hidden', backgroundColor: '#333', boxShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                            {v.userImage ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={v.userImage} alt={v.userName || v.user} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '20px', color: 'white' }}>
                                    {(v.userName || v.user || '?').charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                    </Link>
                </div>

                {/* User info overlay */}
                <div className="user-info-overlay" style={{ 
                    position: 'absolute', color: 'white', 
                    textShadow: '0px 2px 6px rgba(0,0,0,0.95)', zIndex: 35, pointerEvents: 'none' 
                }}>
                    <div className="user-info-content">
                        <Link href={`/profile?handle=${encodeURIComponent(v.user || v.userHandle || '')}`} style={{ pointerEvents: 'auto', textDecoration: 'none', color: 'white', display: 'inline-block' }}>
                            <div style={{ marginBottom: '8px' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '16px', display: 'block', color: 'white' }}>{v.userName || v.user}</span>
                                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>{v.userHandle ? (v.userHandle.startsWith('@') ? v.userHandle : '@' + v.userHandle) : (v.user ? (v.user.startsWith('@') ? v.user : '@' + v.user) : '')}</span>
                            </div>
                        </Link>
                        {v.description && (
                            <p style={{ margin: '4px 0 0', fontSize: '14px', lineHeight: '1.4', maxHeight: '60px', overflow: 'hidden', color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.9)', pointerEvents: 'auto' }}>
                                {(() => {
                                    const hasDateInDesc = /\(\d{2}\/\d{2}\/\d{4}\)$/.test(v.description.trim());
                                    if (hasDateInDesc) {
                                        return v.description.replace(/\(\d{2}\/\d{2}\/\d{4}\)$/, '').trim();
                                    }
                                    return v.description;
                                })()}
                            </p>
                        )}
                        {(() => {
                            const dateProp = v.createdAt || v.created_at;
                            const formattedDate = formatVideoDate(dateProp);
                            if (formattedDate) {
                                return (
                                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', fontFamily: 'monospace', margin: '4px 0 0', letterSpacing: '1px' }}>
                                        {formattedDate}
                                    </p>
                                );
                            }
                            return null;
                        })()}
                    </div>
                </div>

                {/* Left Action Icons */}
                <div className="left-sidebar">
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
                        <Gift size={30} color="#D4AF37" fill="#8E2DE2" />
                        <span style={{ fontSize: '11px', display: 'block', marginTop: '4px', fontWeight: '600' }}>Regalo</span>
                    </div>
                    <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={handleLike}>
                        <Heart size={30} color={isLiked ? '#FF3B30' : 'white'} fill={isLiked ? '#FF3B30' : 'none'} />
                        <span style={{ fontSize: '11px', display: 'block', marginTop: '4px', fontWeight: '600' }}>{likesCount}</span>
                    </div>
                    <div style={{ textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={handleComment}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '18px', backgroundColor: '#8E2DE2', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <Mic size={20} color="white" />
                        </div>
                        <span style={{ fontSize: '11px', display: 'block', marginTop: '4px', fontWeight: '600' }}>{v.commentsCount || 0}</span>
                    </div>
                </div>

                {/* Right Action Icons */}
                <div className="right-sidebar">
                    {!v.isAd && (
                        <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={handleDislike}>
                            <ThumbsDown size={28} color={isDisliked ? '#FF3B30' : 'white'} fill={isDisliked ? '#FF3B30' : 'none'} />
                            <span style={{ fontSize: '11px', display: 'block', marginTop: '4px', fontWeight: '600' }}>
                                {(isDisliked && (dislikesCount === 0 || dislikesCount === '0')) ? 1 : dislikesCount}
                            </span>
                        </div>
                    )}
                    <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={handleBookmark}>
                        <Bookmark size={30} color={isBookmarked ? '#FFD700' : 'white'} fill={isBookmarked ? '#FFD700' : 'none'} />
                        <span style={{ fontSize: '11px', display: 'block', marginTop: '4px', fontWeight: '600' }}>Favoritos</span>
                    </div>
                    <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={(e) => {
                        e.stopPropagation();
                        if (navigator.share) {
                            navigator.share({ title: 'LYVO App', url: window.location.origin + '/video/' + v.id }).catch(() => {});
                        } else {
                            navigator.clipboard.writeText(window.location.origin + '/video/' + v.id);
                            alert("¡Enlace copiado al portapapeles!");
                        }
                    }}>
                        <Share2 size={28} color="white" />
                        <span style={{ fontSize: '11px', display: 'block', marginTop: '4px', fontWeight: '600' }}>Compartir</span>
                    </div>
                </div>

                {/* Scrubber Progress Bar en el filo superior del menú inferior */}
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
                        bottom: hasBottomNav !== false ? 'calc(65px + env(safe-area-inset-bottom, 0px))' : 'env(safe-area-inset-bottom, 0px)',
                        left: '0',
                        right: '0',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0',
                        zIndex: 1100,
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
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                            color: '#FFFFFF',
                            fontSize: '11px',
                            fontWeight: '700',
                            letterSpacing: '0.5px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                            pointerEvents: 'none',
                            whiteSpace: 'nowrap'
                        }}>
                            <span style={{ color: '#FFFFFF' }}>{formatScrubTime((dragPct / 100) * videoDuration)}</span>
                            <span style={{ color: 'rgba(255,255,255,0.5)' }}> / </span>
                            {formatScrubTime(videoDuration)}
                        </div>
                    )}

                    {/* Track Base */}
                    <div style={{
                        width: '100%',
                        height: isDraggingScrubber ? '4px' : '2px',
                        backgroundColor: 'rgba(255, 255, 255, 0.25)',
                        borderRadius: '2px',
                        position: 'relative',
                        transition: 'height 0.15s ease'
                    }}>
                        {/* Relleno Activo (Rojo de marca) */}
                        <div style={{
                            position: 'absolute',
                            left: '0',
                            top: '0',
                            bottom: '0',
                            backgroundColor: '#FF0055',
                            borderRadius: '2px',
                            width: `${Math.min(100, Math.max(0, isDraggingScrubber ? dragPct : progressPct))}%`
                        }} />

                        {/* ÚNICA Bolita Roja (Thumb Dot) */}
                        <div style={{
                            position: 'absolute',
                            left: `${Math.min(100, Math.max(0, isDraggingScrubber ? dragPct : progressPct))}%`,
                            top: '50%',
                            width: isDraggingScrubber ? '14px' : '10px',
                            height: isDraggingScrubber ? '14px' : '10px',
                            borderRadius: '50%',
                            backgroundColor: '#FF0055',
                            border: '2px solid #FFFFFF',
                            transform: 'translate(-50%, -50%)',
                            boxShadow: '0 0 6px rgba(255,0,85,0.8)',
                            transition: 'width 0.15s ease, height 0.15s ease',
                            pointerEvents: 'none'
                        }} />
                    </div>
                </div>

                {/* Top Left Overlay: Ad badge & 3-dots Menu Button */}
                <div style={{ position: 'absolute', top: '60px', left: '15px', zIndex: 60, display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                    {v.isAd && (
                        <div style={{ backgroundColor: 'rgba(255,215,0,0.8)', color: '#000', padding: '5px 10px', borderRadius: '5px', fontWeight: 'bold', fontSize: '12px', pointerEvents: 'none' }}>
                            Promocionado
                        </div>
                    )}
                    
                    {/* 3-Dots Options Menu */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowVideoOptions(prev => !prev);
                            }}
                            style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                border: '1px solid rgba(255, 255, 255, 0.25)',
                                color: 'white',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                cursor: 'pointer',
                                backdropFilter: 'blur(8px)',
                                WebkitBackdropFilter: 'blur(8px)',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                                transition: 'all 0.2s'
                            }}
                            title="Opciones del vídeo"
                        >
                            <MoreVertical size={18} color="white" />
                        </button>

                        {/* Dropdown Menu Modal */}
                        {showVideoOptions && (
                            <div
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    position: 'absolute',
                                    top: '42px',
                                    left: '0',
                                    backgroundColor: 'rgba(24, 24, 28, 0.96)',
                                    backdropFilter: 'blur(16px)',
                                    WebkitBackdropFilter: 'blur(16px)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    borderRadius: '14px',
                                    padding: '6px',
                                    minWidth: '170px',
                                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.75)',
                                    zIndex: 100,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px'
                                }}
                            >
                                {/* Pantalla Completa - If landscape detected */}
                                {isLandscapeDetected && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowVideoOptions(false);
                                            if (videoRef.current) {
                                                if (videoRef.current.requestFullscreen) {
                                                    videoRef.current.requestFullscreen();
                                                } else if ((videoRef.current as any).webkitRequestFullscreen) {
                                                    (videoRef.current as any).webkitRequestFullscreen();
                                                }
                                            }
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                            border: 'none',
                                            color: '#FFFFFF',
                                            padding: '9px 12px',
                                            borderRadius: '10px',
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'background-color 0.15s'
                                        }}
                                    >
                                        <Maximize size={16} color="white" />
                                        <span>Pantalla Completa</span>
                                    </button>
                                )}

                                {/* Dejar de ver vídeos de este usuario */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowVideoOptions(false);
                                        const creatorHandle = v.user || v.user_handle || v.userHandle;
                                        if (!creatorHandle) return;
                                        if (window.confirm(`¿Quieres dejar de ver vídeos de ${creatorHandle}? No se le bloqueará, pero sus publicaciones dejarán de aparecer en tu feed.`)) {
                                            if (onHideUserVideos) {
                                                onHideUserVideos(creatorHandle);
                                            } else {
                                                try {
                                                    const stored = JSON.parse(localStorage.getItem('lyvo_hidden_creators') || '[]');
                                                    if (!stored.includes(creatorHandle)) {
                                                        stored.push(creatorHandle);
                                                        localStorage.setItem('lyvo_hidden_creators', JSON.stringify(stored));
                                                    }
                                                    alert(`Ya no verás más vídeos de ${creatorHandle} en tu feed.`);
                                                    scrollNext();
                                                } catch (err) {
                                                    console.error(err);
                                                }
                                            }
                                        }
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        color: '#FFFFFF',
                                        padding: '9px 12px',
                                        borderRadius: '10px',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'background-color 0.15s'
                                    }}
                                >
                                    <EyeOff size={16} color="white" />
                                    <span>Dejar de ver vídeos de este usuario</span>
                                </button>

                                {/* Denunciar */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowVideoOptions(false);
                                        onReportClick(v);
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        backgroundColor: 'rgba(255, 59, 48, 0.12)',
                                        border: '1px solid rgba(255, 59, 48, 0.2)',
                                        color: '#FF3B30',
                                        padding: '9px 12px',
                                        borderRadius: '10px',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'background-color 0.15s'
                                    }}
                                >
                                    <ShieldAlert size={16} color="#FF3B30" />
                                    <span>Denunciar</span>
                                </button>
                            </div>
                        )}
                    </div>
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

export default FeedItem;
