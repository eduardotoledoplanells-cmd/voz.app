"use client";
import { useState, useEffect } from 'react';
import BottomNav from '../../components/BottomNav';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';

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
    const [selectedMunicipalitiesData, setSelectedMunicipalitiesData] = useState<{ id: number; name: string; regionId: string; regionName: string }[]>([]);
    const [loadingLocations, setLoadingLocations] = useState(false);

    // Stripe checkout states
    const [stripePromise, setStripePromise] = useState<any>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [showStripeCheckout, setShowStripeCheckout] = useState(false);

    const modalities = [
        { id: 1, name: 'Modalidad 1', packSize: 350, price: '12.00 €', duration: '4 Días', taxNote: '+ Impuestos', priority: 'Local_Standard' },
        { id: 2, name: 'Modalidad 2', packSize: 2500, price: '55.00 €', duration: '8 Días', taxNote: '+ Impuestos', priority: 'Local_Standard' },
        { id: 3, name: 'Modalidad 3', packSize: 15000, price: '199.00 €', duration: '25 Días', taxNote: '+ Impuestos', priority: 'Local_Standard' },
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

        // Parse query params to handle Stripe redirects
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('success') === 'true') {
            alert('¡Pago recibido! Tu campaña de publicidad ha sido activada y comenzará a mostrarse.');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    useEffect(() => {
        if (selectedRegionId && selectedRegionId !== 'ALL_SPAIN') {
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
        }
    }, [selectedRegionId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.videoUrl) {
            alert("Rellena los campos obligatorios");
            return;
        }

        if (!selectedRegionId) {
            alert("Debe seleccionar una Comunidad Autónoma o 'Toda España'");
            return;
        }

        let targetRegions: string[] = [];
        let target_municipalities: number[] = [];

        if (selectedRegionId === 'ALL_SPAIN') {
            targetRegions = ['Toda España'];
            target_municipalities = [];
        } else {
            if (selectedMunicipalitiesData.length === 0) {
                alert("Debe seleccionar 'Toda España' o elegir al menos un municipio objetivo en la región.");
                return;
            }
            targetRegions = Array.from(new Set(selectedMunicipalitiesData.map(m => m.regionName)));
            target_municipalities = selectedMunicipalitiesData.map(m => m.id);
        }

        setSubmitting(true);
        try {
            // Step 1: Create the campaign in pending_payment status
            const res = await fetch('/api/voz/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    userHandle: user.handle || `@${user.name}`,
                    userRealName: user.name,
                    userEmail: user.email,
                    targetCountries: ['España'],
                    targetRegions,
                    target_municipalities
                })
            });
            const data = await res.json();
            
            if (data.success && data.campaign) {
                // Step 2: Request Stripe Checkout Session
                const stripeRes = await fetch('/api/stripe/create-checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        packId: `camp_mod${selectedModalityId}`,
                        type: 'campaign_payment',
                        campaignId: data.campaign.id,
                        userId: user.id,
                        userHandle: user.handle || user.name,
                        redirectUrl: window.location.origin + '/profile/creator-panel'
                    })
                });
                const stripeData = await stripeRes.json();
                
                if (stripeData.clientSecret) {
                    setStripePromise(loadStripe(stripeData.publishableKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''));
                    setClientSecret(stripeData.clientSecret);
                    setShowStripeCheckout(true);

                    // Add campaign to local list so user sees it immediately
                    setCampaigns([data.campaign, ...campaigns]);
                    setShowForm(false);
                    setSelectedModalityId(null);
                    setSelectedMunicipalitiesData([]);
                    setSelectedRegionId('');
                    setSelectedRegionName('');
                    setFormData({ name: '', videoUrl: '', packSize: 1000, priority: 'Local_Standard' });
                } else {
                    alert(stripeData.error || "Error al iniciar pasarela de pago");
                }
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
                
                {/* Banner / Button to Create New Ad Campaign */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(142, 45, 226, 0.2) 0%, rgba(74, 0, 224, 0.2) 100%)',
                    border: '1px solid rgba(142, 45, 226, 0.4)',
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '25px',
                    textAlign: 'center',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.5)'
                }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>📢</div>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 6px 0', color: 'white' }}>Crea tu Campaña de Anuncios</h3>
                    <p style={{ color: '#aaa', fontSize: '13px', margin: '0 0 15px 0', lineHeight: '1.4' }}>
                        Impulsa tu vídeo o negocio promocionándolo a audiencias locales en municipios y regiones específicas de España.
                    </p>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        style={{
                            backgroundColor: showForm ? '#333' : '#8E2DE2',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '12px 24px',
                            fontWeight: 'bold',
                            fontSize: '14px',
                            cursor: 'pointer',
                            boxShadow: showForm ? 'none' : '0 4px 15px rgba(142, 45, 226, 0.6)',
                            transition: 'all 0.2s'
                        }}
                    >
                        {showForm ? 'Cancelar Creación' : '🚀 + Crear Nueva Campaña'}
                    </button>
                </div>

                {/* Formulario Interactivo de Creación de Campañas */}
                {showForm && (
                    <form onSubmit={handleSubmit} style={{
                        backgroundColor: '#121216',
                        border: '1px solid #222',
                        borderRadius: '20px',
                        padding: '24px',
                        marginBottom: '30px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
                    }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 20px 0', color: 'white', borderBottom: '1px solid #222', paddingBottom: '12px' }}>
                            Configura tu Campaña Publicitaria
                        </h3>

                        {/* 1. Nombre de la Campaña */}
                        <div style={{ marginBottom: '18px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#ccc', marginBottom: '6px' }}>
                                1. Nombre de la Campaña / Negocio *
                            </label>
                            <input
                                type="text"
                                placeholder="Ej. Mi Bar - Promoción Verano"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    backgroundColor: '#1a1a20',
                                    border: '1px solid #333',
                                    borderRadius: '10px',
                                    color: 'white',
                                    fontSize: '14px',
                                    boxSizing: 'border-box'
                                }}
                                required
                            />
                        </div>

                        {/* 2. Selección de Vídeo con Miniaturas Visuales */}
                        <div style={{ marginBottom: '22px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#ccc', marginBottom: '8px' }}>
                                2. Selecciona el Vídeo a Promocionar *
                            </label>
                            
                            {videos.length === 0 ? (
                                <div style={{ fontSize: '12px', color: '#888', fontStyle: 'italic', padding: '10px 0' }}>
                                    No se encontraron vídeos subidos en tu perfil.
                                </div>
                            ) : (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                                    gap: '12px',
                                    maxHeight: '260px',
                                    overflowY: 'auto',
                                    padding: '8px',
                                    backgroundColor: '#16161c',
                                    borderRadius: '12px',
                                    border: '1px solid #2a2a35'
                                }}>
                                    {videos.map((v) => {
                                        const videoUrl = v.videoUrl || v.url || v.video_url;
                                        const thumbUrl = v.thumbnailUrl || v.thumbnail_url || v.thumbnail || v.poster;
                                        const isSelected = formData.videoUrl === videoUrl;
                                        const title = v.title || v.description || 'Vídeo sin título';

                                        return (
                                            <div
                                                key={v.id}
                                                onClick={() => setFormData({ ...formData, videoUrl })}
                                                style={{
                                                    position: 'relative',
                                                    borderRadius: '10px',
                                                    overflow: 'hidden',
                                                    cursor: 'pointer',
                                                    border: `3px solid ${isSelected ? '#8E2DE2' : 'transparent'}`,
                                                    boxShadow: isSelected ? '0 0 12px rgba(142, 45, 226, 0.8)' : 'none',
                                                    aspectRatio: '9/14',
                                                    backgroundColor: '#000',
                                                    transition: 'all 0.2s',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'flex-end'
                                                }}
                                            >
                                                {/* Miniatura del vídeo o Vista Previa */}
                                                {thumbUrl ? (
                                                    <img
                                                        src={thumbUrl}
                                                        alt={title}
                                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <video
                                                        src={videoUrl}
                                                        preload="metadata"
                                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
                                                    />
                                                )}

                                                {/* Overlay de Selección */}
                                                <div style={{
                                                    position: 'absolute',
                                                    top: 0, left: 0, right: 0, bottom: 0,
                                                    backgroundColor: isSelected ? 'rgba(142, 45, 226, 0.3)' : 'rgba(0,0,0,0.2)',
                                                    transition: 'all 0.2s'
                                                }} />

                                                {/* Checkmark Badge si está seleccionado */}
                                                {isSelected && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '6px',
                                                        right: '6px',
                                                        backgroundColor: '#8E2DE2',
                                                        color: 'white',
                                                        borderRadius: '50%',
                                                        width: '22px',
                                                        height: '22px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '12px',
                                                        fontWeight: 'bold',
                                                        boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                                                        zIndex: 2
                                                    }}>
                                                        ✓
                                                    </div>
                                                )}

                                                {/* Título o descripción del vídeo */}
                                                <div style={{
                                                    position: 'relative',
                                                    zIndex: 2,
                                                    padding: '6px',
                                                    background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
                                                    color: 'white',
                                                    fontSize: '10px',
                                                    fontWeight: 'bold',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>
                                                    {title}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Sincronización con el desplegable */}
                            <select
                                value={formData.videoUrl}
                                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    marginTop: '8px',
                                    backgroundColor: '#1a1a20',
                                    border: '1px solid #333',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontSize: '12px',
                                    boxSizing: 'border-box'
                                }}
                                required
                            >
                                <option value="">-- O selecciona desde la lista si lo prefieres --</option>
                                {videos.map(v => (
                                    <option key={v.id} value={v.videoUrl || v.url || v.video_url}>
                                        {v.title || v.description || `Vídeo ${v.id.substring(0, 8)}`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 3. Selección de Modalidad / Pack de Vistas */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#ccc', marginBottom: '8px' }}>
                                3. Modalidad y Paquete de Impresiones *
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {modalities.map(mod => {
                                    const isSelected = selectedModalityId === mod.id;
                                    return (
                                        <div
                                            key={mod.id}
                                            onClick={() => {
                                                setSelectedModalityId(mod.id);
                                                setFormData({ ...formData, packSize: mod.packSize, priority: mod.priority });
                                            }}
                                            style={{
                                                padding: '14px',
                                                borderRadius: '12px',
                                                backgroundColor: isSelected ? 'rgba(142, 45, 226, 0.15)' : '#1a1a20',
                                                border: `2px solid ${isSelected ? '#8E2DE2' : '#282830'}`,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'white' }}>{mod.name} - {mod.packSize.toLocaleString('es-ES')} Impresiones</div>
                                                <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>Duración estimada: {mod.duration}</div>
                                                <div style={{ fontSize: '10px', color: '#888', marginTop: '1px', fontStyle: 'italic' }}>{mod.taxNote}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#8E2DE2' }}>{mod.price}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 4. Geolocalización (Toda España, Regiones y Municipios) */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#ccc', marginBottom: '6px' }}>
                                4. Comunidad Autónoma / Cobertura Geográfica *
                            </label>
                            
                            <select
                                value={selectedRegionId}
                                onChange={(e) => {
                                    const regId = e.target.value;
                                    setSelectedRegionId(regId);
                                    if (regId === 'ALL_SPAIN') {
                                        setSelectedRegionName('Toda España');
                                    } else {
                                        const foundReg = regionsDb.find(r => String(r.id) === regId);
                                        setSelectedRegionName(foundReg ? foundReg.name : '');
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    backgroundColor: selectedRegionId === 'ALL_SPAIN' ? 'rgba(76,217,100,0.15)' : '#1a1a20',
                                    border: `1px solid ${selectedRegionId === 'ALL_SPAIN' ? '#4CD964' : '#333'}`,
                                    borderRadius: '10px',
                                    color: selectedRegionId === 'ALL_SPAIN' ? '#4CD964' : 'white',
                                    fontSize: '14px',
                                    fontWeight: selectedRegionId === 'ALL_SPAIN' ? 'bold' : 'normal',
                                    boxSizing: 'border-box'
                                }}
                                required
                            >
                                <option value="">-- Selecciona Cobertura o CCAA --</option>
                                <option value="ALL_SPAIN" style={{ fontWeight: 'bold', color: '#4CD964', backgroundColor: '#111' }}>
                                    🇪🇸 Toda España (Cobertura Nacional Completa)
                                </option>
                                {regionsDb.map(r => {
                                    const count = selectedMunicipalitiesData.filter(m => String(m.regionId) === String(r.id)).length;
                                    const hasSelected = count > 0;
                                    return (
                                        <option
                                            key={r.id}
                                            value={r.id}
                                            style={{
                                                fontWeight: hasSelected ? 'bold' : 'normal',
                                                color: hasSelected ? '#4CD964' : 'white',
                                                backgroundColor: '#111'
                                            }}
                                        >
                                            {hasSelected ? `🟢 ${r.name} (${count} municipio${count > 1 ? 's' : ''} selecc.)` : r.name}
                                        </option>
                                    );
                                })}
                            </select>

                            {/* Banner de Cobertura Nacional cuando se elige Toda España */}
                            {selectedRegionId === 'ALL_SPAIN' && (
                                <div style={{
                                    marginTop: '12px',
                                    backgroundColor: 'rgba(76, 217, 100, 0.12)',
                                    border: '1px solid rgba(76, 217, 100, 0.4)',
                                    borderRadius: '12px',
                                    padding: '14px',
                                    color: 'white'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: '#4CD964', fontSize: '13px' }}>
                                        <span>🟢</span> Cobertura Nacional "Toda España" Activa
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#ccc', marginTop: '4px', lineHeight: '1.4' }}>
                                        Tu anuncio se mostrará a usuarios de todas las comunidades autónomas y municipios de España sin restricciones geográficas.
                                    </div>
                                </div>
                            )}

                            {/* Lista de Municipios para la Región Seleccionada */}
                            {selectedRegionId && selectedRegionId !== 'ALL_SPAIN' && (
                                <div style={{ marginTop: '15px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#aaa' }}>
                                            Municipios en {selectedRegionName} ({selectedMunicipalitiesData.filter(m => String(m.regionId) === String(selectedRegionId)).length} seleccionados):
                                        </label>
                                        {municipalitiesDb.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const currentSelectedInRegion = selectedMunicipalitiesData.filter(m => String(m.regionId) === String(selectedRegionId));
                                                    
                                                    if (currentSelectedInRegion.length === municipalitiesDb.length) {
                                                        // Desmarcar todos de esta región
                                                        setSelectedMunicipalitiesData(selectedMunicipalitiesData.filter(m => String(m.regionId) !== String(selectedRegionId)));
                                                    } else {
                                                        // Marcar todos de esta región (preservando otras regiones)
                                                        const otherRegionsData = selectedMunicipalitiesData.filter(m => String(m.regionId) !== String(selectedRegionId));
                                                        const newForThisRegion = municipalitiesDb.map(m => ({
                                                            id: m.id,
                                                            name: m.name,
                                                            regionId: String(selectedRegionId),
                                                            regionName: selectedRegionName
                                                        }));
                                                        setSelectedMunicipalitiesData([...otherRegionsData, ...newForThisRegion]);
                                                    }
                                                }}
                                                style={{ background: 'none', border: 'none', color: '#8E2DE2', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                                            >
                                                {selectedMunicipalitiesData.filter(m => String(m.regionId) === String(selectedRegionId)).length === municipalitiesDb.length ? 'Desmarcar esta CCAA' : 'Marcar todos en esta CCAA'}
                                            </button>
                                        )}
                                    </div>

                                    {loadingLocations ? (
                                        <div style={{ fontSize: '12px', color: '#888', padding: '10px 0' }}>Cargando localidades...</div>
                                    ) : (
                                        <div style={{
                                            maxHeight: '160px',
                                            overflowY: 'auto',
                                            backgroundColor: '#16161c',
                                            border: '1px solid #2a2a35',
                                            borderRadius: '10px',
                                            padding: '10px'
                                        }}>
                                            {municipalitiesDb.map(m => {
                                                const isChecked = selectedMunicipalitiesData.some(item => item.id === m.id);
                                                return (
                                                    <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', fontSize: '12px', color: 'white', cursor: 'pointer' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedMunicipalitiesData([
                                                                        ...selectedMunicipalitiesData,
                                                                        { id: m.id, name: m.name, regionId: String(selectedRegionId), regionName: selectedRegionName }
                                                                    ]);
                                                                } else {
                                                                    setSelectedMunicipalitiesData(selectedMunicipalitiesData.filter(item => item.id !== m.id));
                                                                }
                                                            }}
                                                        />
                                                        <span>{m.name}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Resumen Completo de Comunidades y Municipios Seleccionados */}
                            {selectedMunicipalitiesData.length > 0 && selectedRegionId !== 'ALL_SPAIN' && (
                                <div style={{
                                    marginTop: '15px',
                                    backgroundColor: '#141419',
                                    border: '1px solid rgba(76, 217, 100, 0.3)',
                                    borderRadius: '12px',
                                    padding: '14px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#4CD964' }}>
                                            📍 Resumen de Selección ({selectedMunicipalitiesData.length} municipios en {Array.from(new Set(selectedMunicipalitiesData.map(m => m.regionName))).length} CCAA)
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedMunicipalitiesData([])}
                                            style={{ background: 'none', border: 'none', color: '#FF3B30', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                                        >
                                            Limpiar selección
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {Array.from(new Set(selectedMunicipalitiesData.map(m => m.regionName))).map(regName => {
                                            const regMunis = selectedMunicipalitiesData.filter(m => m.regionName === regName);
                                            return (
                                                <div key={regName} style={{ backgroundColor: '#1c1c24', padding: '10px', borderRadius: '8px', borderLeft: '3px solid #4CD964' }}>
                                                    <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#4CD964', marginBottom: '6px' }}>
                                                        🟢 {regName} ({regMunis.length})
                                                    </div>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                        {regMunis.map(m => (
                                                            <span
                                                                key={m.id}
                                                                style={{
                                                                    backgroundColor: 'rgba(76, 217, 100, 0.15)',
                                                                    color: 'white',
                                                                    border: '1px solid rgba(76, 217, 100, 0.4)',
                                                                    padding: '3px 8px',
                                                                    borderRadius: '12px',
                                                                    fontSize: '11px',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px'
                                                                }}
                                                            >
                                                                {m.name}
                                                                <span
                                                                    onClick={() => setSelectedMunicipalitiesData(selectedMunicipalitiesData.filter(item => item.id !== m.id))}
                                                                    style={{ cursor: 'pointer', color: '#FF3B30', fontWeight: 'bold' }}
                                                                    title="Eliminar municipio"
                                                                >
                                                                    ✕
                                                                </span>
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={submitting || !selectedModalityId}
                            style={{
                                width: '100%',
                                padding: '14px',
                                background: !selectedModalityId ? '#333' : 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontWeight: 'bold',
                                fontSize: '15px',
                                cursor: !selectedModalityId ? 'not-allowed' : 'pointer',
                                boxShadow: !selectedModalityId ? 'none' : '0 4px 15px rgba(142, 45, 226, 0.5)',
                                opacity: submitting ? 0.6 : 1
                            }}
                        >
                            {submitting ? 'Procesando...' : '💳 Continuar al Pago Seguro (Stripe)'}
                        </button>
                    </form>
                )}

                {/* Campaigns List */}
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', marginTop: '20px' }}>Tus Campañas Activas</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {campaigns.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'gray', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '15px' }}>
                            <span style={{ fontSize: '40px', display: 'block', marginBottom: '10px', opacity: 0.5 }}>🚀</span>
                            Aún no tienes campañas activas. Usa el botón superior para crear tu primera campaña publicitaria.
                        </div>
                    ) : (
                        campaigns.map(camp => (
                            <div key={camp.id} style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '10px', borderLeft: `4px solid ${camp.status === 'active' ? '#4CD964' : camp.status === 'pending_payment' ? '#FFA500' : '#888'}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{camp.name}</div>
                                    <span style={{ 
                                        backgroundColor: camp.status === 'active' ? 'rgba(76,217,100,0.2)' : camp.status === 'pending_payment' ? 'rgba(255,165,0,0.2)' : 'rgba(255,255,255,0.1)',
                                        color: camp.status === 'active' ? '#4CD964' : camp.status === 'pending_payment' ? '#FFA500' : '#888',
                                        padding: '4px 8px',
                                        borderRadius: '12px',
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase'
                                    }}>
                                        {camp.status === 'active' ? 'ACTIVA' : camp.status === 'pending_payment' ? 'PAGO PENDIENTE' : camp.status}
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

            {/* Sub-modal Stripe Checkout */}
            {showStripeCheckout && clientSecret && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 11000,
                    display: 'flex', flexDirection: 'column', alignItems: 'center'
                }}>
                    <div style={{ width: '100%', maxWidth: '500px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderBottom: '1px solid #222' }}>
                        <h3 style={{ color: 'white', margin: 0, fontSize: '16px' }}>Pago Seguro de Campaña</h3>
                        <button onClick={() => { setShowStripeCheckout(false); setClientSecret(null); }} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                    </div>
                    <div style={{ width: '100%', maxWidth: '500px', flex: 1, overflowY: 'auto', padding: '15px' }}>
                        <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
                            <EmbeddedCheckout />
                        </EmbeddedCheckoutProvider>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
}
