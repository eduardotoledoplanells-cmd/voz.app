"use client";
import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import BottomNav from '../components/BottomNav';
import ProfileSettingsModal from '../components/ProfileSettingsModal';
import { Grid, Bookmark, Heart, Lock, Play, Trash2 } from 'lucide-react';

function ProfilePageContent() {
    const { user: loggedInUser, logout, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [videos, setVideos] = useState<any[]>([]);
    const [loadingVideos, setLoadingVideos] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [profileUser, setProfileUser] = useState<any>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);

    const [activeTab, setActiveTab] = useState<'grid' | 'bookmarks' | 'likes' | 'drafts'>('grid');
    const [bookmarkedVideos, setBookmarkedVideos] = useState<any[]>([]);
    const [likedVideos, setLikedVideos] = useState<any[]>([]);
    const [drafts, setDrafts] = useState<any[]>([]);
    const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
    const [likedIds, setLikedIds] = useState<string[]>([]);
    const [loadingBookmarks, setLoadingBookmarks] = useState(false);
    const [loadingLikes, setLoadingLikes] = useState(false);

    const targetHandle = searchParams.get('handle');
    const targetId = searchParams.get('id');

    useEffect(() => {
        if (targetHandle || targetId) {
            setLoadingProfile(true);
            const query = targetHandle 
                ? `handle=${encodeURIComponent(targetHandle)}` 
                : `id=${encodeURIComponent(targetId!)}`;
            fetch(`/api/voz/users/profile?${query}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.user) {
                        setProfileUser(data.user);
                    } else {
                        setProfileUser(null);
                    }
                    setLoadingProfile(false);
                })
                .catch(() => {
                    setProfileUser(null);
                    setLoadingProfile(false);
                });
        } else {
            if (!authLoading) {
                if (loggedInUser) {
                    setProfileUser(loggedInUser);
                    setLoadingProfile(false);
                } else {
                    router.push('/login');
                }
            }
        }
    }, [targetHandle, targetId, loggedInUser, authLoading, router]);

    useEffect(() => {
        if (searchParams.get('settings') === 'true' || searchParams.get('edit') === 'true') {
            setIsSettingsOpen(true);
        }
    }, [searchParams]);

    useEffect(() => {
        if (profileUser) {
            setLoadingVideos(true);
            fetch(`/api/voz/videos?userHandle=${profileUser.handle || '@'+profileUser.name}`)
                .then(res => res.json())
                .then(data => {
                    const videoList = Array.isArray(data) ? data : (data.videos || []);
                    setVideos(videoList);
                    setLoadingVideos(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoadingVideos(false);
                });
        }
    }, [profileUser]);

    const isOwnProfile = loggedInUser && profileUser && (profileUser.id === loggedInUser.id || profileUser.handle === loggedInUser.handle);

    // Fetch Bookmarks
    useEffect(() => {
        if (isOwnProfile && profileUser) {
            setLoadingBookmarks(true);
            const userHandle = profileUser.handle || '@' + profileUser.name;
            fetch(`/api/voz/videos?bookmarkedBy=${encodeURIComponent(userHandle)}`)
                .then(res => res.json())
                .then(data => {
                    setBookmarkedVideos(Array.isArray(data) ? data : []);
                    setBookmarkedIds((Array.isArray(data) ? data : []).map((v: any) => v.id));
                    setLoadingBookmarks(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoadingBookmarks(false);
                });
        }
    }, [isOwnProfile, profileUser]);

    // Fetch Likes
    useEffect(() => {
        if (isOwnProfile && profileUser) {
            setLoadingLikes(true);
            const userHandle = profileUser.handle || '@' + profileUser.name;
            fetch(`/api/voz/videos?likedBy=${encodeURIComponent(userHandle)}`)
                .then(res => res.json())
                .then(data => {
                    setLikedVideos(Array.isArray(data) ? data : []);
                    setLikedIds((Array.isArray(data) ? data : []).map((v: any) => v.id));
                    setLoadingLikes(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoadingLikes(false);
                });
        }
    }, [isOwnProfile, profileUser]);

    // Load Drafts from localStorage
    useEffect(() => {
        if (isOwnProfile) {
            try {
                const storedDrafts = localStorage.getItem('localDrafts');
                if (storedDrafts) {
                    setDrafts(JSON.parse(storedDrafts));
                }
            } catch (e) {
                console.error("Error reading drafts from localStorage", e);
            }
        }
    }, [isOwnProfile]);

    const handleDeleteVideo = async (videoId: string) => {
        if (!confirm("¿Estás seguro de que quieres eliminar este vídeo?")) return;
        try {
            const res = await fetch(`/api/voz/videos?id=${videoId}&userHandle=${profileUser.handle}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                setVideos(prev => prev.filter(v => v.id !== videoId));
                alert("Vídeo eliminado con éxito.");
            } else {
                alert(data.error || "No se pudo eliminar el vídeo.");
            }
        } catch (e) {
            console.error(e);
            alert("Error al eliminar el vídeo.");
        }
    };

    const handleToggleBookmark = async (videoId: string) => {
        if (!loggedInUser) return;
        const isBookmarked = bookmarkedIds.includes(videoId);
        try {
            const res = await fetch('/api/voz/videos/bookmark', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    videoId,
                    userHandle: loggedInUser.handle,
                    isBookmarked: !isBookmarked
                })
            });
            const data = await res.json();
            if (data.success) {
                if (isBookmarked) {
                    setBookmarkedIds(prev => prev.filter(id => id !== videoId));
                    setBookmarkedVideos(prev => prev.filter(v => v.id !== videoId));
                }
            } else {
                alert("Error al actualizar marcador.");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleToggleLike = async (videoId: string) => {
        if (!loggedInUser) return;
        const isLiked = likedIds.includes(videoId);
        try {
            const res = await fetch('/api/voz/videos/like', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    videoId,
                    userHandle: loggedInUser.handle,
                    isLiked: !isLiked
                })
            });
            const data = await res.json();
            if (data.success) {
                if (isLiked) {
                    setLikedIds(prev => prev.filter(id => id !== videoId));
                    setLikedVideos(prev => prev.filter(v => v.id !== videoId));
                }
            } else {
                alert("Error al actualizar me gusta.");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteDraft = (draftId: string) => {
        if (!confirm("¿Estás seguro de que quieres eliminar este borrador?")) return;
        const newDrafts = drafts.filter(d => d.id !== draftId);
        setDrafts(newDrafts);
        localStorage.setItem('localDrafts', JSON.stringify(newDrafts));
    };

    const handlePublishDraft = async (draft: any) => {
        if (!loggedInUser) return;
        if (!confirm("¿Quieres publicar este borrador ahora?")) return;
        try {
            const res = await fetch('/api/voz/videos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    videoUrl: draft.videoUrl,
                    user: loggedInUser.handle || `@${loggedInUser.name}`,
                    description: draft.description || '',
                    thumbnailUrl: draft.thumbnailUrl || '',
                    isMuted: draft.isMuted || false,
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert("¡Borrador publicado con éxito!");
                if (data.video) {
                    setVideos(prev => [data.video, ...prev]);
                }
                const newDrafts = drafts.filter(d => d.id !== draft.id);
                setDrafts(newDrafts);
                localStorage.setItem('localDrafts', JSON.stringify(newDrafts));
            } else {
                alert(data.error || "Error al publicar el borrador.");
            }
        } catch (e) {
            console.error(e);
            alert("Error al publicar el borrador.");
        }
    };

    const handleDonate = async () => {
        if (!loggedInUser) {
            alert("Inicia sesión para donar monedas.");
            router.push('/login');
            return;
        }

        const amountStr = prompt(`¿Cuántas monedas deseas donar a ${profileUser.name || 'este creador'}?`);
        if (!amountStr) return;

        const parsedAmount = parseFloat(amountStr.replace(',', '.'));
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            alert("Monto inválido. Introduce una cantidad mayor que cero.");
            return;
        }

        try {
            const res = await fetch('/api/voz/donate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creatorHandle: profileUser.handle,
                    senderHandle: loggedInUser.handle,
                    amount: parsedAmount
                })
            });

            const data = await res.json();
            if (data.success) {
                alert(`¡Has apoyado a ${profileUser.name || profileUser.handle} con ${parsedAmount} monedas de forma exitosa!`);
            } else {
                alert(data.error || "Ocurrió un error al realizar la donación.");
            }
        } catch (e) {
            console.error(e);
            alert("Error al procesar la donación.");
        }
    };

    if (authLoading || loadingProfile) {
        return <div style={{ backgroundColor: '#000', color: 'white', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Cargando perfil...</div>;
    }

    if (!profileUser) {
        return (
            <div style={{ backgroundColor: '#000', color: 'white', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '15px' }}>
                <p>Usuario no encontrado</p>
                <button onClick={() => router.push('/feed')} style={{ padding: '8px 20px', backgroundColor: '#8E2DE2', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>Volver al Feed</button>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: '#000', color: 'white', minHeight: '100vh', width: '100%', display: 'flex', justifyContent: 'center', overflowX: 'hidden' }}>
            <div style={{ 
                width: '100%', 
                maxWidth: '450px', 
                minHeight: '100vh', 
                backgroundColor: '#000', 
                borderLeft: '1px solid #222', 
                borderRight: '1px solid #222', 
                paddingBottom: '80px', 
                position: 'relative',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '1px solid #333' }}>
                    <div style={{ 
                        width: '100px', height: '100px', borderRadius: '50%', 
                        backgroundColor: profileUser.profileColor || '#8E2DE2', 
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        fontSize: '40px', fontWeight: 'bold', marginBottom: '15px',
                        backgroundImage: profileUser.profileImage ? `url(${profileUser.profileImage})` : 'none',
                        backgroundSize: 'cover'
                    }}>
                        {!profileUser.profileImage && (profileUser.name ? profileUser.name.charAt(0).toUpperCase() : '?')}
                    </div>
                    <h2 style={{ margin: 0 }}>{profileUser.name}</h2>
                    <p style={{ color: '#aaa', margin: '5px 0' }}>{profileUser.handle || '@'+profileUser.name.toLowerCase().replace(/\s+/g, '')}</p>
                    <p style={{ textAlign: 'center', fontSize: '0.9rem', maxWidth: '300px' }}>{profileUser.bio || 'Sin biografía todavía.'}</p>
                    
                    <div style={{ display: 'flex', gap: '20px', marginTop: '15px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <strong>{profileUser.followingCount || profileUser.following || 0}</strong><br/><span style={{ fontSize: '0.8rem', color: '#888' }}>Siguiendo</span>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <strong>{profileUser.followersCount || profileUser.fans || 0}</strong><br/><span style={{ fontSize: '0.8rem', color: '#888' }}>Seguidores</span>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <strong>{profileUser.likesCount || profileUser.likes || 0}</strong><br/><span style={{ fontSize: '0.8rem', color: '#888' }}>Me gusta</span>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px', width: '100%', justifyContent: 'center' }}>
                        {isOwnProfile ? (
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'center' }}>
                                <button onClick={() => setIsSettingsOpen(true)} style={{ flex: 1, maxWidth: '140px', padding: '8px 15px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}>Editar perfil</button>
                                <button onClick={() => router.push('/feed')} style={{ flex: 1, maxWidth: '140px', padding: '8px 15px', backgroundColor: '#8E2DE2', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}>Volver al Feed</button>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'center' }}>
                                <button onClick={() => router.push('/profile/creator-panel')} style={{ flex: 1, maxWidth: '290px', padding: '8px 20px', background: 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 10px rgba(142, 45, 226, 0.3)' }}>Panel de Creador (Anuncios)</button>
                            </div>
                            <button onClick={logout} style={{ width: '100%', maxWidth: '290px', padding: '8px 20px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}>Cerrar sesión</button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'center' }}>
                            <button onClick={handleDonate} style={{ flex: 1, maxWidth: '140px', padding: '8px 15px', backgroundColor: '#8E2DE2', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}>Donar Monedas</button>
                            <button onClick={() => router.push('/feed')} style={{ flex: 1, maxWidth: '140px', padding: '8px 15px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}>Volver al Feed</button>
                        </div>
                    )}
                    </div>
                </div>

                {/* Selector de pestañas similar a la app */}
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-around', 
                    borderBottom: '1px solid #222',
                    backgroundColor: '#000',
                    padding: '10px 0'
                }}>
                    <button 
                        onClick={() => setActiveTab('grid')} 
                        style={{ 
                            background: 'none', border: 'none', cursor: 'pointer', padding: '10px',
                            borderBottom: activeTab === 'grid' ? '2px solid #8E2DE2' : '2px solid transparent',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Grid size={24} color={activeTab === 'grid' ? "white" : "rgba(255,255,255,0.4)"} />
                    </button>
                    {isOwnProfile && (
                        <>
                            <button 
                                onClick={() => setActiveTab('bookmarks')} 
                                style={{ 
                                    background: 'none', border: 'none', cursor: 'pointer', padding: '10px',
                                    borderBottom: activeTab === 'bookmarks' ? '2px solid #8E2DE2' : '2px solid transparent',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Bookmark size={24} color={activeTab === 'bookmarks' ? "white" : "rgba(255,255,255,0.4)"} />
                            </button>
                            <button 
                                onClick={() => setActiveTab('likes')} 
                                style={{ 
                                    background: 'none', border: 'none', cursor: 'pointer', padding: '10px',
                                    borderBottom: activeTab === 'likes' ? '2px solid #8E2DE2' : '2px solid transparent',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Heart size={24} color={activeTab === 'likes' ? "white" : "rgba(255,255,255,0.4)"} />
                            </button>
                            <button 
                                onClick={() => setActiveTab('drafts')} 
                                style={{ 
                                    background: 'none', border: 'none', cursor: 'pointer', padding: '10px',
                                    borderBottom: activeTab === 'drafts' ? '2px solid #8E2DE2' : '2px solid transparent',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Lock size={24} color={activeTab === 'drafts' ? "white" : "rgba(255,255,255,0.4)"} />
                            </button>
                        </>
                    )}
                </div>

                {/* Contenido de la Pestaña Activa */}
                <div style={{ padding: '2px', flex: 1 }}>
                    {activeTab === 'grid' && (
                        <>
                            {loadingVideos ? (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>Cargando vídeos...</div>
                            ) : videos.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888' }}>No hay vídeos publicados aún.</div>
                            ) : (
                                <div className="profile-video-grid">
                                    {videos.map(v => (
                                        <div key={v.id} style={{ position: 'relative', aspectRatio: '9/16', backgroundColor: '#222' }}>
                                            <Link href={`/video/${v.id}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                                                <div style={{ height: '100%' }}>
                                                    {v.videoUrl ? (
                                                        <video src={v.videoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#333' }}>🎙️</div>
                                                    )}
                                                    <div style={{ position: 'absolute', bottom: '5px', left: '5px', color: 'white', fontSize: '0.8rem', fontWeight: 'bold', textShadow: '1px 1px 2px #000' }}>
                                                        ▶ {v.views || 0}
                                                    </div>
                                                </div>
                                            </Link>
                                            {isOwnProfile && (
                                                <button 
                                                    onClick={() => handleDeleteVideo(v.id)} 
                                                    style={{ 
                                                        position: 'absolute', top: '5px', right: '5px', zIndex: 10, padding: '5px',
                                                        background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', cursor: 'pointer',
                                                        display: 'flex', justifyContent: 'center', alignItems: 'center'
                                                    }}
                                                >
                                                    <Trash2 size={16} color="white" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'bookmarks' && (
                        <>
                            {loadingBookmarks ? (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>Cargando marcadores...</div>
                            ) : bookmarkedVideos.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                    <Bookmark size={40} color="rgba(255,255,255,0.2)" />
                                    <span>No tienes vídeos guardados.</span>
                                </div>
                            ) : (
                                <div className="profile-video-grid">
                                    {bookmarkedVideos.map(v => (
                                        <div key={v.id} style={{ position: 'relative', aspectRatio: '9/16', backgroundColor: '#222' }}>
                                            <Link href={`/video/${v.id}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                                                <div style={{ height: '100%' }}>
                                                    {v.videoUrl ? (
                                                        <video src={v.videoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#333' }}>🎙️</div>
                                                    )}
                                                </div>
                                            </Link>
                                            <button 
                                                onClick={() => handleToggleBookmark(v.id)} 
                                                style={{ 
                                                    position: 'absolute', top: '5px', right: '5px', zIndex: 10, padding: '5px',
                                                    background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', cursor: 'pointer',
                                                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                                                }}
                                            >
                                                <Trash2 size={16} color="white" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'likes' && (
                        <>
                            {loadingLikes ? (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>Cargando favoritos...</div>
                            ) : likedVideos.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                    <Heart size={40} color="rgba(255,255,255,0.2)" />
                                    <span>No tienes vídeos favoritos.</span>
                                </div>
                            ) : (
                                <div className="profile-video-grid">
                                    {likedVideos.map(v => (
                                        <div key={v.id} style={{ position: 'relative', aspectRatio: '9/16', backgroundColor: '#222' }}>
                                            <Link href={`/video/${v.id}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                                                <div style={{ height: '100%' }}>
                                                    {v.videoUrl ? (
                                                        <video src={v.videoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#333' }}>🎙️</div>
                                                    )}
                                                </div>
                                            </Link>
                                            <button 
                                                onClick={() => handleToggleLike(v.id)} 
                                                style={{ 
                                                    position: 'absolute', top: '5px', right: '5px', zIndex: 10, padding: '5px',
                                                    background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', cursor: 'pointer',
                                                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                                                }}
                                            >
                                                <Trash2 size={16} color="white" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'drafts' && (
                        <>
                            {drafts.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                    <Lock size={40} color="rgba(255,255,255,0.2)" />
                                    <span>No tienes borradores guardados.</span>
                                </div>
                            ) : (
                                <div className="profile-video-grid">
                                    {drafts.map(v => (
                                        <div key={v.id} style={{ position: 'relative', aspectRatio: '9/16', backgroundColor: '#222' }}>
                                            <div style={{ height: '100%', opacity: 0.6 }}>
                                                {v.videoUrl ? (
                                                    <video src={v.videoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#333' }}>🎙️</div>
                                                )}
                                                <div style={{ position: 'absolute', bottom: '5px', left: '5px', backgroundColor: 'rgba(255,140,0,0.8)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                                    BORRADOR
                                                </div>
                                            </div>
                                            <div style={{ position: 'absolute', top: '5px', right: '5px', zIndex: 10, display: 'flex', gap: '5px' }}>
                                                <button 
                                                    onClick={() => handleDeleteDraft(v.id)} 
                                                    style={{ 
                                                        padding: '5px', background: 'rgba(220,53,69,0.8)', border: 'none', borderRadius: '50%', cursor: 'pointer',
                                                        display: 'flex', justifyContent: 'center', alignItems: 'center'
                                                    }}
                                                    title="Borrar borrador"
                                                >
                                                    <Trash2 size={14} color="white" />
                                                </button>
                                                <button 
                                                    onClick={() => handlePublishDraft(v)} 
                                                    style={{ 
                                                        padding: '5px', background: 'rgba(40,167,69,0.8)', border: 'none', borderRadius: '50%', cursor: 'pointer',
                                                        display: 'flex', justifyContent: 'center', alignItems: 'center'
                                                    }}
                                                    title="Publicar"
                                                >
                                                    <Play size={14} color="white" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <style>{`
                    .profile-video-grid {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 2px;
                        margin-top: 2px;
                    }
                `}</style>

                {loggedInUser && (
                    <ProfileSettingsModal 
                        isOpen={isSettingsOpen} 
                        onClose={() => setIsSettingsOpen(false)} 
                        profile={loggedInUser} 
                        onLogout={logout} 
                    />
                )}
                <BottomNav />
            </div>
        </div>
    );
}

export default function ProfilePage() {
    return (
        <Suspense fallback={<div style={{ backgroundColor: '#000', color: 'white', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Cargando...</div>}>
            <ProfilePageContent />
        </Suspense>
    );
}