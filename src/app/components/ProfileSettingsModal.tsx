"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { Coins } from 'lucide-react';
import WalletWidget from './WalletWidget';

const COIN_PACKS = [
    { id: 'p2', name: 'Pack 2', coins: 10, price: 12.10, image: null },
    { id: 'p3', name: 'Pack 3', coins: 20, price: 24.20, image: null },
    { id: 'p4', name: 'Pack 4', coins: 50, price: 60.50, image: null },
    { id: 'ps', name: 'Super Pack Especial', coins: 100, price: 121.00, image: null, isSuper: true },
    { id: 'pVIP', name: 'VIP Ultra Pack', coins: 500, price: 605.00, image: null, isSuper: true },
];

export default function ProfileSettingsModal({ isOpen, onClose, profile, onLogout }: { isOpen: boolean, onClose: () => void, profile: any, onLogout: () => void }) {
    const router = useRouter();
    const { updateUser, refreshUser } = useAuth();
    
    // Refresh user data (including wallet balance) whenever the modal is opened
    useEffect(() => {
        if (isOpen) {
            refreshUser().catch(err => console.error("Error refreshing user balance:", err));
        }
    }, [isOpen, refreshUser]);

    // Estados para edición
    const [editMode, setEditMode] = useState<'name' | 'bio' | 'live_url' | 'country' | null>(null);
    const [editText, setEditText] = useState('');
    const [editCountry, setEditCountry] = useState('España');
    const [editRegion, setEditRegion] = useState('');
    const [editKick, setEditKick] = useState('');
    const [editTwitch, setEditTwitch] = useState('');
    const [editYoutube, setEditYoutube] = useState('');
    const [isDisclaimerAccepted, setIsDisclaimerAccepted] = useState(false);
    const [saving, setSaving] = useState(false);
    
    // Estados para la tienda de monedas
    const [showCoinPacks, setShowCoinPacks] = useState(false);
    const [isBuyingPack, setIsBuyingPack] = useState(false);
    
    // Estados para Stripe Checkout
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [stripePromise, setStripePromise] = useState<any>(null);
    const [showStripeCheckout, setShowStripeCheckout] = useState(false);

    const [spainRegions, setSpainRegions] = useState<any[]>([]);
    const [selectedRegionId, setSelectedRegionId] = useState<string>('');
    const [spainMunicipalities, setSpainMunicipalities] = useState<any[]>([]);
    const [selectedMunicipalityId, setSelectedMunicipalityId] = useState<string>('');
    const [selectedCityName, setSelectedCityName] = useState<string>('');

    useEffect(() => {
        fetch('/api/locations?type=regions&countryId=1')
            .then(res => res.json())
            .then(data => setSpainRegions(Array.isArray(data) ? data : []))
            .catch(err => console.error("Error fetching regions:", err));
    }, []);

    useEffect(() => {
        if (selectedRegionId) {
            fetch(`/api/locations?type=municipalities&regionId=${selectedRegionId}`)
                .then(res => res.json())
                .then(data => setSpainMunicipalities(Array.isArray(data) ? data : []))
                .catch(err => console.error("Error fetching municipalities:", err));
        } else {
            setSpainMunicipalities([]);
        }
    }, [selectedRegionId]);

    // Auto-preselect region from profile data
    useEffect(() => {
        if (editMode === 'country' && profile && spainRegions.length > 0 && !selectedRegionId) {
            let matchR = null;
            if (profile.region_id) {
                matchR = spainRegions.find(r => String(r.id) === String(profile.region_id));
            }
            if (!matchR && profile.region) {
                const clean = profile.region.toLowerCase();
                matchR = spainRegions.find(r => clean.includes(r.name.toLowerCase()) || r.name.toLowerCase().includes(clean));
            }
            if (matchR) {
                setSelectedRegionId(String(matchR.id));
            }
        }
    }, [editMode, spainRegions, profile, selectedRegionId]);

    // Auto-preselect municipality from profile data
    useEffect(() => {
        if (editMode === 'country' && profile && selectedRegionId && spainMunicipalities.length > 0 && !selectedMunicipalityId) {
            let matchM = null;
            if (profile.municipality_id) {
                matchM = spainMunicipalities.find(m => String(m.id) === String(profile.municipality_id));
            }
            if (!matchM && (profile.city || profile.municipality || profile.region)) {
                const searchTarget = (profile.city || profile.municipality || profile.region).toLowerCase();
                matchM = spainMunicipalities.find(m => searchTarget.includes(m.name.toLowerCase()) || m.name.toLowerCase().includes(searchTarget));
            }
            if (matchM) {
                setSelectedMunicipalityId(String(matchM.id));
            }
        }
    }, [editMode, selectedRegionId, spainMunicipalities, profile, selectedMunicipalityId]);

    // Nuevos estados
    const [showNotificationSettings, setShowNotificationSettings] = useState(false);
    const [isEditingNotifications, setIsEditingNotifications] = useState(false);
    
    const [showPrivacySettings, setShowPrivacySettings] = useState(false);
    const [isEditingPrivacy, setIsEditingPrivacy] = useState(false);
    
    const [showContactModal, setShowContactModal] = useState(false);
    const [contactMessage, setContactMessage] = useState('');
    const [isSendingContact, setIsSendingContact] = useState(false);

    // States and handler for transfer
    const [transferMode, setTransferMode] = useState(false);
    const [transferAmount, setTransferAmount] = useState('');
    const [isTransferring, setIsTransferring] = useState(false);

    const handleTransferSubmit = async () => {
        const amtStr = transferAmount.trim();
        if (!amtStr) return;
        const amount = parseFloat(amtStr.replace(',', '.'));
        if (isNaN(amount) || amount <= 0) {
            alert("Monto inválido. Introduce una cantidad mayor que cero.");
            return;
        }

        const maxAvailable = Number(profile.earningsBalance || profile.earnings_balance || 0);
        if (amount > maxAvailable) {
            alert("Saldo insuficiente en cartera.");
            return;
        }

        setIsTransferring(true);
        try {
            const res = await fetch('/api/voz/wallet/transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    handle: profile.handle,
                    userId: profile.id,
                    amount: amount
                })
            });
            const data = await res.json();
            if (data.success) {
                alert(`¡Se han transferido ${amount.toFixed(2).replace('.', ',')} monedas a tu saldo de compras exitosamente!`);
                const updatedUser = {
                    ...profile,
                    earnings_balance: data.newEarnings,
                    earningsBalance: data.newEarnings,
                    wallet_balance: data.newWallet,
                    walletBalance: data.newWallet
                };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                updateUser(updatedUser);
                setTransferMode(false);
                setTransferAmount('');
            } else {
                alert(data.error || "Error al realizar la transferencia.");
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión al procesar la transferencia.");
        } finally {
            setIsTransferring(false);
        }
    };

    if (!isOpen || !profile) return null;

    const handleEdit = (mode: 'name' | 'bio' | 'live_url' | 'country') => {
        setEditMode(mode);
        if (mode === 'name') setEditText(profile.handle || '');
        if (mode === 'bio') setEditText(profile.bio || '');
        if (mode === 'country') {
            const currentC = typeof profile.country === 'string' ? profile.country : (profile.country?.name || 'España');
            setEditCountry(currentC);
            setEditRegion(profile.region || '');
        }
        if (mode === 'live_url') {
            setEditKick(profile.live_url_kick || '');
            setEditTwitch(profile.live_url_twitch || '');
            setEditYoutube(profile.live_url_youtube || '');
            setIsDisclaimerAccepted(false);
        }
    };

    const saveEdit = async () => {
        setSaving(true);
        try {
            const body: any = { id: profile.id };
            
            if (editMode === 'name') body.handle = editText;
            if (editMode === 'bio') body.bio = editText;
            if (editMode === 'country') {
                if (editCountry !== 'España') {
                    alert('Actualmente la plataforma está disponible únicamente para usuarios ubicados en España.');
                    setSaving(false);
                    return;
                }

                const foundRegion = spainRegions.find(r => String(r.id) === String(selectedRegionId));
                const foundCity = spainMunicipalities.find(m => String(m.id) === String(selectedMunicipalityId));

                const regionName = foundRegion ? foundRegion.name : editRegion.trim();
                const cityName = foundCity ? foundCity.name : selectedCityName.trim();

                if (!regionName || !cityName) {
                    alert('Debes indicar obligatoriamente tu Comunidad Autónoma y Ciudad/Municipio en España (requerido para la segmentación de publicidad local).');
                    setSaving(false);
                    return;
                }

                body.country = { name: 'España', code: 'es' };
                body.region = regionName;
                body.city = cityName;
                body.location = `${cityName}, ${regionName}`;
                body.region_id = selectedRegionId ? parseInt(selectedRegionId) : (profile.region_id || null);
                body.municipality_id = selectedMunicipalityId ? parseInt(selectedMunicipalityId) : (profile.municipality_id || null);
            }
            if (editMode === 'live_url') {
                const kickVal = editKick.trim() || null;
                const twitchVal = editTwitch.trim() || null;
                const youtubeVal = editYoutube.trim() || null;
                body.live_url_kick = kickVal;
                body.live_url_twitch = twitchVal;
                body.live_url_youtube = youtubeVal;
                body.live_url = kickVal || twitchVal || youtubeVal || null;
            }

            const res = await fetch('/api/voz/users/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.success) {
                updateUser({ ...profile, ...body });
                window.location.reload();
            } else {
                alert('Error al guardar: ' + data.error);
            }
        } catch (e) {
            alert('Error de red');
        } finally {
            setSaving(false);
            setEditMode(null);
        }
    };

    const handleBuyPack = async (pack: any) => {
        setIsBuyingPack(true);
        try {
            const res = await fetch('/api/stripe/create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    packId: pack.id,
                    userId: profile.id,
                    userHandle: profile.handle || profile.name
                })
            });
            const data = await res.json();
            if (data.clientSecret && data.publishableKey) {
                setStripePromise(loadStripe(data.publishableKey));
                setClientSecret(data.clientSecret);
                setShowStripeCheckout(true);
                setIsBuyingPack(false);
            } else if (data.clientSecret) {
                // Fallback si por alguna razón publishableKey falla
                setStripePromise(loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''));
                setClientSecret(data.clientSecret);
                setShowStripeCheckout(true);
                setIsBuyingPack(false);
            } else if (data.url) {
                window.location.href = data.url;
            } else {
                alert(data.error || 'Error al iniciar la compra.');
                setIsBuyingPack(false);
            }
        } catch (e) {
            alert('Error de conexión.');
            setIsBuyingPack(false);
        }
    };

    const toggleNotificationSetting = async (key: string) => {
        const currentSettings = profile.notificationSettings || {};
        let currentValue = currentSettings[key];
        if (currentValue === undefined) currentValue = true;
        
        const newSettings = { ...currentSettings, [key]: !currentValue };
        updateUser({ ...profile, notificationSettings: newSettings });
        
        try {
            await fetch('/api/voz/users/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: profile.id, notificationSettings: newSettings })
            });
        } catch (e) {
            console.error("Error", e);
        }
    };

    const togglePrivacySetting = async (key: string) => {
        const currentSettings = profile.privacySettings || {};
        let currentValue = currentSettings[key];
        if (currentValue === undefined) currentValue = true;
        
        const newSettings = { ...currentSettings, [key]: !currentValue };
        updateUser({ ...profile, privacySettings: newSettings });
        
        try {
            await fetch('/api/voz/users/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: profile.id, privacySettings: newSettings })
            });
        } catch (e) {
            console.error("Error", e);
        }
    };

    const handleSendContactMessage = async () => {
        if (!contactMessage.trim()) {
            alert("Por favor escribe un mensaje antes de enviar.");
            return;
        }
        setIsSendingContact(true);
        try {
            const handle = profile.handle || profile.name;
            const res = await fetch('/api/voz/support', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userHandle: handle, message: contactMessage, isFromAdmin: false })
            });
            const data = await res.json();
            if (data.success) {
                alert("El equipo de VOZ ha recibido tu mensaje. Te responderemos pronto.");
                setShowContactModal(false);
                setContactMessage('');
            } else {
                alert("No se pudo enviar el mensaje.");
            }
        } catch (e) {
            alert("Error de conexión.");
        } finally {
            setIsSendingContact(false);
        }
    };

    const isVerified = profile.is_creator || profile.status === 'verified' || !!profile.stripeAccountId;
    const statusLabel = isVerified ? "Verificado" : "No Verificado";
    const statusColor = isVerified ? "#4CD964" : "gray";

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            zIndex: 9999,
            display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start',
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                width: '100%', maxWidth: '450px', height: '100vh', maxHeight: '100vh',
                backgroundColor: '#111',
                borderRadius: '20px 0 0 20px',
                display: 'flex', flexDirection: 'column',
                boxShadow: '-5px 0 25px rgba(0,0,0,0.5)'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '20px', borderBottom: '1px solid #333'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'white' }}>Configuración</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
                </div>

                {/* Body */}
                <div style={{ padding: '20px', overflowY: 'auto' }}>
                    {/* Cuenta */}
                    <div style={{ marginBottom: '30px' }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', textTransform: 'uppercase', marginBottom: '10px' }}>Cuenta</h3>
                        <div style={{ backgroundColor: '#222', borderRadius: '15px', padding: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #333' }}>
                                <div>
                                    <div style={{ color: 'white', fontWeight: 'bold' }}>Usuario</div>
                                    <div style={{ color: '#aaa', fontSize: '0.9rem' }}>{profile.handle || profile.name}</div>
                                </div>
                                <button onClick={() => handleEdit('name')} style={{ backgroundColor: 'rgba(142, 45, 226, 0.15)', color: '#8E2DE2', padding: '5px 15px', borderRadius: '15px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Editar</button>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #333' }}>
                                <div style={{ flex: 1, marginRight: '10px' }}>
                                    <div style={{ color: 'white', fontWeight: 'bold' }}>Bio</div>
                                    <div style={{ color: '#aaa', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.bio || 'Sin biografía'}</div>
                                </div>
                                <button onClick={() => handleEdit('bio')} style={{ backgroundColor: 'rgba(142, 45, 226, 0.15)', color: '#8E2DE2', padding: '5px 15px', borderRadius: '15px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Editar</button>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #333' }}>
                                <div style={{ flex: 1, marginRight: '10px' }}>
                                    <div style={{ color: 'white', fontWeight: 'bold' }}>Transmisión en Directo</div>
                                    <div style={{ color: '#aaa', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.live_url || 'No configurado'}</div>
                                </div>
                                <button onClick={() => handleEdit('live_url')} style={{ backgroundColor: 'rgba(142, 45, 226, 0.15)', color: '#8E2DE2', padding: '5px 15px', borderRadius: '15px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Editar</button>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #333' }}>
                                <div style={{ flex: 1, marginRight: '10px' }}>
                                    <div style={{ color: 'white', fontWeight: 'bold' }}>País / Ubicación</div>
                                    <div style={{ color: '#aaa', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {profile.region || (typeof profile.country === 'string' ? profile.country : profile.country?.name) || 'España'}
                                    </div>
                                </div>
                                <button onClick={() => handleEdit('country')} style={{ backgroundColor: 'rgba(142, 45, 226, 0.15)', color: '#8E2DE2', padding: '5px 15px', borderRadius: '15px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Editar</button>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ color: 'white', fontWeight: 'bold' }}>Monetización</div>
                                <button onClick={() => { onClose(); router.push('/profile/monetization'); }} style={{ backgroundColor: 'rgba(142, 45, 226, 0.15)', color: '#8E2DE2', padding: '5px 15px', borderRadius: '15px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Editar</button>
                            </div>
                        </div>
                    </div>

                    {/* Sistema Económico */}
                    <div style={{ marginBottom: '30px' }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', textTransform: 'uppercase', marginBottom: '10px' }}>Sistema Económico</h3>
                        
                        <WalletWidget 
                            handle={profile?.handle || profile?.name}
                            initialWalletBalance={Number(profile.walletBalance || profile.wallet_balance || 0)}
                            initialEarningsBalance={Number(profile.earningsBalance || profile.earnings_balance || 0)}
                            initialPendingEscrowBalance={Number(profile.pendingEscrowBalance || 0)}
                            onRecargarClick={() => setShowCoinPacks(true)}
                            onTransferClick={() => setTransferMode(true)}
                            showTransferButton={!transferMode}
                        />

                        {transferMode && (
                            <div style={{ marginTop: '10px', backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '12px', border: '1px solid #4CD964' }}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
                                    <input 
                                        type="text" 
                                        placeholder="Cantidad (ej. 5,00)" 
                                        value={transferAmount}
                                        onChange={(e) => setTransferAmount(e.target.value)}
                                        style={{ flex: 1, backgroundColor: '#000', border: '1px solid #333', color: 'white', padding: '10px', borderRadius: '10px', outline: 'none', fontSize: '0.9rem' }}
                                    />
                                    <button 
                                        onClick={handleTransferSubmit}
                                        disabled={isTransferring}
                                        style={{ backgroundColor: '#4CD964', color: 'black', border: 'none', padding: '10px 15px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}
                                    >
                                        {isTransferring ? '...' : 'Pasar'}
                                    </button>
                                    <button 
                                        onClick={() => { setTransferMode(false); setTransferAmount(''); }}
                                        style={{ backgroundColor: '#333', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}
                                    >
                                        X
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Preferencias */}
                    <div style={{ marginBottom: '30px' }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', textTransform: 'uppercase', marginBottom: '10px' }}>Preferencias</h3>
                        <div style={{ backgroundColor: '#222', borderRadius: '15px', padding: '15px' }}>
                            <button onClick={() => setShowNotificationSettings(true)} style={{ width: '100%', background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #333' }}>
                                <div style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>🔔 Notificaciones</div>
                                <div style={{ color: '#888' }}>❯</div>
                            </button>
                            <button onClick={() => setShowPrivacySettings(true)} style={{ width: '100%', background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>🔒 Privacidad (Regalos, PMs)</div>
                                <div style={{ color: '#8E2DE2', fontWeight: 'bold' }}>Editar</div>
                            </button>
                        </div>
                    </div>

                    {/* Seguridad */}
                    <div style={{ marginBottom: '30px' }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', textTransform: 'uppercase', marginBottom: '10px' }}>Seguridad</h3>
                        <div style={{ backgroundColor: '#222', borderRadius: '15px', padding: '20px', display: 'flex', alignItems: 'center' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '20px', backgroundColor: isVerified ? 'rgba(76, 217, 100, 0.2)' : 'rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: '15px' }}>
                                {isVerified ? '✓' : '🛡️'}
                            </div>
                            <div style={{ color: 'white', fontWeight: 'bold' }}>{statusLabel}</div>
                        </div>
                    </div>

                    {/* Ayuda y Soporte */}
                    <div style={{ marginBottom: '30px' }}>
                        <h3 style={{ fontSize: '0.9rem', color: '#888', textTransform: 'uppercase', marginBottom: '10px' }}>Ayuda y Soporte</h3>
                        <button onClick={() => setShowContactModal(true)} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer' }}>
                            <div style={{ backgroundColor: '#222', borderRadius: '15px', padding: '15px', display: 'flex', alignItems: 'center' }}>
                                <div style={{ backgroundColor: 'rgba(142, 45, 226, 0.15)', padding: '10px', borderRadius: '12px', marginRight: '15px' }}>💬</div>
                                <div>
                                    <div style={{ color: 'white', fontWeight: 'bold' }}>Centro de Contacto</div>
                                    <div style={{ color: '#888', fontSize: '0.8rem' }}>Habla directamente con nuestro equipo interno</div>
                                </div>
                            </div>
                        </button>
                    </div>

                    {/* Eliminar y Cerrar sesión */}
                    <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <button onClick={() => confirm('¿Seguro que deseas eliminar tu cuenta permanentemente? Contacta con soporte para proceder.')} style={{ backgroundColor: 'rgba(255, 59, 48, 0.1)', color: '#FF3B30', padding: '15px', borderRadius: '15px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>Eliminar Cuenta Permanentemente</button>
                        <button onClick={() => { if(confirm('¿Seguro que quieres cerrar sesión?')) { onClose(); onLogout(); } }} style={{ backgroundColor: '#333', color: 'white', padding: '15px', borderRadius: '15px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>Cerrar sesión</button>
                    </div>
                </div>
            </div>

            {/* Sub-modal de Edición (Name, Bio, Live URL) */}
            {editMode && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 10000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div style={{ width: '90%', maxWidth: '385px', backgroundColor: '#222', borderRadius: '20px', padding: '20px' }}>
                        <h3 style={{ color: 'white', margin: '0 0 20px 0' }}>
                            Editar {editMode === 'name' ? 'Usuario' : editMode === 'bio' ? 'Bio' : editMode === 'country' ? 'País / Ubicación' : 'Transmisión en Directo'}
                        </h3>
                        {editMode === 'bio' && (
                            <textarea 
                                value={editText} 
                                onChange={(e) => setEditText(e.target.value)}
                                style={{ width: '100%', minHeight: '100px', backgroundColor: '#111', color: 'white', border: '1px solid #444', borderRadius: '10px', padding: '10px', fontSize: '1rem', marginBottom: '20px' }}
                            />
                        )}
                        {editMode === 'name' && (
                            <input 
                                type="text"
                                value={editText} 
                                onChange={(e) => setEditText(e.target.value)}
                                style={{ width: '100%', height: '40px', backgroundColor: '#111', color: 'white', border: '1px solid #444', borderRadius: '10px', padding: '10px', fontSize: '1rem', marginBottom: '20px' }}
                            />
                        )}
                        {editMode === 'live_url' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0' }}>
                                    <input 
                                        type="checkbox" 
                                        id="disclaimer-chk"
                                        checked={isDisclaimerAccepted} 
                                        onChange={(e) => setIsDisclaimerAccepted(e.target.checked)}
                                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#8E2DE2' }}
                                    />
                                    <label htmlFor="disclaimer-chk" style={{ color: 'white', fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none' }}>
                                        Acepto la responsabilidad de los canales configurados
                                    </label>
                                </div>
                                <div style={{ opacity: isDisclaimerAccepted ? 1 : 0.4, pointerEvents: isDisclaimerAccepted ? 'auto' : 'none', display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
                                    <div>
                                        <div style={{ color: '#aaa', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '5px' }}>Canal Kick</div>
                                        <input 
                                            type="text"
                                            value={editKick}
                                            onChange={(e) => setEditKick(e.target.value)}
                                            placeholder="Ej: https://kick.com/mi-canal"
                                            disabled={!isDisclaimerAccepted}
                                            style={{ width: '100%', height: '40px', backgroundColor: '#111', color: 'white', border: '1px solid #444', borderRadius: '10px', padding: '10px', fontSize: '0.95rem' }}
                                        />
                                    </div>
                                    <div>
                                        <div style={{ color: '#aaa', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '5px' }}>Canal Twitch</div>
                                        <input 
                                            type="text"
                                            value={editTwitch}
                                            onChange={(e) => setEditTwitch(e.target.value)}
                                            placeholder="Ej: https://twitch.tv/mi-canal"
                                            disabled={!isDisclaimerAccepted}
                                            style={{ width: '100%', height: '40px', backgroundColor: '#111', color: 'white', border: '1px solid #444', borderRadius: '10px', padding: '10px', fontSize: '0.95rem' }}
                                        />
                                    </div>
                                    <div>
                                        <div style={{ color: '#aaa', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '5px' }}>Canal YouTube</div>
                                        <input 
                                            type="text"
                                            value={editYoutube}
                                            onChange={(e) => setEditYoutube(e.target.value)}
                                            placeholder="Ej: https://youtube.com/@mi-canal"
                                            disabled={!isDisclaimerAccepted}
                                            style={{ width: '100%', height: '40px', backgroundColor: '#111', color: 'white', border: '1px solid #444', borderRadius: '10px', padding: '10px', fontSize: '0.95rem' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                        {editMode === 'country' && (
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ color: '#aaa', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px' }}>
                                    País
                                </div>
                                <select 
                                    value={editCountry} 
                                    onChange={(e) => {
                                        if (e.target.value === 'España') {
                                            setEditCountry('España');
                                        } else {
                                            alert("Lanzamiento inicial disponible exclusivamente en España. Próximamente en más países.");
                                        }
                                    }}
                                    style={{ width: '100%', backgroundColor: '#111', color: 'white', border: '1px solid #444', borderRadius: '10px', padding: '10px', fontSize: '0.95rem', marginBottom: '15px' }}
                                >
                                    <option value="España">España</option>
                                    <option value="Estados Unidos" disabled style={{ color: '#666' }}>Estados Unidos 🔒</option>
                                    <option value="México" disabled style={{ color: '#666' }}>México 🔒</option>
                                    <option value="Argentina" disabled style={{ color: '#666' }}>Argentina 🔒</option>
                                    <option value="Colombia" disabled style={{ color: '#666' }}>Colombia 🔒</option>
                                    <option value="Chile" disabled style={{ color: '#666' }}>Chile 🔒</option>
                                    <option value="Perú" disabled style={{ color: '#666' }}>Perú 🔒</option>
                                    <option value="Venezuela" disabled style={{ color: '#666' }}>Venezuela 🔒</option>
                                    <option value="Ecuador" disabled style={{ color: '#666' }}>Ecuador 🔒</option>
                                    <option value="Guatemala" disabled style={{ color: '#666' }}>Guatemala 🔒</option>
                                    <option value="Cuba" disabled style={{ color: '#666' }}>Cuba 🔒</option>
                                    <option value="República Dominicana" disabled style={{ color: '#666' }}>República Dominicana 🔒</option>
                                    <option value="Brasil" disabled style={{ color: '#666' }}>Brasil 🔒</option>
                                    <option value="Francia" disabled style={{ color: '#666' }}>Francia 🔒</option>
                                    <option value="Italia" disabled style={{ color: '#666' }}>Italia 🔒</option>
                                    <option value="Alemania" disabled style={{ color: '#666' }}>Alemania 🔒</option>
                                    <option value="Reino Unido" disabled style={{ color: '#666' }}>Reino Unido 🔒</option>
                                    <option value="Portugal" disabled style={{ color: '#666' }}>Portugal 🔒</option>
                                </select>

                                {/* Selección OBLIGATORIA de Comunidad Autónoma / Región */}
                                <div style={{ color: '#aaa', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '6px' }}>
                                    Comunidad Autónoma / Región *
                                </div>
                                <select
                                    value={selectedRegionId}
                                    onChange={(e) => {
                                        setSelectedRegionId(e.target.value);
                                        setSelectedMunicipalityId('');
                                    }}
                                    style={{ width: '100%', backgroundColor: '#111', color: 'white', border: '1px solid #444', borderRadius: '10px', padding: '10px', fontSize: '0.95rem', marginBottom: '15px' }}
                                >
                                    <option value="">-- Selecciona tu Comunidad Autónoma --</option>
                                    {spainRegions.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>

                                {/* Selección OBLIGATORIA de Ciudad / Municipio */}
                                <div style={{ color: '#aaa', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '6px' }}>
                                    Ciudad / Municipio / Localidad *
                                </div>
                                <select
                                    value={selectedMunicipalityId}
                                    onChange={(e) => setSelectedMunicipalityId(e.target.value)}
                                    disabled={!selectedRegionId || spainMunicipalities.length === 0}
                                    style={{ width: '100%', backgroundColor: '#111', color: 'white', border: '1px solid #8E2DE2', borderRadius: '10px', padding: '10px', fontSize: '0.95rem', opacity: selectedRegionId ? 1 : 0.5 }}
                                >
                                    <option value="">-- Selecciona tu Ciudad / Municipio --</option>
                                    {spainMunicipalities.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => setEditMode(null)} style={{ flex: 1, backgroundColor: '#333', color: 'white', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}>Cancelar</button>
                            <button onClick={saveEdit} disabled={saving || (editMode === 'live_url' && !isDisclaimerAccepted)} style={{ flex: 1, backgroundColor: '#8E2DE2', color: 'white', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer', opacity: (editMode === 'live_url' && !isDisclaimerAccepted) ? 0.5 : 1 }}>{saving ? 'Guardando...' : 'Guardar'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sub-modal Tienda de Monedas */}
            {showCoinPacks && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 10000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div style={{ width: '90%', maxWidth: '350px', maxHeight: '80vh', backgroundColor: '#000', borderRadius: '20px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #333' }}>
                            <h3 style={{ color: 'white', margin: 0 }}>Tienda de Monedas</h3>
                            <button onClick={() => setShowCoinPacks(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
                        </div>
                        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {COIN_PACKS.map(pack => (
                                <button 
                                    key={pack.id} 
                                    onClick={() => handleBuyPack(pack)}
                                    disabled={isBuyingPack}
                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', padding: '15px', borderRadius: '15px', border: 'none', cursor: isBuyingPack ? 'default' : 'pointer', textAlign: 'left', opacity: isBuyingPack ? 0.6 : 1 }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <div style={{ backgroundColor: 'rgba(142, 45, 226, 0.1)', padding: '10px', borderRadius: '12px', marginRight: '15px', fontSize: '1.2rem' }}>
                                            {pack.coins === 500 ? '💎' : '💳'}
                                        </div>
                                        <div>
                                            <div style={{ color: 'white', fontWeight: 'bold' }}>{pack.name}</div>
                                            <div style={{ color: 'gray', fontSize: '0.8rem' }}>{pack.coins} Monedas VOZ</div>
                                        </div>
                                    </div>
                                    <div style={{ color: '#8E2DE2', fontWeight: 'bold', fontSize: '1.1rem' }}>{pack.price}€</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {/* Sub-modal Notificaciones */}
            {showNotificationSettings && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 10000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div style={{ width: '90%', maxWidth: '400px', maxHeight: '80vh', backgroundColor: '#000', borderRadius: '20px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #333' }}>
                            <h3 style={{ color: 'white', margin: 0 }}>Notificaciones</h3>
                            <button onClick={() => setShowNotificationSettings(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', backgroundColor: '#111' }}>
                            <span style={{ color: 'gray', fontSize: '0.9rem' }}>Personaliza cómo quieres recibir avisos</span>
                            <button onClick={() => setIsEditingNotifications(!isEditingNotifications)} style={{ backgroundColor: isEditingNotifications ? '#8E2DE2' : 'rgba(255,255,255,0.1)', color: 'white', padding: '5px 15px', borderRadius: '15px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}>
                                {isEditingNotifications ? "Listo" : "Editar"}
                            </button>
                        </div>
                        <div style={{ padding: '0 20px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                            {[
                                { key: 'notify_comments', label: 'Comentarios en mis audios', icon: '💬' },
                                { key: 'notify_replies', label: 'Respuestas a mis comentarios', icon: '↪️' },
                                { key: 'notify_pms', label: 'Mensajes directos', icon: '🔔' },
                                { key: 'notify_donations', label: 'Donaciones recibidas', icon: '🎁' },
                                { key: 'notify_gifts', label: 'Regalos y detalles', icon: '❤️' },
                                { key: 'notify_likes', label: 'Likes en mis vídeos', icon: '❤️' },
                                { key: 'notify_followers', label: 'Nuevos seguidores', icon: '✔️' },
                                { key: 'notify_live', label: 'Directos de creadores que sigues', icon: '▶️' },
                                { key: 'notify_balance', label: 'Estado de transacciones', icon: '💰' },
                                { key: 'notify_strikes', label: 'Avisos de moderación / Strikes', icon: '🛡️' },
                                { key: 'notify_system', label: 'Alertas de la aplicación', icon: '⚙️' }
                            ].map((item, idx, arr) => {
                                let isEnabled = (profile.notificationSettings || {})[item.key];
                                if (isEnabled === undefined) isEnabled = true;
                                return (
                                    <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: idx === arr.length - 1 ? 'none' : '1px solid #222' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', flex: 1, opacity: isEditingNotifications ? 1 : 0.6 }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '18px', backgroundColor: 'rgba(142, 45, 226, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: '12px' }}>{item.icon}</div>
                                            <span style={{ color: 'white', fontSize: '0.9rem' }}>{item.label}</span>
                                        </div>
                                        {isEditingNotifications ? (
                                            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                                <input type="checkbox" checked={isEnabled} onChange={() => toggleNotificationSetting(item.key)} style={{ accentColor: '#8E2DE2', width: '20px', height: '20px' }} />
                                            </label>
                                        ) : (
                                            <span style={{ color: isEnabled ? '#4CD964' : 'gray', fontSize: '0.8rem', fontWeight: 'bold' }}>{isEnabled ? "Activado" : "Desactivado"}</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Sub-modal Privacidad */}
            {showPrivacySettings && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 10000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div style={{ width: '90%', maxWidth: '400px', maxHeight: '80vh', backgroundColor: '#000', borderRadius: '20px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #333' }}>
                            <h3 style={{ color: 'white', margin: 0 }}>Privacidad</h3>
                            <button onClick={() => setShowPrivacySettings(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', backgroundColor: '#111' }}>
                            <span style={{ color: 'gray', fontSize: '0.9rem' }}>Gestiona tu visibilidad y configuración</span>
                            <button onClick={() => setIsEditingPrivacy(!isEditingPrivacy)} style={{ backgroundColor: isEditingPrivacy ? '#8E2DE2' : 'rgba(255,255,255,0.1)', color: 'white', padding: '5px 15px', borderRadius: '15px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}>
                                {isEditingPrivacy ? "Listo" : "Editar"}
                            </button>
                        </div>
                        <div style={{ padding: '0 20px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                            {[
                                { key: 'receive_pms', label: 'Recibir mensajes privados', icon: '💬' },
                                { key: 'charge_pms', label: 'Cobrar por PMs (5 monedas)', icon: '💰', requiresStripe: true },
                                { key: 'receive_gifts', label: 'Recibir regalos', icon: '🎁', requiresStripe: true },
                                { key: 'receive_donations', label: 'Recibir donaciones', icon: '💸', requiresStripe: true }
                            ].map((item, idx, arr) => {
                                const isStripeRegistered = !!profile?.stripeAccountId;
                                let isEnabled = (profile.privacySettings || {})[item.key];
                                if (isEnabled === undefined) {
                                    isEnabled = item.key === 'charge_pms' ? false : true;
                                }
                                if (item.requiresStripe && !isStripeRegistered) isEnabled = false;

                                return (
                                    <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: idx === arr.length - 1 ? 'none' : '1px solid #222' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', flex: 1, opacity: isEditingPrivacy ? 1 : 0.6 }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '18px', backgroundColor: 'rgba(142, 45, 226, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: '12px' }}>{item.icon}</div>
                                            <span style={{ color: 'white', fontSize: '0.9rem' }}>{item.label}</span>
                                        </div>
                                        {isEditingPrivacy ? (
                                            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={isEnabled} 
                                                    onChange={() => {
                                                        if (item.requiresStripe && !isStripeRegistered) {
                                                            alert("Requiere Registro en Stripe. Ve a la sección de Monetización.");
                                                            return;
                                                        }
                                                        togglePrivacySetting(item.key);
                                                    }} 
                                                    style={{ accentColor: '#8E2DE2', width: '20px', height: '20px' }} 
                                                />
                                            </label>
                                        ) : (
                                            <span style={{ color: isEnabled ? '#4CD964' : 'gray', fontSize: '0.8rem', fontWeight: 'bold' }}>{isEnabled ? "Activado" : "Desactivado"}</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Sub-modal Contacto */}
            {showContactModal && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 10000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div style={{ width: '90%', maxWidth: '400px', backgroundColor: '#000', borderRadius: '20px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #333' }}>
                            <h3 style={{ color: 'white', margin: 0 }}>Centro de Contacto V.O.Z</h3>
                            <button onClick={() => setShowContactModal(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <p style={{ color: 'gray', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.4' }}>
                                Estamos aquí para ayudarte. Si tienes algún problema con tu cuenta, sugerencias o dudas, déjanos un mensaje y te contestaremos pronto en tu pestaña de Actividad.
                            </p>
                            <textarea 
                                value={contactMessage}
                                onChange={(e) => setContactMessage(e.target.value)}
                                placeholder="Escribe tu consulta aquí..."
                                style={{ width: '100%', height: '150px', backgroundColor: '#111', color: 'white', border: '1px solid #444', borderRadius: '15px', padding: '15px', fontSize: '1rem', marginBottom: '20px', resize: 'none', outline: 'none' }}
                                onFocus={(e) => (e.target as any).style.borderColor = '#8E2DE2'}
                                onBlur={(e) => (e.target as any).style.borderColor = '#444'}
                            />
                            <button 
                                onClick={handleSendContactMessage}
                                disabled={isSendingContact}
                                style={{ width: '100%', backgroundColor: '#8E2DE2', color: 'white', border: 'none', padding: '15px', borderRadius: '15px', fontWeight: 'bold', fontSize: '1rem', cursor: isSendingContact ? 'default' : 'pointer', opacity: isSendingContact ? 0.6 : 1 }}
                            >
                                {isSendingContact ? 'Enviando...' : 'Enviar Mensaje a VOZ'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sub-modal Stripe Checkout */}
            {showStripeCheckout && clientSecret && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 11000,
                    display: 'flex', flexDirection: 'column', alignItems: 'center'
                }}>
                    <div style={{ width: '100%', maxWidth: '500px', display: 'flex', justifyContent: 'flex-end', padding: '15px' }}>
                        <button onClick={() => { setShowStripeCheckout(false); setClientSecret(null); }} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
                    </div>
                    <div style={{ width: '100%', maxWidth: '500px', flex: 1, overflowY: 'auto', padding: '0 10px 20px 10px', borderRadius: '15px' }}>
                        <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
                            <EmbeddedCheckout />
                        </EmbeddedCheckoutProvider>
                    </div>
                </div>
            )}
        </div>
    );
}
