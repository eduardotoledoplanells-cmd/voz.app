"use client";
import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import BottomNav from '../components/BottomNav';
import ProfileSettingsModal from '../components/ProfileSettingsModal';

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

    const handleParam = searchParams.get('handle');
    const isExplicitHandle = handleParam !== null && handleParam.trim() !== '';
    
    // Solo si handleParam es estrictamente null o vacío, se debe cargar el perfil del usuario logueado por defecto.
    const targetHandle = isExplicitHandle ? handleParam : (user ? (user.handle || '@'+user.name) : null);
    
    // Only consider it their own profile if the targetHandle matches the user's handle.
    const isOwnProfile = user && targetHandle && targetHandle === (user.handle || '@'+user.name);

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

    useEffect(() => {
        if (user && targetHandle) {
            setIsFetchingUser(true);
            setUserNotFound(false);
            
            // Fetch live user stats first, then use exact handle for videos
            fetch(`/api/voz/users/profile?handle=${encodeURIComponent(targetHandle)}`)
                .then(res => res.json())
                .then(data => {
                    let handleForVideos = targetHandle;
                    if (data.success && data.user) {
                        setLiveUser(data.user);
                        const myHandle = user.handle || '@'+user.name;
                        setIsFollowing(data.fans && data.fans.includes(myHandle));
                        // Use exact handle from DB to avoid @ mismatch
                        handleForVideos = data.user.handle || targetHandle;
                    } else {
                        setUserNotFound(true);
                    }
                    
                    // Fetch user videos with the best handle
                    return fetch(`/api/voz/videos?userHandle=${encodeURIComponent(handleForVideos)}`);
                })
                .then(res => res.json())
                .then(data => {
                    const videoList = Array.isArray(data) ? data : (data.videos || []);
                    setVideos(videoList);
                    setLoadingVideos(false);
                })
                .catch(err => {
                    console.error("Error fetching profile or videos:", err);
                    if (!liveUser) {
                        setUserNotFound(true);
                    }
                    setLoadingVideos(false);
                })
                .finally(() => {
                    setIsFetchingUser(false);
                });
        } else if (user && !targetHandle) {
            setIsFetchingUser(false);
            setLoadingVideos(false);
        }
    }, [user, targetHandle]);

    const handleFollowToggle = async () => {
        if (!user || !targetHandle || loadingFollow) return;
        setLoadingFollow(true);
        try {
            const res = await fetch('/api/voz/users/follow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
        }
        setLoadingFollow(false);
    };

    if (isLoading || !user) {
        return <div style={{ backgroundColor: '#000', color: 'white', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Cargando...</div>;
    }

    // Determine what to display based on the strict requirements
    let displayUser = null;

    if (isExplicitHandle) {
        if (isFetchingUser) {
            return <div style={{ backgroundColor: '#000', color: 'white', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Cargando perfil...</div>;
        }
        if (userNotFound || !liveUser) {
            // Se muestra el mensaje en la cabecera, pero permitimos que cargue la vista inferior por si existen videos
            displayUser = { name: 'Usuario no encontrado', handle: targetHandle, fans: 0, following: 0, likes: 0 };
        } else {
            displayUser = liveUser;
        }
    } else {
        // Own profile fallback when no explicit handle is requested
        displayUser = liveUser || user;
    }

    return (
        <div style={{ backgroundColor: '#000', color: 'white', minHeight: '100vh', width: '100%', paddingBottom: '80px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '450px', borderLeft: '1px solid #111', borderRight: '1px solid #111', minHeight: '100vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '1px solid #333' }}>
                    <div style={{ 
                        width: '100px', height: '100px', borderRadius: '50%', 
                        backgroundColor: displayUser.profileColor || '#8E2DE2', 
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                    fontSize: '40px', fontWeight: 'bold', marginBottom: '15px',
                    backgroundImage: displayUser.profileImage ? `url(${displayUser.profileImage})` : 'none',
                    backgroundSize: 'cover'
                }}>
                    {!displayUser.profileImage && (displayUser.name ? displayUser.name.charAt(0).toUpperCase() : '?')}
                </div>
                <h2 style={{ margin: 0 }}>{displayUser.name}</h2>
                <p style={{ color: '#aaa', margin: '5px 0' }}>{displayUser.handle || '@'+displayUser.name?.toLowerCase().replace(/\s+/g, '')}</p>
                <p style={{ textAlign: 'center', fontSize: '0.9rem', maxWidth: '300px' }}>{displayUser.bio || 'Sin biografía todavía.'}</p>
                
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
                        <>
                            <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'center' }}>
                                <button onClick={() => setIsSettingsOpen(true)} style={{ flex: 1, maxWidth: '140px', padding: '8px 15px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>Editar perfil</button>
                                <button onClick={() => router.push('/profile/creator-panel')} style={{ flex: 1, maxWidth: '140px', padding: '8px 15px', background: 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>Anuncios</button>
                            </div>
                            <button onClick={logout} style={{ width: '100%', maxWidth: '290px', padding: '8px 20px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>Cerrar sesión</button>
                        </>
                    ) : (
                        <button onClick={handleFollowToggle} disabled={loadingFollow} style={{ width: '100%', maxWidth: '290px', padding: '10px 20px', backgroundColor: isFollowing ? '#333' : '#8E2DE2', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                            {isFollowing ? 'Siguiendo' : 'Seguir'}
                        </button>
                    )}
                </div>
            </div>

            {/* Grid de Videos */}
            <div style={{ padding: '2px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '10px', borderBottom: '1px solid #333' }}>
                    <span style={{ borderBottom: '2px solid white', paddingBottom: '5px', fontWeight: 'bold' }}>Publicaciones</span>
                </div>
                
                {loadingVideos ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>Cargando vídeos...</div>
                ) : videos.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888' }}>No hay vídeos publicados aún.</div>
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
                                        <div style={{ position: 'absolute', bottom: '5px', left: '5px', color: 'white', fontSize: '0.8rem', fontWeight: 'bold', textShadow: '1px 1px 2px #000' }}>
                                            ▶ {v.views || 0}
                                        </div>
                                    </div>
                                </Link>
                                <button 
                                    onClick={async (e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (!confirm("¿Estás seguro de que quieres eliminar este vídeo?")) return;
                                        try {
                                            const res = await fetch(`/api/voz/videos?id=${v.id}&userHandle=${user.handle || '@'+user.name}`, {
                                                method: 'DELETE'
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
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <ProfileSettingsModal 
                isOpen={isSettingsOpen} 
                onClose={() => setIsSettingsOpen(false)} 
                profile={user} 
                onLogout={logout} 
            />
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