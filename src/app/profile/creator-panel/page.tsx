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

    // Modalities & Geolocalisation States
    const [selectedModalityId, setSelectedModalityId] = useState<number | null>(null);
    const [regionsDb, setRegionsDb] = useState<any[]>([]);
    const [selectedRegionId, setSelectedRegionId] = useState<string>('');
    const [selectedRegionName, setSelectedRegionName] = useState<string>('');
    const [municipalitiesDb, setMunicipalitiesDb] = useState<any[]>([]);
    const [targetMunicipalities, setTargetMunicipalities] = useState<number[]>([]);
    const [loadingLocations, setLoadingLocations] = useState(false);

    const modalities = [
        { id: 1, name: 'Modalidad 1', packSize: 1000, price: '10.00 €', duration: '7 Días', priority: 'Local_Standard' },
        { id: 2, name: 'Modalidad 2', packSize: 5000, price: '45.00 €', duration: '15 Días', priority: 'Local_Standard' },
        { id: 3, name: 'Modalidad 3', packSize: 20000, price: '150.00 €', duration: '30 Días', priority: 'Local_Standard' },
    ];

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

        // Fetch CCAA Regions of Spain
        fetch('/api/locations?type=regions&countryId=1')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setRegionsDb(data);
                }
            })
            .catch(console.error);
    }, []);

    useEffect(() => {
        if (selectedRegionId) {
            setLoadingLocations(true);
            fetch(`/api/locations?type=municipalities&regionId=${selectedRegionId}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setMunicipalitiesDb(data);
                    }
                    setLoadingLocations(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoadingLocations(false);
                });
        } else {
            setMunicipalitiesDb([]);
            setTargetMunicipalities([]);
        }
    }, [selectedRegionId]);

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
                    userEmail: user.email,
                    targetCountries: ['España'],
                    targetRegions: selectedRegionName ? [selectedRegionName] : [],
                    target_municipalities: targetMunicipalities
                })
            });
            const data = await res.json();
            
            if (data.success && data.campaign) {
                alert("¡Campaña creada con éxito!");
                setCampaigns([data.campaign, ...campaigns]);
                setShowForm(false);
                setSelectedModalityId(null);
                setTargetMunicipalities([]);
                setSelectedRegionId('');
                setSelectedRegionName('');
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
        <div style={{ backgroundColor: '#000', color: 'white', minHeight: '100vh', width: '100%', paddingBottom: '70px', overflowX: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <Link href="/profile" style={{ color: 'white', textDecoration: 'none', marginRight: '15px', fontSize: '20px' }}>←</Link>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Panel de Creador</h2>
            </div>

            <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
                
                {/* 1. Modalidades de Campaña (Three Squares Selection) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Elige una Modalidad de Campaña</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        {modalities.map(mod => {
                            const isSelected = selectedModalityId === mod.id;
                            return (
                                <div 
                                    key={mod.id}
                                    onClick={() => {
                                        if (!showForm) {
                                            setSelectedModalityId(mod.id);
                                            setFormData(prev => ({ ...prev, packSize: mod.packSize, priority: mod.priority }));
                                        }
                                    }}
                                    style={{
                                        backgroundColor: isSelected ? 'rgba(142, 45, 226, 0.15)' : 'rgba(255,255,255,0.03)',
                                        border: isSelected ? '2px solid #8E2DE2' : '1px solid #333',
                                        borderRadius: '12px',
                                        padding: '12px 8px',
                                        textAlign: 'center',
                                        cursor: showForm ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s',
                                        opacity: showForm && !isSelected ? 0.5 : 1
                                    }}
                                >
                                    <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '8px', color: isSelected ? '#8E2DE2' : 'white' }}>{mod.name}</div>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4CD964', marginBottom: '5px' }}>{mod.price}</div>
                                    <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '3px' }}>{mod.packSize.toLocaleString()} Impresiones</div>
                                    <div style={{ fontSize: '10px', color: '#666' }}>Duración: {mod.duration}</div>
                                </div>
                            );
                        })}
                    </div>

                    {!showForm && (
                        <button 
                            onClick={() => {
                                if (selectedModalityId !== null) {
                                    setShowForm(true);
                                }
                            }}
                            disabled={selectedModalityId === null}
                            style={{
                                background: selectedModalityId !== null ? 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)' : '#333',
                                color: selectedModalityId !== null ? 'white' : '#666',
                                border: 'none',
                                padding: '15px',
                                borderRadius: '10px',
                                fontWeight: 'bold',
                                fontSize: '16px',
                                cursor: selectedModalityId !== null ? 'pointer' : 'not-allowed',
                                transition: 'opacity 0.2s',
                                textAlign: 'center',
                                width: '100%'
                            }}
                        >
                            + Nueva Campaña
                        </button>
                    )}
                </div>

                {showForm && (
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '15px', marginBottom: '30px', border: '1px solid rgba(142, 45, 226, 0.3)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h4 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>Lanzar Publicidad</h4>
                            <button 
                                onClick={() => {
                                    setShowForm(false);
                                    setSelectedModalityId(null);
                                }}
                                style={{ backgroundColor: 'rgba(255, 59, 48, 0.1)', color: '#FF3B30', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                Cancelar
                            </button>
                        </div>

                        {/* Modality stats display */}
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                            <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid #222', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                                <span style={{ display: 'block', fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>Modalidad</span>
                                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#8E2DE2' }}>
                                    {selectedModalityId === 1 ? 'Modalidad 1' : selectedModalityId === 2 ? 'Modalidad 2' : 'Modalidad 3'}
                                </span>
                            </div>
                            <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid #222', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                                <span style={{ display: 'block', fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>Precio Fijo</span>
                                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#4CD964' }}>
                                    {formData.packSize === 1000 ? '10.00 €' : formData.packSize === 5000 ? '45.00 €' : '150.00 €'}
                                </span>
                            </div>
                            <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid #222', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                                <span style={{ display: 'block', fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>Duración</span>
                                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#007AFF' }}>
                                    {formData.packSize === 1000 ? '7 Días' : formData.packSize === 5000 ? '15 Días' : '30 Días'}
                                </span>
                            </div>
                        </div>

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

                            <div>
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
                            </div>

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

                            {/* Geotargeting segment */}
                            <div style={{ border: '1px solid #222', padding: '15px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                                <h5 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', margin: 0 }}>
                                    <span style={{ marginRight: '8px' }}>🌍</span> Segmentación Geográfica
                                </h5>

                                <div style={{ marginBottom: '12px', marginTop: '10px' }}>
                                    <label style={{ display: 'block', marginBottom: '4px', color: 'gray', fontSize: '12px' }}>País</label>
                                    <select 
                                        style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid #333', borderRadius: '8px', color: 'white', outline: 'none' }}
                                        disabled
                                    >
                                        <option value="1">España</option>
                                    </select>
                                </div>

                                <div style={{ marginBottom: '12px' }}>
                                    <label style={{ display: 'block', marginBottom: '4px', color: 'gray', fontSize: '12px' }}>Comunidad Autónoma / Región</label>
                                    <select 
                                        value={selectedRegionId}
                                        onChange={e => {
                                            const id = e.target.value;
                                            setSelectedRegionId(id);
                                            const found = regionsDb.find(r => r.id === parseInt(id));
                                            setSelectedRegionName(found ? found.name : '');
                                        }}
                                        style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid #333', borderRadius: '8px', color: 'white', outline: 'none' }}
                                        required
                                    >
                                        <option value="">-- Selecciona una región --</option>
                                        {regionsDb.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {selectedRegionId && (
                                    <div style={{ marginTop: '15px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <label style={{ color: 'gray', fontSize: '12px', margin: 0 }}>Municipios / Localidades</label>
                                            {municipalitiesDb.length > 0 && (
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button 
                                                        type="button"
                                                        onClick={() => setTargetMunicipalities(municipalitiesDb.map(m => m.id))}
                                                        style={{ backgroundColor: 'rgba(142, 45, 226, 0.2)', color: '#a855f7', border: 'none', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                                                    >
                                                        Marcar todo
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={() => setTargetMunicipalities([])}
                                                        style={{ backgroundColor: 'rgba(255, 59, 48, 0.1)', color: '#FF3B30', border: 'none', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                                                    >
                                                        Desmarcar todo
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {loadingLocations ? (
                                            <div style={{ color: 'gray', fontSize: '12px', textAlign: 'center', padding: '10px' }}>Cargando localidades...</div>
                                        ) : municipalitiesDb.length === 0 ? (
                                            <div style={{ color: 'gray', fontSize: '12px', textAlign: 'center', padding: '10px' }}>No hay localidades registradas.</div>
                                        ) : (
                                            <div style={{ 
                                                maxHeight: '150px', 
                                                overflowY: 'auto', 
                                                border: '1px solid #333', 
                                                borderRadius: '8px', 
                                                backgroundColor: 'rgba(0,0,0,0.4)', 
                                                padding: '8px',
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                                                gap: '6px'
                                            }}>
                                                {municipalitiesDb.map(m => {
                                                    const isChecked = targetMunicipalities.includes(m.id);
                                                    return (
                                                        <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer', color: isChecked ? 'white' : '#aaa' }}>
                                                            <input 
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => {
                                                                    setTargetMunicipalities(prev => 
                                                                        prev.includes(m.id) 
                                                                            ? prev.filter(id => id !== m.id) 
                                                                            : [...prev, m.id]
                                                                    );
                                                                }}
                                                            />
                                                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={m.name}>
                                                                {m.name}
                                                            </span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        <div style={{ fontSize: '10px', color: '#888', marginTop: '4px', textAlign: 'right' }}>
                                            {targetMunicipalities.length} de {municipalitiesDb.length} seleccionados
                                        </div>
                                    </div>
                                )}
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
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', marginTop: '20px' }}>Tus Campañas Activas</h3>
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
