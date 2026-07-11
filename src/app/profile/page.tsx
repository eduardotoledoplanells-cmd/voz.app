"use client";
import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import BottomNav from '../components/BottomNav';
import ProfileSettingsModal from '../components/ProfileSettingsModal';

function ProfilePageContent() {
    const { user: loggedInUser, logout, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [videos, setVideos] = useState<any[]>([]);
    const [loadingVideos, setLoadingVideos] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [profileUser, setProfileUser] = useState<any>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);

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

    const isOwnProfile = loggedInUser && (profileUser.id === loggedInUser.id || profileUser.handle === loggedInUser.handle);

    return (
        <div style={{ backgroundColor: '#000', color: 'white', minHeight: '100vh', width: '100vw', display: 'flex', justifyContent: 'center' }}>
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
                    
                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        {isOwnProfile ? (
                            <>
                                <button onClick={() => setIsSettingsOpen(true)} style={{ padding: '8px 20px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>Editar perfil</button>
                                <button onClick={logout} style={{ padding: '8px 20px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>Cerrar sesión</button>
                            </>
                        ) : (
                            <button onClick={() => router.push('/feed')} style={{ padding: '8px 20px', backgroundColor: '#8E2DE2', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>Volver al Feed</button>
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
                        <>
                            <div className="profile-video-grid">
                                {videos.map(v => (
                                    <Link href={`/video/${v.id}`} key={v.id} style={{ textDecoration: 'none', display: 'block' }}>
                                        <div style={{ aspectRatio: '9/16', backgroundColor: '#222', position: 'relative', height: '100%' }}>
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
                                ))}
                            </div>
                            <style>{`
                                .profile-video-grid {
                                    display: grid;
                                    grid-template-columns: repeat(3, 1fr);
                                    gap: 2px;
                                    margin-top: 2px;
                                }
                            `}</style>
                        </>
                    )}
                </div>

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