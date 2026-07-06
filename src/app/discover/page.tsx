"use client";
import { useState, useEffect } from 'react';
import BottomNav from '../components/BottomNav';
import Link from 'next/link';

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
        const title = (item.title || '').toLowerCase(); // Soporte para futuros campos de título

        return searchTerms.every(term => 
            description.includes(term) || 
            category.includes(term) || 
            title.includes(term)
        );
    });

    return (
        <div style={{ backgroundColor: '#000', color: 'white', minHeight: '100vh', width: '100vw', paddingBottom: '70px', overflowX: 'hidden' }}>
            <div style={{ padding: '20px' }}>
                {/* Search Bar */}
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    backgroundColor: 'rgba(255,255,255,0.1)', 
                    borderRadius: '10px', 
                    padding: '10px 15px',
                    marginBottom: '20px'
                }}>
                    <span style={{ marginRight: '10px', color: 'gray' }}>🔍</span>
                    <input 
                        type="text" 
                        placeholder="Buscar creadores, videos, #hashtags..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ 
                            flex: 1, 
                            backgroundColor: 'transparent', 
                            border: 'none', 
                            color: 'white', 
                            outline: 'none',
                            fontSize: '16px'
                        }}
                    />
                    {searchQuery.length > 0 && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px' }}
                        >
                            ✕
                        </button>
                    )}
                </div>

                <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>
                    {searchQuery ? `Resultados para "${searchQuery}"` : 'Explorar Categorías'}
                </h2>

                {/* Categories */}
                <div style={{ 
                    display: 'flex', 
                    overflowX: 'auto', 
                    paddingBottom: '10px', 
                    marginBottom: '20px',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                }}>
                    {categories.map((cat, i) => {
                        const isSelected = searchQuery === cat.split(' ')[0].toLowerCase();
                        return (
                            <button
                                key={i}
                                onClick={() => setSearchQuery(isSelected ? '' : cat.split(' ')[0].toLowerCase())}
                                style={{
                                    backgroundColor: isSelected ? '#8E2DE2' : 'rgba(255,255,255,0.1)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    marginRight: '10px',
                                    fontWeight: 'bold',
                                    whiteSpace: 'nowrap',
                                    cursor: 'pointer'
                                }}
                            >
                                {cat}
                            </button>
                        );
                    })}
                </div>

                {/* Videos Grid */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'gray' }}>Cargando...</div>
                ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
                        {filteredItems.map(item => (
                            <Link key={item.id} href={`/video/${item.id}`} style={{ textDecoration: 'none' }}>
                                <div style={{ width: '110px', aspectRatio: '9/16', backgroundColor: '#222', position: 'relative', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                                    {item.thumbnailUrl ? (
                                        <img src={item.thumbnailUrl} alt="thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#111', padding: '5px', textAlign: 'center', overflow: 'hidden' }}>
                                            <span style={{ fontSize: '0.7rem', color: '#888', padding: '5px', textAlign: 'center', wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>
                                                {item.description}
                                            </span>
                                        </div>
                                    )}
                                    <div style={{ 
                                        position: 'absolute', 
                                        bottom: 0, 
                                        left: 0, 
                                        right: 0, 
                                        padding: '10px 5px 5px', 
                                        background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}>
                                        {item.category && <span style={{ color: 'white', fontWeight: 'bold', fontSize: '10px' }}>#{item.category}</span>}
                                        <div style={{ display: 'flex', alignItems: 'center', marginTop: '2px' }}>
                                            <span style={{ color: 'white', fontSize: '10px', marginRight: '3px' }}>❤️</span>
                                            <span style={{ color: 'white', fontSize: '10px', fontWeight: 'bold' }}>{item.likes || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
                
                {!loading && filteredItems.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'gray' }}>
                        <span style={{ fontSize: '40px', display: 'block', marginBottom: '10px', opacity: 0.5 }}>🔍</span>
                        No hay resultados para "{searchQuery}"
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
}

