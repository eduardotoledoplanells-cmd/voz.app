"use client";
import { useState, useEffect } from 'react';
import BottomNav from '../../components/BottomNav';
import Link from 'next/link';

export default function CreatorPanelPage() {
    const [user, setUser] = useState<any>(null);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [videos, setVideos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Form state
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        videoUrl: '',
        packSize: 1000,
        priority: 'Local_Standard'
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            window.location.href = '/login';
            return;
        }

        const u = JSON.parse(storedUser);
        setUser(u);

        const handleParam = u.handle || `@${u.name}`;

        // Fetch User Campaigns
        fetch(`/api/voz/campaigns?userHandle=${encodeURIComponent(handleParam)}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setCampaigns(data);
                }
            })
            .catch(console.error);

        // Fetch User Videos for the dropdown
        fetch(`/api/voz/videos?userHandle=${encodeURIComponent(handleParam)}`)
            .then(res => res.json())
            .then(data => {
                const videoList = Array.isArray(data) ? data : (data.videos || []);
                setVideos(videoList);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.videoUrl) {
            alert("Rellena los campos obligatorios");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/voz/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    userHandle: user.handle || `@${user.name}`,
                    userRealName: user.name,
                    userEmail: user.email
                })
            });
            const data = await res.json();
            
            if (data.success && data.campaign) {
                alert("¡Campaña creada con éxito!");
                setCampaigns([data.campaign, ...campaigns]);
                setShowForm(false);
                setFormData({ name: '', videoUrl: '', packSize: 1000, priority: 'Local_Standard' });
            } else {
                alert(data.error || "Error al crear la campaña");
            }
        } catch (err) {
            console.error(err);
            alert("Fallo de conexión");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div style={{ backgroundColor: '#000', color: 'white', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Cargando...</div>;
    }

    return (
        <div style={{ backgroundColor: '#000', color: 'white', minHeight: '100vh', width: '100vw', paddingBottom: '70px', overflowX: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <Link href="/profile" style={{ color: 'white', textDecoration: 'none', marginRight: '15px', fontSize: '20px' }}>←</Link>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Panel de Creador</h2>
            </div>

            <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Tus Campañas Activas</h3>
                    <button 
                        onClick={() => setShowForm(!showForm)}
                        style={{
                            background: 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '8px 15px',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        {showForm ? 'Cancelar' : '+ Nueva Campaña'}
                    </button>
                </div>

                {showForm && (
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '15px', marginBottom: '30px', border: '1px solid rgba(142, 45, 226, 0.3)' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' }}>Lanzar Publicidad</h4>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', color: 'gray', fontSize: '14px' }}>Nombre de la campaña</label>
                                <input 
                                    type="text" 
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    placeholder="Ej. Promoción de mi nuevo cover"
                                    style={{ width: '100%', padding: '12px', backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid #333', borderRadius: '8px', color: 'white', outline: 'none' }}
                                    required
                                />
                            </div>

                                <label style={{ display: 'block', marginBottom: '8px', color: 'gray', fontSize: '14px' }}>Selecciona el vídeo a promocionar</label>
                                {videos.length === 0 ? (
                                    <div style={{ color: '#FF3B30', fontSize: '14px' }}>No tienes vídeos publicados. Sube un vídeo primero.</div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '12px', maxHeight: '200px', overflowY: 'auto', padding: '8px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '10px', border: '1px solid #333', marginBottom: '10px' }}>
                                        {videos.map(v => {
                                            const isSelected = formData.videoUrl === v.videoUrl;
                                            return (
                                                <div 
                                                    key={v.id} 
                                                    onClick={() => setFormData({...formData, videoUrl: v.videoUrl})}
                                                    style={{ 
                                                        cursor: 'pointer', 
                                                        border: isSelected ? '2px solid #8E2DE2' : '2px solid transparent', 
                                                        borderRadius: '8px', 
                                                        padding: '4px',
                                                        backgroundColor: isSelected ? 'rgba(142, 45, 226, 0.15)' : 'rgba(255,255,255,0.02)',
                                                        textAlign: 'center',
                                                        transition: 'all 0.2s',
                                                        position: 'relative'
                                                    }}
                                                >
                                                    <div style={{ width: '100%', height: '100px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px', position: 'relative' }}>
                                                        {v.thumbnailUrl ? (
                                                            <img src={v.thumbnailUrl} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : v.videoUrl ? (
                                                            <video src={v.videoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline preload="metadata" />
                                                        ) : (
                                                            <span style={{ fontSize: '10px', color: '#666' }}>Sin Vista</span>
                                                        )}
                                                        {isSelected && (
                                                            <div style={{ position: 'absolute', top: '4px', right: '4px', backgroundColor: '#8E2DE2', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                                                                ✓
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: isSelected ? '#8E2DE2' : '#ccc', padding: '0 2px' }}>
                                                        {v.description || 'Sin descripción'}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                <input type="hidden" value={formData.videoUrl} required />

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', color: 'gray', fontSize: '14px' }}>Página Web de destino</label>
                                <input 
                                    type="url" 
                                    placeholder="https://tuweb.com/mi-perfil"
                                    value={(formData as any).targetUrl || ''}
                                    onChange={e => setFormData({...formData, ...{ targetUrl: e.target.value } as any})}
                                    style={{ width: '100%', padding: '12px', backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid #333', borderRadius: '8px', color: 'white', outline: 'none' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', color: 'gray', fontSize: '14px' }}>Segmentación Geográfica (Ciudad/Municipio)</label>
                                <input 
                                    type="text" 
                                    placeholder="Ej. Madrid, Barcelona..."
                                    value={(formData as any).geoTarget || ''}
                                    onChange={e => setFormData({...formData, ...{ geoTarget: e.target.value } as any})}
                                    style={{ width: '100%', padding: '12px', backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid #333', borderRadius: '8px', color: 'white', outline: 'none' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', color: 'gray', fontSize: '14px' }}>Alcance (Impresiones)</label>
                                <select 
                                    value={formData.packSize}
                                    onChange={e => setFormData({...formData, packSize: parseInt(e.target.value)})}
                                    style={{ width: '100%', padding: '12px', backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid #333', borderRadius: '8px', color: 'white', outline: 'none' }}
                                >
                                    <option value={1000}>1,000 Impresiones</option>
                                    <option value={5000}>5,000 Impresiones</option>
                                    <option value={20000}>20,000 Impresiones</option>
                                </select>
                            </div>

                            {/* Informative Locked Budget / Duration Boxes */}
                            <div style={{ display: 'flex', gap: '15px', marginTop: '5px' }}>
                                <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid #222', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                                    <span style={{ display: 'block', fontSize: '11px', color: '#666', textTransform: 'uppercase' }}>Precio Fijo</span>
                                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#4CD964' }}>
                                        {formData.packSize === 1000 ? '10.00 €' : formData.packSize === 5000 ? '45.00 €' : '150.00 €'}
                                    </span>
                                </div>
                                <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid #222', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                                    <span style={{ display: 'block', fontSize: '11px', color: '#666', textTransform: 'uppercase' }}>Duración Campaña</span>
                                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#007AFF' }}>
                                        {formData.packSize === 1000 ? '7 Días' : formData.packSize === 5000 ? '15 Días' : '30 Días'}
                                    </span>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={submitting || videos.length === 0}
                                style={{
                                    backgroundColor: '#8E2DE2',
                                    color: 'white',
                                    padding: '15px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    fontSize: '16px',
                                    cursor: 'pointer',
                                    marginTop: '10px',
                                    opacity: submitting ? 0.7 : 1
                                }}
                            >
                                {submitting ? 'Creando...' : 'Lanzar Campaña'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Campaigns List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {campaigns.length === 0 && !showForm ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'gray', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '15px' }}>
                            <span style={{ fontSize: '40px', display: 'block', marginBottom: '10px', opacity: 0.5 }}>🚀</span>
                            Aún no has creado campañas. ¡Promociona tu primer vídeo!
                        </div>
                    ) : (
                        campaigns.map(camp => (
                            <div key={camp.id} style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '10px', borderLeft: `4px solid ${camp.status === 'active' ? '#4CD964' : '#FFA500'}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{camp.name}</div>
                                    <span style={{ 
                                        backgroundColor: camp.status === 'active' ? 'rgba(76,217,100,0.2)' : 'rgba(255,165,0,0.2)',
                                        color: camp.status === 'active' ? '#4CD964' : '#FFA500',
                                        padding: '4px 8px',
                                        borderRadius: '12px',
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase'
                                    }}>
                                        {camp.status}
                                    </span>
                                </div>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'gray', fontSize: '12px' }}>
                                    <div>
                                        <span style={{ display: 'block', marginBottom: '2px' }}>Vistas logradas</span>
                                        <span style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>{camp.impressions || 0} / {camp.packSize}</span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ display: 'block', marginBottom: '2px' }}>Prioridad</span>
                                        <span style={{ color: 'white' }}>{camp.priority.replace('_', ' ')}</span>
                                    </div>
                                </div>
                                
                                {/* Progress Bar */}
                                <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop: '12px', overflow: 'hidden' }}>
                                    <div style={{ 
                                        width: `${Math.min(100, ((camp.impressions || 0) / camp.packSize) * 100)}%`, 
                                        height: '100%', 
                                        backgroundColor: camp.status === 'active' ? '#4CD964' : '#8E2DE2',
                                        borderRadius: '3px'
                                    }} />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <BottomNav />
        </div>
    );
}

