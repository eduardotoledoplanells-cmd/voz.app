"use client";
import { useState, useEffect } from 'react';
import BottomNav from '../components/BottomNav';
import Link from 'next/link';
import { Search, X } from 'lucide-react';

export default function DiscoverPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [videos, setVideos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const categories = ['Trending 🎙️', 'Relatos', 'Debates', 'Música', 'Humor', 'Noticias'];

    useEffect(() => {
        fetch('/api/voz/videos?limit=50')
            .then(res => res.json())
            .then(data => {
                const videoList = Array.isArray(data) ? data : (data.videos || []);
                setVideos(videoList);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching discover videos:", err);
                setLoading(false);
            });
    }, []);

    const filteredItems = videos.filter(item => {
        if (!item || item.isLiveCard) return false;
        const rawQuery = (searchQuery || '').trim();
        if (!rawQuery) return true;
        const cleanQuery = rawQuery.toLowerCase();
        const searchTerms = cleanQuery.split(/\s+/).map(t => t.replace('#', '')).filter(Boolean);
        if (searchTerms.length === 0) return true;
        const description = (item.description || '').toLowerCase();
        const category = (item.category || '').toLowerCase();
        const title = (item.title || '').toLowerCase();
        return searchTerms.every(term =>
            description.includes(term) || category.includes(term) || title.includes(term)
        );
    });

    return (
        <div style={{ backgroundColor: '#000', color: 'white', minHeight: '100dvh', width: '100%', paddingBottom: 'calc(70px + env(safe-area-inset-bottom, 0px))', overflowX: 'hidden' }}>

            {/* Mobile Top Bar — hidden on desktop via CSS */}
            <div className="mobile-top-bar">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo/logo-white.png" alt="VOZ" style={{ height: '30px', objectFit: 'contain' }} />
                <span style={{ fontWeight: '700', fontSize: '15px' }}>Descubrir</span>
                <div style={{ width: '30px' }} />
            </div>

            <div style={{ padding: '16px 16px 0' }}>
                {/* Search Bar */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    backgroundColor: 'rgba(255,255,255,0.07)',
                    borderRadius: '14px', padding: '12px 16px', marginBottom: '16px',
                    border: '1px solid rgba(255,255,255,0.06)'
                }}>
                    <Search size={18} color="#555" />
                    <input
                        type="text"
                        placeholder="Buscar creadores, videos, #hashtags..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ flex: 1, backgroundColor: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '15px', fontFamily: 'inherit' }}
                    />
                    {searchQuery.length > 0 && (
                        <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', display: 'flex' }}>
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Categories */}
                <div style={{ display: 'flex', overflowX: 'auto', paddingBottom: '12px', marginBottom: '4px', gap: '8px', scrollbarWidth: 'none' }}>
                    {categories.map((cat, i) => {
                        const catKey = cat.split(' ')[0].toLowerCase();
                        const isSelected = searchQuery === catKey;
                        return (
                            <button key={i} onClick={() => setSearchQuery(isSelected ? '' : catKey)} style={{
                                background: isSelected ? 'linear-gradient(135deg, #8E2DE2, #4A00E0)' : 'rgba(255,255,255,0.07)',
                                color: 'white', border: '1px solid rgba(255,255,255,0.06)',
                                padding: '8px 16px', borderRadius: '20px', fontWeight: '600',
                                whiteSpace: 'nowrap', cursor: 'pointer', fontSize: '13px', flexShrink: 0,
                                boxShadow: isSelected ? '0 4px 12px rgba(142,45,226,0.35)' : 'none'
                            }}>
                                {cat}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Videos Grid — Responsive (3 columns on mobile, auto-fill on desktop) */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#555' }}>Cargando...</div>
            ) : (
                <>
                    <div className="discover-video-grid">
                        {filteredItems.map(item => (
                            <Link key={item.id} href={`/video/${item.id}`} style={{ textDecoration: 'none' }}>
                                <div style={{ aspectRatio: '9/16', backgroundColor: '#111', position: 'relative', overflow: 'hidden' }}>
                                    {item.thumbnailUrl ? (
                                        <img src={item.thumbnailUrl} alt="thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '8px', textAlign: 'center' }}>
                                            <span style={{ fontSize: '0.65rem', color: '#555', wordBreak: 'break-word' }}>
                                                {item.description || '🎙️'}
                                            </span>
                                        </div>
                                    )}
                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 6px 6px', background: 'linear-gradient(transparent, rgba(0,0,0,0.75))' }}>
                                        {item.category && <span style={{ color: '#ccc', fontSize: '9px', display: 'block' }}>#{item.category}</span>}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                                            <span style={{ color: 'white', fontSize: '10px' }}>❤</span>
                                            <span style={{ color: 'white', fontSize: '10px', fontWeight: '700' }}>{item.likes || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                    <style>{`
                        .discover-video-grid {
                            display: grid;
                            grid-template-columns: repeat(3, 1fr);
                            gap: 2px;
                            padding: 2px;
                        }
                        @media (min-width: 768px) {
                            .discover-video-grid {
                                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                                gap: 16px;
                                padding: 16px;
                                max-width: 1200px;
                                margin: 0 auto;
                            }
                        }
                    `}</style>
                </>
            )}

            {!loading && filteredItems.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#555' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.4 }}>🔍</div>
                    <p style={{ fontWeight: '600' }}>Sin resultados para "{searchQuery}"</p>
                </div>
            )}

            <BottomNav />
        </div>
    );
}
