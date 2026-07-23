"use client";
import { useEffect, useState, Suspense, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import BottomNav from '../components/BottomNav';
import ProfileSettingsModal from '../components/ProfileSettingsModal';
import { Grid, Bookmark, Heart, Lock, Play, Camera, Search, X } from 'lucide-react';

const getFlagUri = (country: any) => {
    if (!country) return 'https://flagcdn.com/w80/es.png';
    let countryName = '';
    let countryCode = '';
    if (typeof country === 'string') {
        countryName = country;
    } else if (typeof country === 'object') {
        countryName = country.name || country.label || '';
        countryCode = country.code || '';
    }
    const code = (countryCode || (countryName.toLowerCase().includes('españa') || countryName.toLowerCase().includes('spain') ? 'es' : 'es')).toLowerCase();
    return `https://flagcdn.com/w80/${code}.png`;
};

const getLocationText = (userObj: any) => {
    if (!userObj) return 'España';
    if (userObj.region) return userObj.region;
    if (typeof userObj.country === 'string' && userObj.country) return userObj.country;
    if (userObj.country && (userObj.country.name || userObj.country.label)) return userObj.country.name || userObj.country.label;
    if (userObj.nationality) return userObj.nationality;
    return 'España';
};

const ALL_COUNTRIES = [
    { name: 'España', code: 'es' },
    { name: 'Estados Unidos', code: 'us' },
    { name: 'México', code: 'mx' },
    { name: 'Argentina', code: 'ar' },
    { name: 'Colombia', code: 'co' },
    { name: 'Chile', code: 'cl' },
    { name: 'Perú', code: 'pe' },
    { name: 'Venezuela', code: 've' },
    { name: 'Ecuador', code: 'ec' },
    { name: 'Guatemala', code: 'gt' },
    { name: 'Cuba', code: 'cu' },
    { name: 'República Dominicana', code: 'do' },
    { name: 'Bolivia', code: 'bo' },
    { name: 'Honduras', code: 'hn' },
    { name: 'Paraguay', code: 'py' },
    { name: 'El Salvador', code: 'sv' },
    { name: 'Nicaragua', code: 'ni' },
    { name: 'Costa Rica', code: 'cr' },
    { name: 'Puerto Rico', code: 'pr' },
    { name: 'Uruguay', code: 'uy' },
    { name: 'Panamá', code: 'pa' },
    { name: 'Andorra', code: 'ad' },
    { name: 'Brasil', code: 'br' },
    { name: 'Francia', code: 'fr' },
    { name: 'Italia', code: 'it' },
    { name: 'Alemania', code: 'de' },
    { name: 'Reino Unido', code: 'gb' },
    { name: 'Portugal', code: 'pt' }
];

function ProfilePageContent() {
    const { user, logout, isLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [videos, setVideos] = useState<any[]>([]);
    const [loadingVideos, setLoadingVideos] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [liveUser, setLiveUser] = useState<any>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [loadingFollow, setLoadingFollow] = useState(false);

    const [activeTab, setActiveTab] = useState('grid');

    const [hasMoreVideos, setHasMoreVideos] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const observerTarget = useRef<HTMLDivElement>(null);

    const [showDonateModal, setShowDonateModal] = useState(false);
    const [donateAmount, setDonateAmount] = useState('');
    const [isDonating, setIsDonating] = useState(false);

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const [showEnlargedAvatar, setShowEnlargedAvatar] = useState(false);
    const [showCountryModal, setShowCountryModal] = useState(false);
    const [countrySearch, setCountrySearch] = useState('');
    const [savingCountry, setSavingCountry] = useState(false);

    const handleSelectCountry = async (c: { name: string; code: string }) => {
        if (!user || savingCountry) return;
        setSavingCountry(true);
        try {
            const res = await fetch('/api/voz/users/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: user.id,
                    country: { name: c.name, code: c.code }
                })
            });
            const data = await res.json();
            if (data.success) {
                setLiveUser((prev: any) => ({ ...prev, country: { name: c.name, code: c.code } }));
                const updatedUser = { ...user, country: { name: c.name, code: c.code } };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setShowCountryModal(false);
            } else {
                alert("Error al actualizar país: " + (data.error || "Fallo"));
            }
        } catch (e) {
            console.error("Error updating country:", e);
            alert("Error de conexión");
        } finally {
            setSavingCountry(false);
        }
    };

    const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('subDir', 'avatars');

            const res = await fetch('/api/media/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.url) {
                const updateRes = await fetch('/api/voz/users/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: user.id,
                        profileImage: data.url,
                        profile_image: data.url
                    })
                });
                const updateData = await updateRes.json();
                if (updateData.success) {
                    setLiveUser((prev: any) => ({ ...prev, profileImage: data.url, profile_image: data.url }));
                    const updatedUser = { ...user, profileImage: data.url, profile_image: data.url };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    window.location.reload();
                } else {
                    alert("Error actualizando perfil: " + (updateData.error || "Fallo"));
                }
            } else {
                alert("Error al subir imagen.");
            }
        } catch (err) {
            console.error("Avatar upload error:", err);
            alert("Fallo al subir la imagen.");
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleParam = searchParams.get('handle');
    const isExplicitHandle = handleParam !== null && handleParam.trim() !== '';
    
    // Solo si handleParam es estrictamente null o vacío, se debe cargar el perfil del usuario logueado por defecto.
    const targetHandle = isExplicitHandle ? handleParam : (user ? (user.handle || '@'+user.name) : null);
    
    const cleanHandle = (h?: string | null) => (h || '').replace(/^@/, '').trim().toLowerCase();
    const isOwnProfile = Boolean(user && targetHandle && (cleanHandle(targetHandle) === cleanHandle(user.handle || user.name)));

    const [isFetchingUser, setIsFetchingUser] = useState(true);
    const [userNotFound, setUserNotFound] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (searchParams.get('settings') === 'true' || searchParams.get('edit') === 'true') {
            setIsSettingsOpen(true);
        }
    }, [searchParams]);

    const fetchVideosForTab = useCallback(async (tabName: string, handleToUse: string, offset = 0) => {
        setLoadingVideos(offset === 0);
        try {
            let url = `/api/voz/videos?limit=12&offset=${offset}`;
            if (tabName === 'likes') {
                url += `&likedBy=${encodeURIComponent(handleToUse)}`;
            } else if (tabName === 'bookmarks') {
                url += `&bookmarkedBy=${encodeURIComponent(handleToUse)}`;
            } else {
                url += `&userHandle=${encodeURIComponent(handleToUse)}`;
            }
            const res = await fetch(url);
            const data = await res.json();
            const list = Array.isArray(data) ? data : (data.videos || []);
            
            if (offset === 0) {
                setVideos(list);
            } else {
                setVideos(prev => {
                    const existingIds = new Set(prev.map(v => v.id));
                    const newVideos = list.filter((v: any) => !existingIds.has(v.id));
                    return [...prev, ...newVideos];
                });
            }
            setHasMoreVideos(list.length >= 12);
        } catch (err) {
            console.error("Error fetching tab videos:", err);
            if (offset === 0) setVideos([]);
        } finally {
            setLoadingVideos(false);
        }
    }, []);

    useEffect(() => {
        if (user && targetHandle) {
            setIsFetchingUser(true);
            setUserNotFound(false);
            
            fetch(`/api/voz/users/profile?handle=${encodeURIComponent(targetHandle)}`)
                .then(res => res.json())
                .then(data => {
                    let handleForVideos = targetHandle;
                    if (data.success && data.user) {
                        setLiveUser(data.user);
                        const myHandle = user.handle || '@'+user.name;
                        setIsFollowing(data.fans && data.fans.includes(myHandle));
                        handleForVideos = data.user.handle || targetHandle;
                    } else {
                        setUserNotFound(true);
                    }
                    return fetchVideosForTab(activeTab, handleForVideos, 0);
                })
                .catch(err => {
                    console.error("Error fetching profile:", err);
                    if (!liveUser) setUserNotFound(true);
                    setLoadingVideos(false);
                })
                .finally(() => {
                    setIsFetchingUser(false);
                });
        } else if (user && !targetHandle) {
            setIsFetchingUser(false);
            setLoadingVideos(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, targetHandle, activeTab]);

    const fetchMoreVideos = async () => {
        setLoadingMore(true);
        try {
            const currentHandle = liveUser?.handle || targetHandle || '';
            await fetchVideosForTab(activeTab, currentHandle, videos.length);
        } catch (error) {
            console.error("Error fetching more videos:", error);
        } finally {
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMoreVideos && !loadingMore && videos.length > 0) {
                    fetchMoreVideos();
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) observer.unobserve(observerTarget.current);
        };
    }, [hasMoreVideos, loadingMore, videos.length, liveUser, targetHandle]);

    const handleFollowToggle = async () => {
        if (!user || !targetHandle || loadingFollow) return;
        setLoadingFollow(true);
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch('/api/voz/users/follow', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    followerHandle: user.handle || '@'+user.name,
                    followingHandle: targetHandle
                })
            });
            const data = await res.json();
            if (data.success) {
                setIsFollowing(data.isFollowing);
                setLiveUser((prev: any) => ({
                    ...prev,
                    fans: data.isFollowing ? (prev.fans || 0) + 1 : (prev.fans || 1) - 1
                }));
            }
        } catch (error) {
            console.error("Error toggling follow:", error);
        } finally {
            setLoadingFollow(false);
        }
    };

    const handleDonate = async () => {
        if (!user) {
            alert("Debes iniciar sesión para donar.");
            router.push('/login');
            return;
        }
        const amount = Number(donateAmount);
        if (isNaN(amount) || amount <= 0) {
            alert("Cantidad no válida.");
            return;
        }
        if (amount > (user.walletBalance || 0)) {
            alert("No tienes saldo suficiente en tu cartera.");
            return;
        }

        setIsDonating(true);
        try {
            const token = localStorage.getItem('token') || '';
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token && token.trim() !== '') {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const res = await fetch('/api/voz/donate', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    creatorHandle: targetHandle,
                    senderHandle: user.handle || '@' + user.name,
                    amount: amount
                })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Has donado ${amount} monedas a ${displayUser?.name || 'este creador'}`);
                setShowDonateModal(false);
                setDonateAmount('');
                // Refetch user profile or update balance if available
                if (typeof window !== 'undefined') {
                    const updatedUser = { ...user, walletBalance: (user.walletBalance || 0) - amount };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                }
            } else {
                alert(data.error || "Error al procesar la donación.");
            }
        } catch (e) {
            alert("Error de conexión.");
        } finally {
            setIsDonating(false);
        }
    };

    if (isFetchingUser || !user) {
        return <div style={{ backgroundColor: '#000', color: 'white', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Cargando...</div>;
    }

    let displayUser = null;

    if (isExplicitHandle) {
        if (isFetchingUser) {
            return <div style={{ backgroundColor: '#000', color: 'white', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Cargando perfil...</div>;
        }
        if (userNotFound || !liveUser) {
            displayUser = { name: 'Usuario no encontrado', handle: targetHandle, fans: 0, following: 0, likes: 0 };
        } else {
            displayUser = liveUser;
        }
    } else {
        displayUser = liveUser || user;
    }

    return (
        <div style={{ backgroundColor: '#000', color: 'white', minHeight: '100vh', width: '100%', paddingBottom: '80px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '450px', borderLeft: '1px solid #111', borderRight: '1px solid #111', minHeight: '100vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '1px solid #333' }}>
                {/* Avatar container with circular flag badge & camera upload overlay matching mobile app */}
                <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '15px' }}>
                    <div 
                        onClick={() => setShowEnlargedAvatar(true)}
                        title="Ver foto de perfil ampliada"
                        style={{ 
                            width: '100px', height: '100px', borderRadius: '50%', 
                            backgroundColor: displayUser.profileColor || '#8E2DE2', 
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            fontSize: '40px', fontWeight: 'bold',
                            backgroundImage: displayUser.profileImage ? `url(${displayUser.profileImage})` : 'none',
                            backgroundSize: 'cover',
                            border: '3px solid #fff',
                            boxSizing: 'border-box',
                            cursor: 'pointer'
                        }}
                    >
                        {!displayUser.profileImage && (displayUser.name ? String(displayUser.name).charAt(0).toUpperCase() : '?')}
                    </div>

                    {/* Camera upload overlay button for changing profile photo on Web */}
                    {isOwnProfile && (
                        <>
                            <input 
                                type="file" 
                                ref={avatarInputRef}
                                accept="image/*"
                                onChange={handleAvatarFileUpload}
                                style={{ display: 'none' }} 
                            />
                            <div 
                                onClick={() => avatarInputRef.current?.click()}
                                title="Cambiar foto de perfil"
                                style={{
                                    position: 'absolute',
                                    bottom: '-5px',
                                    left: '-5px',
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    backgroundColor: '#8E2DE2',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    border: '2px solid #fff',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                                    zIndex: 3
                                }}
                            >
                                {uploadingAvatar ? (
                                    <div style={{ color: 'white', fontSize: '10px', fontWeight: 'bold' }}>...</div>
                                ) : (
                                    <Camera size={18} color="white" />
                                )}
                            </div>
                        </>
                    )}

                    {/* Circular Flag Badge overlay on bottom-right of avatar - Opens Flag/Country Selector directly */}
                    <div 
                        title={isOwnProfile ? "Cambiar país y bandera" : undefined}
                        onClick={() => isOwnProfile && setShowCountryModal(true)}
                        style={{
                            position: 'absolute',
                            bottom: '-5px',
                            right: '-5px',
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: '#1a1a1a',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            border: '2px solid #8E2DE2',
                            overflow: 'hidden',
                            cursor: isOwnProfile ? 'pointer' : 'default',
                            zIndex: 3
                        }}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={getFlagUri(displayUser.country || displayUser.nationality)} alt="Bandera" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                </div>

                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold' }}>{displayUser.name}</h2>
                <p style={{ color: '#aaa', margin: '4px 0 2px' }}>{displayUser.handle || (displayUser.name ? '@'+String(displayUser.name).toLowerCase().replace(/\s+/g, '') : '')}</p>
                
                {/* Location Badge matching mobile app */}
                <div 
                    title={isOwnProfile ? "Cambiar ubicación" : undefined}
                    onClick={() => isOwnProfile && setIsSettingsOpen(true)}
                    style={{ 
                        display: 'flex', alignItems: 'center', gap: '5px', 
                        backgroundColor: 'rgba(142, 45, 226, 0.15)', border: '1px solid rgba(142, 45, 226, 0.3)', 
                        padding: '4px 12px', borderRadius: '14px', fontSize: '12px', color: '#e0b0ff', fontWeight: 'bold', 
                        margin: '6px 0 10px', cursor: isOwnProfile ? 'pointer' : 'default' 
                    }}
                >
                    <span>📍</span>
                    <span>{getLocationText(displayUser)}</span>
                </div>

                <p style={{ textAlign: 'center', fontSize: '0.9rem', maxWidth: '300px', margin: '5px 0 0' }}>{displayUser.bio || 'Sin biografía todavía.'}</p>
                
                <div style={{ display: 'flex', gap: '20px', marginTop: '15px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <strong>{displayUser.fans || 0}</strong><br/><span style={{ fontSize: '0.8rem', color: '#888' }}>Fans</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <strong>{displayUser.following || 0}</strong><br/><span style={{ fontSize: '0.8rem', color: '#888' }}>Siguiendo</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <strong>{displayUser.likes || 0}</strong><br/><span style={{ fontSize: '0.8rem', color: '#888' }}>Likes</span>
                    </div>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexDirection: 'column', width: '100%', alignItems: 'center' }}>
                    {isOwnProfile ? (
                        <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'center' }}>
                            <button onClick={() => setIsSettingsOpen(true)} style={{ flex: 1, maxWidth: '120px', padding: '10px 10px', backgroundColor: '#222', color: 'white', border: '1px solid #444', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>
                                Editar perfil
                            </button>
                            <button onClick={() => router.push('/messages')} style={{ flex: 1, maxWidth: '130px', padding: '10px 10px', background: 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                💬 Mensajes
                            </button>
                            <button onClick={() => router.push('/profile/creator-panel')} style={{ flex: 1, maxWidth: '100px', padding: '10px 10px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>
                                Anuncios
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'center' }}>
                            <button onClick={handleFollowToggle} disabled={loadingFollow} style={{ flex: 1, maxWidth: '110px', padding: '10px 10px', backgroundColor: isFollowing ? '#333' : '#8E2DE2', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>
                                {isFollowing ? 'Siguiendo' : 'Seguir'}
                            </button>
                            <button onClick={() => router.push(`/messages?handle=${encodeURIComponent(displayUser?.handle || targetHandle || '')}`)} style={{ flex: 1, maxWidth: '130px', padding: '10px 10px', background: 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                💬 Mensaje
                            </button>
                            <button onClick={() => setShowDonateModal(true)} style={{ flex: 1, maxWidth: '100px', padding: '10px 10px', background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>
                                Donar
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs Selector */}
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #333', marginTop: '10px' }}>
                <div 
                    onClick={() => setActiveTab('grid')} 
                    style={{ flex: 1, display: 'flex', justifyContent: 'center', paddingBottom: '10px', borderBottom: activeTab === 'grid' ? '2px solid white' : '2px solid transparent', cursor: 'pointer' }}>
                    <Grid size={24} color={activeTab === 'grid' ? 'white' : '#666'} />
                </div>
                {isOwnProfile && (
                    <>
                        <div 
                            onClick={() => setActiveTab('bookmarks')} 
                            style={{ flex: 1, display: 'flex', justifyContent: 'center', paddingBottom: '10px', borderBottom: activeTab === 'bookmarks' ? '2px solid white' : '2px solid transparent', cursor: 'pointer' }}>
                            <Bookmark size={24} color={activeTab === 'bookmarks' ? 'white' : '#666'} />
                        </div>
                        <div 
                            onClick={() => setActiveTab('likes')} 
                            style={{ flex: 1, display: 'flex', justifyContent: 'center', paddingBottom: '10px', borderBottom: activeTab === 'likes' ? '2px solid white' : '2px solid transparent', cursor: 'pointer' }}>
                            <Heart size={24} color={activeTab === 'likes' ? 'white' : '#666'} />
                        </div>
                        <div 
                            onClick={() => setActiveTab('drafts')} 
                            style={{ flex: 1, display: 'flex', justifyContent: 'center', paddingBottom: '10px', borderBottom: activeTab === 'drafts' ? '2px solid white' : '2px solid transparent', cursor: 'pointer' }}>
                            <Lock size={24} color={activeTab === 'drafts' ? 'white' : '#666'} />
                        </div>
                    </>
                )}
            </div>

            {/* Grid de Videos */}
            <div style={{ padding: '2px' }}>
                {loadingVideos ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888' }}>Cargando vídeos...</div>
                ) : videos.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888' }}>
                        {activeTab === 'likes' ? "No has dado Me gusta a ningún vídeo aún." :
                         activeTab === 'bookmarks' ? "No tienes vídeos guardados en favoritos." :
                         activeTab === 'drafts' ? "No tienes vídeos privados." :
                         "No hay vídeos publicados aún."}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', marginTop: '2px' }}>
                        {videos.map(v => (
                            <div key={v.id} style={{ position: 'relative', aspectRatio: '9/16', backgroundColor: '#222' }}>
                                <Link href={`/video/${v.id}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                                    <div style={{ height: '100%' }}>
                                        {v.videoUrl ? (
                                            <video src={v.videoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#333' }}>🎙️</div>
                                        )}
                                        {/* Likes Badge top-left matching mobile app */}
                                        <div style={{ 
                                            position: 'absolute', top: '6px', left: '6px', 
                                            backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                                            padding: '3px 7px', borderRadius: '10px', 
                                            display: 'flex', alignItems: 'center', gap: '4px',
                                            color: 'white', fontSize: '11px', fontWeight: 'bold',
                                            zIndex: 5, boxShadow: '0 1px 3px rgba(0,0,0,0.5)'
                                        }}>
                                            <Heart size={11} color="#FF3B30" fill="#FF3B30" />
                                            <span>{v.likes || 0}</span>
                                        </div>

                                        {/* Views Badge bottom-left */}
                                        <div style={{ 
                                            position: 'absolute', bottom: '6px', left: '6px', 
                                            backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                                            padding: '3px 7px', borderRadius: '10px', 
                                            display: 'flex', alignItems: 'center', gap: '4px',
                                            color: 'white', fontSize: '11px', fontWeight: 'bold',
                                            zIndex: 5, boxShadow: '0 1px 3px rgba(0,0,0,0.5)'
                                        }}>
                                            <Play size={10} color="white" fill="white" />
                                            <span>{v.views || 0}</span>
                                        </div>
                                    </div>
                                </Link>
                                {isOwnProfile && activeTab === 'grid' && (
                                    <button 
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (!confirm("¿Estás seguro de que quieres eliminar este vídeo?")) return;
                                            try {
                                                const token = localStorage.getItem('token') || '';
                                                const res = await fetch(`/api/voz/videos?id=${v.id}&userHandle=${user?.handle || '@'+user?.name}`, {
                                                    method: 'DELETE',
                                                    headers: {
                                                        'Authorization': `Bearer ${token}`
                                                    }
                                                });
                                                const data = await res.json();
                                                if (data.success) {
                                                    setVideos(prev => prev.filter(item => item.id !== v.id));
                                                    alert("Vídeo eliminado con éxito.");
                                                } else {
                                                    alert(data.error || "No se pudo eliminar el vídeo.");
                                                }
                                            } catch (err) {
                                                console.error(err);
                                                alert("Error al conectar con el servidor.");
                                            }
                                        }} 
                                        style={{ 
                                            position: 'absolute', top: '5px', right: '5px', zIndex: 10, padding: '5px',
                                            background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', cursor: 'pointer',
                                            display: 'flex', justifyContent: 'center', alignItems: 'center', width: '26px', height: '26px'
                                        }}
                                    >
                                        <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>🗑️</span>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Intersection Observer Target */}
                {videos.length > 0 && hasMoreVideos && (
                    <div ref={observerTarget} style={{ height: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {loadingMore && <span style={{ color: '#888' }}>Cargando más...</span>}
                    </div>
                )}
                {!hasMoreVideos && videos.length > 0 && (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#888', fontSize: '14px' }}>
                        No hay más vídeos
                    </div>
                )}
            </div>

            <ProfileSettingsModal 
                isOpen={isSettingsOpen} 
                onClose={() => setIsSettingsOpen(false)} 
                profile={user} 
                onLogout={logout} 
            />

            {showDonateModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
                    <div style={{ backgroundColor: '#222', padding: '25px', borderRadius: '15px', width: '90%', maxWidth: '350px', position: 'relative' }}>
                        <button onClick={() => setShowDonateModal(false)} style={{ position: 'absolute', top: '10px', right: '15px', background: 'transparent', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>×</button>
                        <h3 style={{ marginTop: 0, textAlign: 'center' }}>Donar a {displayUser.name}</h3>
                        <p style={{ color: 'gray', textAlign: 'center', marginBottom: '15px' }}>
                            Tu saldo actual: {Number(user?.walletBalance || 0).toFixed(2).replace('.', ',')} 🪙
                        </p>
                        <input 
                            type="number" 
                            value={donateAmount}
                            onChange={(e) => setDonateAmount(e.target.value)}
                            placeholder="0"
                            style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#2a2a2a', color: 'white', border: '2px solid #FFD700', borderRadius: '10px', padding: '15px', fontSize: '24px', textAlign: 'center', fontWeight: 'bold' }}
                        />
                        <button 
                            onClick={handleDonate}
                            disabled={isDonating}
                            style={{ width: '100%', marginTop: '20px', padding: '15px', background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', color: 'black', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}
                        >
                            {isDonating ? 'Procesando...' : 'Confirmar Donación'}
                        </button>
                    </div>
                </div>
            )}

            {/* Modal 1: Selector directo de País y Bandera con Buscador (Filtro en vivo) */}
            {showCountryModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(5px)' }}>
                    <div style={{ backgroundColor: '#1c1c1e', padding: '20px', borderRadius: '20px', width: '90%', maxWidth: '400px', border: '1px solid #333', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0, color: 'white', fontSize: '1.1rem', fontWeight: 'bold' }}>Selecciona tu País y Bandera</h3>
                            <button onClick={() => setShowCountryModal(false)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <X size={22} color="white" />
                            </button>
                        </div>

                        {/* Buscador de País */}
                        <div style={{ position: 'relative', marginBottom: '15px' }}>
                            <Search size={18} color="#888" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                            <input 
                                type="text"
                                placeholder="Buscar país... (ej: España, Estados Unidos, México)"
                                value={countrySearch}
                                onChange={(e) => setCountrySearch(e.target.value)}
                                style={{
                                    width: '100%',
                                    backgroundColor: '#000',
                                    color: 'white',
                                    border: '1px solid #333',
                                    borderRadius: '12px',
                                    padding: '10px 12px 10px 38px',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* Lista de Países filtrada con banderas (Lanzamiento inicial sólo en España) */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
                            {ALL_COUNTRIES.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase())).map(c => {
                                const isSpain = c.code === 'es';
                                return (
                                    <div 
                                        key={c.code}
                                        onClick={() => {
                                            if (isSpain) {
                                                handleSelectCountry(c);
                                                setIsSettingsOpen(true);
                                            } else {
                                                alert("Lanzamiento inicial disponible exclusivamente en España. Próximamente en más países.");
                                            }
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            padding: '10px',
                                            borderRadius: '12px',
                                            backgroundColor: isSpain ? 'rgba(142, 45, 226, 0.35)' : '#1f1f22',
                                            border: isSpain ? '1px solid #8E2DE2' : '1px solid #2a2a2c',
                                            cursor: isSpain ? 'pointer' : 'not-allowed',
                                            opacity: isSpain ? 1 : 0.45,
                                            filter: isSpain ? 'none' : 'grayscale(70%)',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={`https://flagcdn.com/w80/${c.code}.png`} alt={c.name} style={{ width: '24px', height: '16px', borderRadius: '3px', objectFit: 'cover' }} />
                                        <span style={{ color: isSpain ? 'white' : '#888', fontSize: '0.85rem', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {c.name} {isSpain ? '✅' : '🔒'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal 2: Foto de Perfil Ampliada en Grande (Lightbox HD) */}
            {showEnlargedAvatar && (
                <div 
                    onClick={() => setShowEnlargedAvatar(false)}
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, backdropFilter: 'blur(8px)', cursor: 'pointer' }}
                >
                    <button 
                        onClick={() => setShowEnlargedAvatar(false)}
                        style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
                    >
                        <X size={24} color="white" />
                    </button>
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    >
                        {displayUser.profileImage ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img 
                                src={displayUser.profileImage} 
                                alt={displayUser.name} 
                                style={{ maxWidth: '85vw', maxHeight: '70vh', borderRadius: '20px', boxShadow: '0 0 30px rgba(142, 45, 226, 0.6)', border: '3px solid #8E2DE2', objectFit: 'contain' }} 
                            />
                        ) : (
                            <div style={{ width: '220px', height: '220px', borderRadius: '50%', backgroundColor: displayUser.profileColor || '#8E2DE2', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '90px', fontWeight: 'bold', color: 'white', border: '4px solid #fff' }}>
                                {displayUser.name ? String(displayUser.name).charAt(0).toUpperCase() : '?'}
                            </div>
                        )}
                        <h3 style={{ color: 'white', marginTop: '20px', fontSize: '1.2rem', fontWeight: 'bold' }}>{displayUser.name}</h3>
                        <p style={{ color: '#aaa', margin: '4px 0 0 0', fontSize: '0.9rem' }}>{displayUser.handle}</p>
                    </div>
                </div>
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