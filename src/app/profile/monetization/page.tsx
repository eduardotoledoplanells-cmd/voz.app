"use client";
import { useState, useEffect } from 'react';
import BottomNav from '../../components/BottomNav';
import Link from 'next/link';

export default function MonetizationPage() {
    const [user, setUser] = useState<any>(null);
    const [verificationStatus, setVerificationStatus] = useState<any>(null);
    const [activity, setActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [onboardingLoading, setOnboardingLoading] = useState(false);
    const [twitchUsername, setTwitchUsername] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setIsMobile(window.innerWidth <= 768);
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            window.location.href = '/login';
            return;
        }

        const u = JSON.parse(storedUser);
        setUser(u);
        
        if (u.live_url && u.live_url.includes('twitch.tv/')) {
            setTwitchUsername(u.live_url.split('twitch.tv/')[1]);
        }

        // Fetch verification status
        fetch(`/api/voz/creators/status?userId=${encodeURIComponent(u.id)}`)
            .then(res => res.json())
            .then(data => {
                if (data.success && data.verification) {
                    setVerificationStatus(data.verification);
                    if (data.verification.status === 'approved') {
                        fetchHistory(u.handle || `@${u.name}`);
                    }
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Error checking status:", err);
                setLoading(false);
            });
    }, []);

    const fetchHistory = (handle: string) => {
        fetch(`/api/voz/wallet/history?handle=${encodeURIComponent(handle)}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setActivity(data.activity);
                }
            })
            .catch(console.error);
    };

    const handleStripeOnboarding = () => {
        if (!user) return;
        setOnboardingLoading(true);
        fetch('/api/voz/stripe/connect/onboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.url) {
                window.location.href = data.url;
            } else {
                alert(data.error || "Error al iniciar onboarding");
                setOnboardingLoading(false);
            }
        })
        .catch(err => {
            console.error("Onboarding error:", err);
            alert("Error de conexión");
            setOnboardingLoading(false);
        });
    };

    const handleConnectTwitch = () => {
        if (!twitchUsername || !user) return;
        setIsConnecting(true);
        const newLiveUrl = `https://twitch.tv/${twitchUsername.toLowerCase()}`;
        
        fetch(`/api/voz/users/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: user.id,
                live_url: newLiveUrl
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success || data.user) {
                alert("Cuenta de Twitch vinculada correctamente.");
                const updatedUser = { ...user, live_url: newLiveUrl };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
            } else {
                alert("Error vinculando cuenta");
            }
            setIsConnecting(false);
        })
        .catch(err => {
            console.error(err);
            alert("Error de conexión");
            setIsConnecting(false);
        });
    };

    const handleDisconnectTwitch = () => {
        if (!user) return;
        setIsConnecting(true);
        fetch(`/api/voz/users/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: user.id,
                live_url: null,
                is_live: false
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success || data.user) {
                alert("Cuenta desvinculada.");
                setTwitchUsername('');
                const updatedUser = { ...user, live_url: null, is_live: false };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
            }
            setIsConnecting(false);
        })
        .catch(err => {
            console.error(err);
            setIsConnecting(false);
        });
    };

    if (loading) {
        return <div style={{ backgroundColor: '#000', color: 'white', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Cargando...</div>;
    }

    const isApproved = verificationStatus?.status === 'approved';
    const isPending = verificationStatus?.status === 'pending';

    return (
        <div style={{ backgroundColor: '#000', color: 'white', minHeight: '100vh', width: '100%', paddingBottom: '70px', overflowX: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <Link href="/profile" style={{ color: 'white', textDecoration: 'none', marginRight: '15px', fontSize: '20px' }}>←</Link>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Monetización</h2>
            </div>

            <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
                {!isApproved ? (
                    <div style={{ textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: '30px', borderRadius: '15px' }}>
                        <div style={{ fontSize: '60px', marginBottom: '20px' }}>💰</div>
                        <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '15px' }}>Activa tu Monetización</h3>
                        <p style={{ color: 'gray', lineHeight: '1.5', marginBottom: '30px' }}>
                            Conviértete en un Creador Verificado de VOZ para recibir ingresos por tus videos y transmisiones. Pagos rápidos y seguros impulsados por Stripe.
                        </p>
                        
                        {isPending ? (
                            <div style={{ backgroundColor: 'rgba(255,165,0,0.1)', padding: '15px', borderRadius: '10px', color: '#FFA500', border: '1px solid rgba(255,165,0,0.3)' }}>
                                <span style={{ fontWeight: 'bold' }}>⏳ Verificación Pendiente</span>
                                <p style={{ fontSize: '14px', marginTop: '5px' }}>Estamos revisando tus datos. Esto suele tardar unos minutos.</p>
                            </div>
                        ) : (
                            <button 
                                onClick={handleStripeOnboarding} 
                                disabled={onboardingLoading}
                                style={{
                                    backgroundColor: '#8E2DE2',
                                    color: 'white',
                                    padding: '15px 30px',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontWeight: 'bold',
                                    fontSize: '16px',
                                    cursor: 'pointer',
                                    width: '100%',
                                    opacity: onboardingLoading ? 0.7 : 1
                                }}
                            >
                                {onboardingLoading ? 'Abriendo portal...' : 'Registrarse como Creador en Stripe'}
                            </button>
                        )}
                    </div>
                ) : (
                    <div>
                        {/* Verified Banner */}
                        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                            <div style={{ backgroundColor: 'rgba(76,217,100,0.1)', width: '80px', height: '80px', borderRadius: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 15px' }}>
                                <span style={{ fontSize: '40px' }}>✅</span>
                            </div>
                            <h3 style={{ fontSize: '24px', fontWeight: 'bold' }}>Creador Oficial</h3>
                            <p style={{ color: 'gray', marginTop: '10px' }}>Tu cuenta de Stripe está conectada y activa.</p>
                        </div>
                        {/* Campaña de Publicidad Section */}
                        <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '15px', marginBottom: '30px', border: '1px solid rgba(142, 45, 226, 0.3)' }}>
                            <h4 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                                <span style={{ marginRight: '10px' }}>📢</span> Campañas de Publicidad
                            </h4>
                            <p style={{ color: 'gray', fontSize: '14px', marginBottom: '15px' }}>
                                Promociona tus publicaciones de VOZ para llegar a más audiencia geolocalizada en España.
                            </p>
                            <Link 
                                href="/profile/creator-panel" 
                                style={{ 
                                    display: 'block', textDecoration: 'none', textAlign: 'center',
                                    background: 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)', 
                                    color: 'white', padding: '12px', borderRadius: '8px', fontWeight: 'bold',
                                    cursor: 'pointer', transition: 'opacity 0.2s'
                                }}
                            >
                                Crear Campaña de Publicidad
                            </Link>
                        </div>

                        {/* Twitch Link Section */}
                        <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '15px', marginBottom: '30px' }}>
                            <h4 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                                <span style={{ marginRight: '10px' }}>🔗</span> Conexión de Directos
                            </h4>
                            <p style={{ color: 'gray', fontSize: '14px', marginBottom: '15px' }}>
                                Vincula tu canal de Twitch para que VOZ te detecte automáticamente cuando inicies transmisión en OBS.
                            </p>

                            {user?.live_url ? (
                                <div style={{ backgroundColor: 'rgba(145, 70, 255, 0.1)', padding: '15px', borderRadius: '10px', border: '1px solid rgba(145, 70, 255, 0.3)' }}>
                                    <div style={{ color: 'white', fontWeight: 'bold', marginBottom: '5px' }}>Conectado a Twitch</div>
                                    <div style={{ color: '#9146FF', marginBottom: '15px' }}>Canal: {twitchUsername}</div>
                                    <button 
                                        onClick={handleDisconnectTwitch}
                                        disabled={isConnecting}
                                        style={{ backgroundColor: 'rgba(255, 59, 48, 0.2)', color: '#FF3B30', padding: '10px', border: 'none', borderRadius: '8px', width: '100%', fontWeight: 'bold', cursor: 'pointer' }}
                                    >
                                        {isConnecting ? 'Desvinculando...' : 'Desvincular Cuenta'}
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input 
                                        type="text" 
                                        placeholder="Tu usuario de Twitch" 
                                        value={twitchUsername}
                                        onChange={(e) => setTwitchUsername(e.target.value)}
                                        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid #333', color: 'white', padding: '12px', borderRadius: '8px', outline: 'none' }}
                                    />
                                    <button 
                                        onClick={handleConnectTwitch}
                                        disabled={isConnecting || !twitchUsername}
                                        style={{ backgroundColor: '#9146FF', color: 'white', padding: '12px 20px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                                    >
                                        {isConnecting ? '...' : 'Vincular'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Financial History */}
                        <div style={{ marginBottom: '30px' }}>
                            <h4 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
                                <span style={{ marginRight: '10px' }}>📊</span> Historial de Finanzas
                            </h4>
                            {activity.length === 0 ? (
                                <p style={{ color: 'gray', textAlign: 'center', padding: '20px' }}>No hay transacciones recientes.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {activity.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '20px', backgroundColor: '#222', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: '15px' }}>
                                                    <span style={{ fontSize: '20px' }}>{item.type === 'donation' || item.type === 'gift' ? '🎁' : '💸'}</span>
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 'bold' }}>{item.description || item.type}</div>
                                                    <div style={{ color: 'gray', fontSize: '12px', marginTop: '3px' }}>{new Date(item.timestamp).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                            <div style={{ fontWeight: 'bold', color: item.amount > 0 ? '#4CD964' : 'white' }}>
                                                {item.amount > 0 ? '+' : ''}{item.amount} {item.currency || 'USD'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
}

