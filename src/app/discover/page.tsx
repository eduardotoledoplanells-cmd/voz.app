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
        const userHandle = (item.user_handle || item.user || '').toLowerCase();

        return searchTerms.every(term =>
            description.includes(term) || 
            category.includes(term) || 
            title.includes(term) ||
            userHandle.includes(term)
        );
    });

    return (
        <div style={{ backgroundColor: '#000', color: 'white', minHeight: '100dvh', width: '100%', display: 'flex', justifyContent: 'center', overflowX: 'hidden' }}>
            <div style={{ 
                width: '100%', 
                maxWidth: '450px', 
                minHeight: '100dvh', 
                backgroundColor: '#000', 
                borderLeft: '1px solid #222', 
                borderRight: '1px solid #222', 
                paddingBottom: 'calc(70px + env(safe-area-inset-bottom, 0px))',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Mobile Top Bar */}
                <div className="mobile-top-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid #222' }}>
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
                        <Search size={18} color="#888" />
                        <input
                            type="text"
                            placeholder="Buscar en VOZ..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                flex: 1, backgroundColor: 'transparent', border: 'none',
                                color: 'white', outline: 'none', fontSize: '14px',
                            }}
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 0 }}>
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Categorías */}
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '16px', scrollbarWidth: 'none' }} className="no-scrollbar">
                        {categories.map((cat, i) => (
                            <button
                                key={i}
                                onClick={() => setSearchQuery(cat.replace(/🎙️|[^a-zA-ZáéíóúÁÉÍÓÚñÑ ]/g, '').trim())}
                                style={{
                                    whiteSpace: 'nowrap', backgroundColor: 'rgba(255,255,255,0.06)',
                                    border: 'none', color: 'white', borderRadius: '10px',
                                    padding: '8px 14px', fontSize: '12px', fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                        Cargando contenido...
                    </div>
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
        </div>
    );
}
