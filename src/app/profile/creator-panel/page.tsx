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
    const [targetMunicipalities, setTargetMunicipalities] = useState<number[]>([]);
    const [loadingLocations, setLoadingLocations] = useState(false);

    // Stripe checkout states
    const [stripePromise, setStripePromise] = useState<any>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [showStripeCheckout, setShowStripeCheckout] = useState(false);

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

        // Parse query params to handle Stripe redirects
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('success') === 'true') {
            alert('¡Pago recibido! Tu campaña de publicidad ha sido activada y comenzará a mostrarse.');
            // Clean up the URL query params so they don't see the alert on reload
            window.history.replaceState({}, document.title, window.location.pathname);
        }
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

        if (!selectedRegionId) {
            alert("Debe seleccionar una Comunidad Autónoma / Región");
            return;
        }

        if (targetMunicipalities.length === 0) {
            alert("Debe seleccionar al menos un municipio / localidad para tu campaña");
            return;
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
                    targetRegions: selectedRegionName ? [selectedRegionName] : [],
                    target_municipalities: targetMunicipalities
                })
            });
            const data = await res.json();
            
            if (data.success && data.campaign) {
                // Step 2: Request Stripe Checkout Session
                const stripeRes = await fetch('/api/stripe/create-checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        packId: `camp_mod${selectedModalityId}`, // camp_mod1, camp_mod2, camp_mod3
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
                    setTargetMunicipalities([]);
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
                
                {/* Campaigns List */}
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', marginTop: '20px' }}>Tus Campañas Activas</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {campaigns.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'gray', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '15px' }}>
                            <span style={{ fontSize: '40px', display: 'block', marginBottom: '10px', opacity: 0.5 }}>🚀</span>
                            Aún no tienes campañas activas. La creación de campañas se gestiona de forma exclusiva desde el Panel de Administración.
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
