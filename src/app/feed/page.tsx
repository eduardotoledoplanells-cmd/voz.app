"use client";
import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import '../feeditem.css';
import BottomNav from '../components/BottomNav';
import FeedItem from '../components/FeedItem';
import VoiceCommentsModal from '../components/VoiceCommentsModal';
import ReportModal from '../components/ReportModal';
import { isUserBlocked } from '@/utils/blockedUsers';

function FeedContent() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const videoParam = searchParams.get('v');

    useEffect(() => {
        if (!isLoading && !user) {
            const dest = videoParam ? `/?authRequired=1&video=${encodeURIComponent(videoParam)}` : '/?authRequired=1';
            router.replace(dest);
        }
    }, [user, isLoading, router, videoParam]);
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

    const isUserHidden = (handle: string) => {
        if (!handle) return false;
        try {
            const hidden = JSON.parse(localStorage.getItem('lyvo_hidden_creators') || '[]');
            const clean = handle.replace('@', '').toLowerCase();
            return hidden.some((h: string) => h.replace('@', '').toLowerCase() === clean);
        } catch {
            return false;
        }
    };

    const handleHideUserVideos = (creatorHandle: string) => {
        if (!creatorHandle) return;
        try {
            const hidden = JSON.parse(localStorage.getItem('lyvo_hidden_creators') || '[]');
            if (!hidden.includes(creatorHandle)) {
                hidden.push(creatorHandle);
                localStorage.setItem('lyvo_hidden_creators', JSON.stringify(hidden));
            }
            const clean = creatorHandle.replace('@', '').toLowerCase();
            setVideos(prev => prev.filter(v => (v.user || v.userHandle || v.user_handle || '').replace('@', '').toLowerCase() !== clean));
            alert(`Ya no verás más vídeos de ${creatorHandle} en tu feed.`);
        } catch (e) {
            console.error(e);
        }
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
            const fetchedVideos = rawFetched.filter((v: any) => 
                !isUserBlocked(v.user || v.userHandle || v.user_handle) &&
                !isUserHidden(v.user || v.userHandle || v.user_handle)
            );
            
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
                    top: 12px;
                    right: 16px;
                    z-index: 1000;
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(0,0,0,0.55);
                    border: 1px solid rgba(255,255,255,0.15);
                    padding: 6px 12px;
                    border-radius: 20px;
                    backdrop-filter: blur(8px);
                    font-size: 12px;
                }
                /* === HORIZONTAL SCROLL FEED === */
                .feed-scroll-container {
                    height: calc(100dvh - 56px);
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
                    height: calc(100dvh - 56px);
                    flex-shrink: 0;
                    scroll-snap-align: start;
                }
                @media (max-height: 500px) and (orientation: landscape) {
                    .feed-scroll-container { height: calc(100dvh - 44px); }
                    .feed-scroll-container > div { height: calc(100dvh - 44px); }
                }
                @media (min-width: 768px) {
                    .nav-arrow {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .feed-autoscroll-toggle { top: 20px; }
                    .feed-scroll-container { height: 100dvh; }
                    .feed-scroll-container > div { height: 100dvh; }
                }
                @media (min-width: 1025px) {
                    .feed-autoscroll-toggle { top: 20px; }
                    .feed-scroll-container {
                        height: 100dvh;
                    }
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
                            isActive={index === activeIndex && !isCommentModalOpen && !isReportModalOpen}
                            autoScroll={autoScroll} 
                            scrollNext={scrollNext} 
                            currentUserHandle={user?.handle}
                            onCommentClick={(id) => {
                                setCurrentVideoId(id);
                                setIsCommentModalOpen(true);
                            }}
                            onReportClick={handleOpenReport}
                            onHideUserVideos={handleHideUserVideos}
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

export default function FeedPage() {
    return (
        <Suspense fallback={<div style={{ backgroundColor: '#000', width: '100vw', height: '100dvh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>Cargando Feed...</div>}>
            <FeedContent />
        </Suspense>
    );
}