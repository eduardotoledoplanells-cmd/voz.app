"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import BottomNav from '../components/BottomNav';
import ProfileSettingsModal from '../components/ProfileSettingsModal';
import { Coins } from 'lucide-react';

export default function ProfilePage() {
    const { user, logout, isLoading } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [videos, setVideos] = useState<any[]>([]);
    const [loadingVideos, setLoadingVideos] = useState(true);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (user) {
            // Fetch enriched profile info (counts, etc.)
            fetch(`/api/voz/users/profile?id=${user.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.user) {
                        setProfile(data.user);
                    } else {
                        setProfile(user);
                    }
                    setLoadingProfile(false);
                })
                .catch(err => {
                    console.error("Profile fetch error:", err);
                    setProfile(user);
                    setLoadingProfile(false);
                });

            // Fetch user videos
            const handleParam = user.handle || '@' + user.name;
            fetch(`/api/voz/videos?userHandle=${encodeURIComponent(handleParam)}`)
                .then(res => res.json())
                .then(data => {
                    const videoList = Array.isArray(data) ? data : (data.videos || []);
                    setVideos(videoList);
                    setLoadingVideos(false);
                })
                .catch(err => {
                    console.error("Videos fetch error:", err);
                    setLoadingVideos(false);
                });
        }
    }, [user]);

    const handleDeleteVideo = async (videoId: string) => {
        if (!user || !user.handle) return;
        if (!confirm('¿Seguro que quieres borrar este vídeo? No podrás recuperarlo.')) return;
        try {
            const res = await fetch(`/api/voz/videos?id=${videoId}&userHandle=${encodeURIComponent(user.handle)}`, { method: 'DELETE' });
            if (res.ok) {
                setVideos(prev => prev.filter(v => v.id !== videoId));
            } else {
                alert('No se pudo borrar el vídeo.');
            }
        } catch (e) {
            console.error("Error al borrar el vídeo:", e);
        }
    };

    if (isLoading || !user || loadingProfile || !profile) {
        return <div style={{ backgroundColor: '#000', color: 'white', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Cargando...</div>;
    }

    const name = profile.name || 'Sin nombre';
    const handle = profile.handle || '@usuario';
    const bio = profile.bio || 'Sin biografía todavía.';
    const profileColor = profile.profile_color || profile.profileColor || '#8E2DE2';
    const following = profile.following || profile.followingCount || 0;
    const followers = profile.fans || profile.followersCount || 0;
    const likes = profile.likes || profile.likesCount || 0;

    const walletBalance = Number(profile.wallet_balance || profile.walletBalance || 0).toFixed(2);
    const earningsBalance = Number(profile.earnings_balance || profile.earningsBalance || 0).toFixed(2);

    return (
        <div style={{ backgroundColor: '#000', color: 'white', minHeight: '100vh', width: '100vw', paddingBottom: '70px' }}>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '1px solid #333' }}>
                <div style={{ 
                    width: '100px', height: '100px', borderRadius: '50%', 
                    backgroundColor: profileColor, 
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    fontSize: '40px', fontWeight: 'bold', marginBottom: '15px',
                    backgroundImage: profile.profileImage || profile.profile_image ? `url(${profile.profileImage || profile.profile_image})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}>
                    {!(profile.profileImage || profile.profile_image) && (name ? name.charAt(0).toUpperCase() : '?')}
                </div>
                <h2 style={{ margin: 0 }}>{name}</h2>
                <p style={{ color: '#aaa', margin: '5px 0' }}>{handle}</p>
                <p style={{ textAlign: 'center', fontSize: '0.9rem', maxWidth: '300px' }}>{bio}</p>
                
                <div style={{ display: 'flex', gap: '20px', marginTop: '15px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <strong>{following}</strong><br/><span style={{ fontSize: '0.8rem', color: '#888' }}>Siguiendo</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <strong>{followers}</strong><br/><span style={{ fontSize: '0.8rem', color: '#888' }}>Seguidores</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <strong>{likes}</strong><br/><span style={{ fontSize: '0.8rem', color: '#888' }}>Me gusta</span>
                    </div>
                </div>

                {/* Sistema Económico */}
                <div style={{
                    width: '100%',
                    maxWidth: '400px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '15px 20px',
                    marginTop: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                }}>
                    <h3 style={{ margin: 0, fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'left', width: '100%' }}>Sistema Económico</h3>
                    
                    <div style={{ display: 'flex', gap: '15px', width: '100%' }}>
                        {/* Saldo */}
                        <div style={{
                            flex: 1,
                            backgroundColor: 'rgba(255, 255, 255, 0.01)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            padding: '12px',
                            borderRadius: '12px',
                            textAlign: 'left'
                        }}>
                            <span style={{ fontSize: '0.75rem', color: '#aaa', display: 'block', marginBottom: '3px' }}>Saldo (Consumo)</span>
                             <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#FFD700', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                 {walletBalance} 
                                 <Coins size={18} color="#FFD700" style={{ display: 'inline-block' }} />
                             </span>
                        </div>

                        {/* Cartera */}
                        <div style={{
                            flex: 1,
                            backgroundColor: 'rgba(76, 217, 100, 0.03)',
                            border: '1px solid rgba(76, 217, 100, 0.15)',
                            padding: '12px',
                            borderRadius: '12px',
                            textAlign: 'left'
                        }}>
                            <span style={{ fontSize: '0.75rem', color: '#4CD964', display: 'block', marginBottom: '3px' }}>Cartera (Ganado)</span>
                             <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#4CD964', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                 {earningsBalance} 
                                 <Coins size={18} color="#4CD964" style={{ display: 'inline-block' }} />
                             </span>
                        </div>
                    </div>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button onClick={() => setShowSettings(true)} style={{ padding: '8px 20px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>Editar perfil</button>
                    <button onClick={() => window.location.href = '/profile/monetization'} style={{ padding: '8px 20px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>Monetización</button>
                    <button onClick={() => window.location.href = '/profile/creator-panel'} style={{ padding: '8px 20px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>Panel Creador</button>
                    <button onClick={logout} style={{ padding: '8px 20px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>Cerrar sesión</button>
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
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
                        {videos.map(v => (
                            <div key={v.id} style={{ width: '110px', aspectRatio: '9/16', backgroundColor: '#222', position: 'relative', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                                {v.thumbnailUrl ? (
                                    <img src={v.thumbnailUrl} alt="thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#111', padding: '5px', textAlign: 'center', overflow: 'hidden' }}>
                                        <span style={{ fontSize: '0.75rem', color: '#ccc', wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>
                                            {v.description || 'Sin miniatura'}
                                        </span>
                                    </div>
                                )}
                                
                                {/* Overlay with stats and actions */}
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 40%)', pointerEvents: 'none' }} />
                                
                                {/* Views & Likes */}
                                <div style={{ position: 'absolute', bottom: '5px', left: '5px', right: '5px', display: 'flex', justifyContent: 'space-between', color: 'white', fontSize: '0.75rem', fontWeight: 'bold', textShadow: '1px 1px 2px #000' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>▶ {v.views || 0}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>❤️ {v.likes || 0}</span>
                                </div>
                                
                                {/* Delete Button */}
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteVideo(v.id); }}
                                    style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', borderRadius: '5px', padding: '4px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                                    title="Borrar vídeo"
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ProfileSettingsModal 
                isOpen={showSettings} 
                onClose={() => setShowSettings(false)} 
                profile={profile} 
                onLogout={logout} 
            />

            <BottomNav />
        </div>
    );
}
