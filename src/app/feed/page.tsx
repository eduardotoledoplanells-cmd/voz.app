"use client";
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Heart, Mic, Gift, Bookmark, Play } from 'lucide-react';
import Link from 'next/link';
import BottomNav from '../components/BottomNav';
import VoiceCommentsModal from '../components/VoiceCommentsModal';
import LiveStreamModal from '../components/LiveStreamModal';

const FeedItem = ({ v, autoScroll, scrollNext, currentUserHandle, onCommentClick }: { v: any, autoScroll: boolean, scrollNext: () => void, currentUserHandle?: string, onCommentClick: (videoId: string) => void }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isManualPause, setIsManualPause] = useState(false);
    const [isLiveOpen, setIsLiveOpen] = useState(false);
    const [hasLiveSignal, setHasLiveSignal] = useState(false);
    const [isNear, setIsNear] = useState(true);

    const itemRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    setIsNear(entry.isIntersecting);
                });
            },
            { rootMargin: "0px 100% 0px 100%", threshold: 0 }
        );

        if (itemRef.current) {
            observer.observe(itemRef.current);
        }

        return () => {
            if (itemRef.current) observer.unobserve(itemRef.current);
        };
    }, []);

    useEffect(() => {
        let active = true;
        if ((v.is_live || v.isLive) && v.live_url) {
            fetch(`/api/voz/live?url=${encodeURIComponent(v.live_url)}`)
                .then(res => res.json())
                .then(data => {
                    if (active) {
                        setHasLiveSignal(!!data.streamUrl);
                    }
                })
                .catch(err => {
                    if (active) {
                        setHasLiveSignal(false);
                    }
                });
        } else {
            setHasLiveSignal(false);
        }
        return () => {
            active = false;
        };
    }, [v.is_live, v.isLive, v.live_url]);
    
    // Icon States
    const [isLiked, setIsLiked] = useState(v.isLikedByMe || false);
    const [likesCount, setLikesCount] = useState(v.likes || 0);
    const [isBookmarked, setIsBookmarked] = useState(v.isBookmarkedByMe || false);
    const [giftScale, setGiftScale] = useState(1);

    const hasViewed = useRef(false);

    // Pause video when tab is hidden (prevents double audio when app and web are open simultaneously)
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

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        // Only autoplay if tab is visible
                        if (!isManualPause && videoRef.current && !document.hidden) {
                            videoRef.current.play().then(() => {
                                setIsPlaying(true);
                                if (!hasViewed.current) {
                                    hasViewed.current = true;
                                    // Generate a unique anonymous ID per session to avoid collisions
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
                            }).catch(e => console.log('Autoplay prevented', e));
                        }
                    } else {
                        if (videoRef.current) {
                            videoRef.current.pause();
                            setIsPlaying(false);
                            setIsManualPause(false); // reset on scroll away
                        }
                    }
                });
            },
            { threshold: 0.6 }
        );

        if (videoRef.current) {
            observer.observe(videoRef.current);
        }

        return () => {
            if (videoRef.current) {
                observer.unobserve(videoRef.current);
            }
        };
    }, [isManualPause]);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
                setIsPlaying(false);
                setIsManualPause(true);
            } else {
                videoRef.current.play().then(() => {
                    setIsPlaying(true);
                    setIsManualPause(false);
                }).catch(e => console.log('Play prevented', e));
            }
        }
    };

    const pauseVideo = () => {
        if (videoRef.current && isPlaying) {
            videoRef.current.pause();
            setIsPlaying(false);
            setIsManualPause(true);
        }
    };

    const handleVideoEnded = () => {
        if (autoScroll) {
            scrollNext();
        }
    };

    const handleLike = async () => {
        if (!currentUserHandle) { alert("Inicia sesión para dar me gusta"); return; }
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikesCount((prev: number) => newIsLiked ? prev + 1 : prev - 1);
        try {
            const token = localStorage.getItem('token') || '';
            await fetch('/api/voz/videos/like', {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ videoId: v.id, userHandle: currentUserHandle, isLiked: newIsLiked })
            });
        } catch (e) { console.error("Error liking video", e); }
    };

    const handleBookmark = async () => {
        if (!currentUserHandle) { alert("Inicia sesión para favoritos"); return; }
        const newIsBookmarked = !isBookmarked;
        setIsBookmarked(newIsBookmarked);
        try {
            const token = localStorage.getItem('token') || '';
            await fetch('/api/voz/videos/bookmark', {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ videoId: v.id, userHandle: currentUserHandle, isBookmarked: newIsBookmarked })
            });
        } catch (e) { console.error("Error bookmarking video", e); }
    };

    const handleGift = async () => {
        if (!currentUserHandle) { alert("Inicia sesión para enviar regalos"); return; }
        
        const receiver = v.user || v.userHandle;
        if (currentUserHandle === receiver) {
            alert("No puedes enviarte un regalo a ti mismo.");
            return;
        }

        const audio = new Audio('/sounds/SonidoRegalo.mp3');
        audio.play().catch(e => console.log("Audio play prevented", e));
        
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

    return (
        <div ref={itemRef} style={{ width: '100vw', height: '100%', scrollSnapAlign: 'start', flexShrink: 0, display: 'flex', justifyContent: 'center', backgroundColor: '#000' }}>
            <div style={{ width: '100%', maxWidth: '450px', height: '100%', position: 'relative', backgroundColor: '#000' }}>
                {v.videoUrl ? (
                    <div style={{ width: '100%', height: '100%', position: 'relative', cursor: 'pointer' }} onClick={togglePlay}>
                        {isNear ? (
                            <video 
                                ref={videoRef}
                                src={v.videoUrl} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                controls={false}
                                loop={!autoScroll}
                                muted={false}
                                playsInline
                                onEnded={handleVideoEnded}
                            />
                        ) : (
                            <div style={{ width: '100%', height: '100%', backgroundColor: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                {v.thumbnailUrl && <img src={v.thumbnailUrl} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />}
                            </div>
                        )}
                        {/* Play/Pause Icon overlay */}
                        {!isPlaying && (
                            <div style={{ 
                                position: 'absolute', 
                                top: '50%', left: '50%', 
                                transform: 'translate(-50%, -50%)', 
                                backgroundColor: 'rgba(0,0,0,0.4)', 
                                borderRadius: '50%', 
                                width: '80px', height: '80px', 
                                display: 'flex', justifyContent: 'center', alignItems: 'center',
                                pointerEvents: 'none',
                                zIndex: 10
                            }}>
                                <Play size={40} color="white" fill="white" style={{ opacity: 0.8 }} />
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', color: 'white', backgroundColor: v.profileColor || '#8E2DE2' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎙️</div>
                            <h2>Audio de Voz</h2>
                        </div>
                    </div>
                )}

                {/* UI Superpuesta (Usuario, Título) */}
                <div style={{ position: 'absolute', bottom: '95px', left: '15px', color: 'white', maxWidth: '70%', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', pointerEvents: 'auto', zIndex: 20 }}>
                    <Link href={`/profile?handle=${encodeURIComponent(v.userHandle || v.userName || v.user || '')}`} onClick={(e) => e.stopPropagation()} style={{ textDecoration: 'none', color: 'white', cursor: 'pointer' }}>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>{v.userHandle || v.userName || '@usuario'}</h3>
                    </Link>
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.95rem', fontWeight: '500', opacity: 0.95 }}>{v.description || 'Sin descripción'}</p>
                </div>

                {/* Iconos laterales */}
                <div className="action-icons">
                    {(v.is_live || v.isLive) && v.live_url && hasLiveSignal && (
                        <>
                            <div 
                                style={{ 
                                    textAlign: 'center', 
                                    cursor: 'pointer', 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    alignItems: 'center',
                                    gap: '2px',
                                    animation: 'sonar-pulse 2s infinite',
                                    marginBottom: '15px'
                                }} 
                                onClick={(e) => { e.stopPropagation(); pauseVideo(); setIsLiveOpen(true); }}
                            >
                                <div style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '50%',
                                    backgroundColor: '#FF3B30',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
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

                {/* Etiqueta de Publicidad */}
                {v.isAd && (
                    <div style={{ position: 'absolute', top: '20px', left: '15px', backgroundColor: 'rgba(255,215,0,0.8)', color: '#000', padding: '5px 10px', borderRadius: '5px', fontWeight: 'bold', fontSize: '12px', pointerEvents: 'none' }}>
                        Promocionado
                    </div>
                )}

                {/* Modal de Directo */}
                {(v.is_live || v.isLive) && v.live_url && (
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
    
    // Voice Comments Modal state
    const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
    const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);

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
            const fetchedVideos = Array.isArray(data) ? data : data.videos || [];
            
            if (fetchedVideos.length < 10) {
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

    const scrollNext = () => {
        if (containerRef.current) {
            containerRef.current.scrollBy({ left: window.innerWidth, behavior: 'smooth' });
        }
    };

    const scrollPrev = () => {
        if (containerRef.current) {
            containerRef.current.scrollBy({ left: -window.innerWidth, behavior: 'smooth' });
        }
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        // Fetch more videos when near the right end
        if (target.scrollWidth - target.scrollLeft <= target.clientWidth + 300) {
            if (!fetchingRef.current && hasMore && videos.length > 0) {
                fetchVideos(videos.length);
            }
        }
    };

    return (
        <div style={{ backgroundColor: '#000', width: '100%', height: '100dvh', overflow: 'hidden', position: 'fixed', top: 0, left: 0 }}>
            
            {/* Mobile top bar — shown only on mobile via CSS */}
            <div className="mobile-top-bar">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo/logo-white.png" alt="VOZ" style={{ height: '32px', objectFit: 'contain' }} />
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
                    height: calc(100dvh - 56px - 65px - env(safe-area-inset-bottom, 0px));
                    width: 100%;
                    display: flex;
                    overflow-x: scroll;
                    overflow-y: hidden;
                    scroll-snap-type: x mandatory;
                    scroll-behavior: smooth;
                    -webkit-overflow-scrolling: touch;
                    scrollbar-width: none;
                }
                .feed-scroll-container::-webkit-scrollbar { display: none; }
                /* Each slide takes full viewport width */
                .feed-scroll-container > div {
                    min-width: 100vw;
                    height: 100%;
                    flex-shrink: 0;
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

            {/* Contenedor con Scroll Snap Vertical */}
            <div 
                ref={containerRef}
                onScroll={handleScroll}
                className="feed-scroll-container"
            >
                {loading ? (
                    <div style={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
                        Cargando Feed...
                    </div>
                ) : (
                    videos.map((v, index) => (
                        <FeedItem 
                            key={`${v.id || 'vid'}-${index}`} 
                            v={v} 
                            autoScroll={autoScroll} 
                            scrollNext={scrollNext} 
                            currentUserHandle={user?.handle}
                            onCommentClick={(id) => {
                                setCurrentVideoId(id);
                                setIsCommentModalOpen(true);
                            }}
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
            /><BottomNav />
        </div>
    );
}