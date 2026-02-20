'use client';
import React, { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import '98.css';

export default function VozAdsPage() {
    const [activeTab, setActiveTab] = useState<'campaigns' | 'clients' | 'impressions'>('campaigns');
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form states for new client
    const [newClientName, setNewClientName] = useState('');
    const [newClientLegalName, setNewClientLegalName] = useState('');
    const [newClientTaxId, setNewClientTaxId] = useState('');
    const [newClientEmail, setNewClientEmail] = useState('');
    const [newClientAddress, setNewClientAddress] = useState('');
    const [newClientCity, setNewClientCity] = useState('');
    const [newClientZip, setNewClientZip] = useState('');
    const [newClientCountry, setNewClientCountry] = useState('');
    const [newClientPhone, setNewClientPhone] = useState('');

    // Form states for new campaign
    const [showCampaignModal, setShowCampaignModal] = useState(false);
    const [newCampaignName, setNewCampaignName] = useState('');
    const [selectedCompanyId, setSelectedCompanyId] = useState('');
    const [newCampaignVideoUrl, setNewCampaignVideoUrl] = useState('');
    const [newCampaignStartDate, setNewCampaignStartDate] = useState('');
    const [newCampaignEndDate, setNewCampaignEndDate] = useState('');
    const [newCampaignForceView, setNewCampaignForceView] = useState(true);
    const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [selectedImpressionId, setSelectedImpressionId] = useState<string | null>(null);

    // Dialog state
    const [dialog, setDialog] = useState<{
        show: boolean;
        title: string;
        message: string;
        type: 'confirm' | 'alert';
        onConfirm?: () => void;
    }>({ show: false, title: '', message: '', type: 'alert' });

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSelectedImpressionId(null);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const showAlert = (message: string, title: string = 'Aviso') => {
        setDialog({ show: true, title, message, type: 'alert' });
    };

    const showConfirm = (message: string, onConfirm: () => void, title: string = 'Confirmación') => {
        setDialog({ show: true, title, message, type: 'confirm', onConfirm });
    };

    const fetchData = () => {
        setLoading(true);
        Promise.all([
            fetch('/api/voz/campaigns').then(res => res.json()),
            fetch('/api/voz/companies').then(res => res.json())
        ]).then(([campaignsData, companiesData]) => {
            const camps = Array.isArray(campaignsData) ? campaignsData : [];
            const comps = Array.isArray(companiesData) ? companiesData : [];
            setCampaigns(camps);
            setCompanies(comps);
            if (comps.length > 0 && !selectedCompanyId) {
                setSelectedCompanyId(comps[0].id);
            }
        }).catch(err => {
            console.error("Error fetching Ads data:", err);
            showAlert("Error al cargar datos de publicidad. Reintenta.", "Error de Red");
        }).finally(() => {
            setLoading(false);
        });
    };

    const handleCreateClient = (e: FormEvent) => {
        e.preventDefault();
        if (!newClientName || !newClientTaxId) return;

        fetch('/api/voz/companies', {
            method: 'POST',
            body: JSON.stringify({
                name: newClientName,
                legalName: newClientLegalName || newClientName,
                taxId: newClientTaxId,
                contactEmail: newClientEmail,
                address: newClientAddress,
                city: newClientCity,
                zip: newClientZip,
                country: newClientCountry,
                phone: newClientPhone,
                balance: 0
            }),
            headers: { 'Content-Type': 'application/json' }
        })
            .then(res => res.json())
            .then(newCompany => {
                setCompanies([...companies, newCompany]);
                setNewClientName('');
                setNewClientLegalName('');
                setNewClientTaxId('');
                setNewClientEmail('');
                setNewClientAddress('');
                setNewClientCity('');
                setNewClientZip('');
                setNewClientCountry('');
                setNewClientPhone('');
                // If it's the first company, select it
                if (companies.length === 0) {
                    setSelectedCompanyId(newCompany.id);
                }
            });
    };

    const handleNewCampaign = () => {
        if (companies.length === 0) {
            showAlert("¡Primero registra una empresa en Clientes!", "Faltan Clientes");
            return;
        }
        setNewCampaignName('');
        setNewCampaignVideoUrl('');
        setNewCampaignStartDate(new Date().toISOString().split('T')[0]);
        setNewCampaignEndDate('');
        setNewCampaignForceView(true);
        setSelectedVideoFile(null);
        setShowCampaignModal(true);
    };

    const handleSaveCampaign = async (e: FormEvent) => {
        e.preventDefault();
        if (!newCampaignName || !selectedCompanyId) return;
        if (!selectedVideoFile && !newCampaignVideoUrl) {
            showAlert("Debes subir un video o proporcionar una URL.", "Faltan Medios");
            return;
        }

        let finalVideoUrl = newCampaignVideoUrl;

        // Upload if file selected
        if (selectedVideoFile) {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', selectedVideoFile);

            try {
                const uploadRes = await fetch('/api/media/upload', {
                    method: 'POST',
                    body: formData
                });
                const uploadData = await uploadRes.json();
                if (uploadData.success) {
                    finalVideoUrl = uploadData.url;
                } else {
                    showAlert("Error al subir el video: " + uploadData.error, "Error de Carga");
                    setUploading(false);
                    return;
                }
            } catch (err) {
                showAlert("Error de conexión durante la subida.", "Error");
                setUploading(false);
                return;
            }
        }

        fetch('/api/voz/campaigns', {
            method: 'POST',
            body: JSON.stringify({
                name: newCampaignName,
                companyId: selectedCompanyId,
                budget: 1000,
                type: 'video',
                videoUrl: finalVideoUrl,
                startDate: newCampaignStartDate,
                endDate: newCampaignEndDate,
                forceView: newCampaignForceView,
                target: 'all'
            }),
            headers: { 'Content-Type': 'application/json' }
        })
            .then(res => res.json())
            .then(newCamp => {
                setCampaigns([...campaigns, newCamp]);
                setShowCampaignModal(false);
                setSelectedVideoFile(null);
            })
            .finally(() => setUploading(false));
    };

    const handleDeleteCampaign = (id: string) => {
        showConfirm('¿Seguro que quieres borrar esta campaña?', () => {
            fetch(`/api/voz/campaigns?id=${id}`, { method: 'DELETE' })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setCampaigns(campaigns.filter(c => c.id !== id));
                    }
                });
        }, 'Borrar Campaña');
    };

    const handleDeleteClient = (id: string) => {
        const hasCampaigns = campaigns.some(c => c.companyId === id);
        if (hasCampaigns) {
            showAlert('No se puede borrar un cliente con campañas activas. Borra primero sus campañas.', 'Error de Integridad');
            return;
        }

        showConfirm('¿Seguro que quieres borrar este cliente?', () => {
            fetch(`/api/voz/companies?id=${id}`, { method: 'DELETE' })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setCompanies(companies.filter(c => c.id !== id));
                    }
                });
        }, 'Borrar Cliente');
    };

    if (loading) return <div style={{ padding: 10, background: 'white', height: '100%' }}>⏳ Cargando AdManager de VOZ (Windows 98)...</div>;

    return (
        <div style={{ padding: 10, height: '85vh', display: 'flex', flexDirection: 'column' }}>
            <menu role="tablist" style={{ marginBottom: 10 }}>
                <button
                    role="tab"
                    aria-selected={activeTab === 'campaigns'}
                    onClick={() => setActiveTab('campaigns')}
                >
                    Campañas
                </button>
                <button
                    role="tab"
                    aria-selected={activeTab === 'clients'}
                    onClick={() => setActiveTab('clients')}
                >
                    Clientes (Empresas)
                </button>
                <button
                    role="tab"
                    aria-selected={activeTab === 'impressions'}
                    onClick={() => setActiveTab('impressions')}
                >
                    Impresiones 📊
                </button>
            </menu>

            {/* CAMPAIGNS TAB */}
            <div style={{ flex: 1, display: activeTab === 'campaigns' ? 'flex' : 'none', flexDirection: 'column' }}>
                <div className="field-row" style={{ marginBottom: 10 }}>
                    <button onClick={handleNewCampaign} style={{ fontWeight: 'bold' }}>📢 Nueva Campaña</button>
                    <button onClick={fetchData}>🔄 Refrescar</button>
                </div>

                <div className="sunken-panel" style={{ flex: 1, backgroundColor: 'white', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid black' }}>
                                <th>ID</th>
                                <th>Campaña</th>
                                <th>Empresa</th>
                                <th>Video</th>
                                <th>Periodo</th>
                                <th>Status</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {campaigns.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                                        No hay campañas activas. Pulsa en "Nueva Campaña" para empezar.
                                    </td>
                                </tr>
                            )}
                            {campaigns.map(c => (
                                <tr key={c.id}>
                                    <td>{c.id?.substring(0, 8)}</td>
                                    <td>{c.name}</td>
                                    <td>
                                        <span
                                            style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}
                                            onClick={() => setActiveTab('clients')}
                                        >
                                            {companies.find(comp => comp.id === c.companyId)?.name || 'Cargando...'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.8em', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {c.videoUrl ? '🔗 Video listo' : '❌ Sin Video'}
                                        </div>
                                        {c.forceView && <div style={{ fontSize: '0.7em', color: 'red', fontWeight: 'bold' }}>UNSKIPPABLE</div>}
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.8em' }}>{c.startDate || 'N/A'}</div>
                                        <div style={{ fontSize: '0.8em' }}>{c.endDate || 'N/A'}</div>
                                    </td>
                                    <td style={{ color: c.status === 'active' ? 'green' : 'gray' }}>{(c.status || 'draft').toUpperCase()}</td>
                                    <td>
                                        <button
                                            style={{ color: 'red', minWidth: 'auto', padding: '0 5px' }}
                                            onClick={() => handleDeleteCampaign(c.id)}
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* IMPRESSIONS TAB */}
            <div style={{ flex: 1, display: activeTab === 'impressions' ? 'flex' : 'none', flexDirection: 'column' }}>
                <div className="field-row" style={{ marginBottom: 10 }}>
                    <div className="status-bar" style={{ flex: 1, background: '#c0c0c0', padding: '2px 5px', border: '1px inset white' }}>
                        {selectedImpressionId
                            ? `Detalles de: ${campaigns.find(c => c.id === selectedImpressionId)?.name}`
                            : "Visualización de Impacto y Engagement por Campaña"}
                    </div>
                    <button onClick={() => { fetchData(); setSelectedImpressionId(null); }}>🔄 Refrescar</button>
                </div>

                <div className="sunken-panel" style={{ flex: 1, backgroundColor: 'white', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid black', position: 'sticky', top: 0, backgroundColor: '#c0c0c0', zIndex: 1 }}>
                                <th>Campaña</th>
                                <th>Cliente</th>
                                <th>Impresiones (Views)</th>
                                <th>Tipo de Ad</th>
                                <th>Mandatorio</th>
                                <th>CTR Estimado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {campaigns.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>No hay datos de impresiones todavía.</td>
                                </tr>
                            )}
                            {campaigns.sort((a, b) => (b.impressions || 0) - (a.impressions || 0)).map(c => {
                                const isSelected = selectedImpressionId === c.id;
                                return (
                                    <tr
                                        key={c.id}
                                        onClick={() => setSelectedImpressionId(isSelected ? null : c.id)}
                                        style={{
                                            backgroundColor: isSelected ? '#000080' : 'transparent',
                                            color: isSelected ? 'white' : 'black',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <td style={{ fontWeight: 'bold' }}>{c.name}</td>
                                        <td>{companies.find(comp => comp.id === c.companyId)?.name || 'N/A'}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{
                                                background: isSelected ? 'white' : '#000080',
                                                color: isSelected ? '#000080' : 'white',
                                                padding: '2px 8px',
                                                fontFamily: 'monospace',
                                                display: 'inline-block',
                                                borderRadius: 2,
                                                fontWeight: 'bold'
                                            }}>
                                                {String(c.impressions || 0).padStart(6, '0')}
                                            </div>
                                        </td>
                                        <td>{(c.type || 'video').toUpperCase()}</td>
                                        <td style={{ color: isSelected ? '#ffbaba' : (c.forceView ? 'red' : 'green'), fontWeight: isSelected ? 'bold' : 'normal' }}>
                                            {c.forceView ? 'SÍ (Unskippable)' : 'NO'}
                                        </td>
                                        <td>
                                            {((c.impressions || 0) > 0) ? (c.forceView ? '100%' : '65%') : '0%'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="status-bar" style={{ marginTop: 10 }}>
                    {selectedImpressionId ? (
                        <>
                            <p className="status-bar-field">Budget: {campaigns.find(c => c.id === selectedImpressionId)?.budget}€</p>
                            <p className="status-bar-field">ID: {selectedImpressionId.substring(0, 8)}</p>
                            <p className="status-bar-field">Status: {campaigns.find(c => c.id === selectedImpressionId)?.status?.toUpperCase()}</p>
                            <p className="status-bar-field" style={{ flex: 1, textAlign: 'right' }}>Presione ESC o haga clic de nuevo para deseleccionar</p>
                        </>
                    ) : (
                        <>
                            <p className="status-bar-field">Total Campañas: {campaigns.length}</p>
                            <p className="status-bar-field">Total Impactos: {campaigns.reduce((sum, c) => sum + (c.impressions || 0), 0)}</p>
                            <p className="status-bar-field">Sistema de Seguimiento VOZ Shield v2.4</p>
                        </>
                    )}
                </div>
            </div>

            {/* CLIENTS TAB */}
            <div style={{ flex: 1, display: activeTab === 'clients' ? 'flex' : 'none', flexDirection: 'column' }}>
                <fieldset style={{ marginBottom: 15 }}>
                    <legend>Registrar Nuevo Cliente</legend>
                    <form onSubmit={handleCreateClient}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <div className="field-row-stacked" style={{ marginBottom: 8 }}>
                                    <label>Nombre Comercial:</label>
                                    <input
                                        type="text"
                                        value={newClientName}
                                        onChange={e => setNewClientName(e.target.value)}
                                        placeholder="Ej: Sony Music"
                                    />
                                </div>
                                <div className="field-row-stacked" style={{ marginBottom: 8 }}>
                                    <label>Razón Social:</label>
                                    <input
                                        type="text"
                                        value={newClientLegalName}
                                        onChange={e => setNewClientLegalName(e.target.value)}
                                        placeholder="Ej: Sony Music Entertainment Spain S.A."
                                    />
                                </div>
                                <div className="field-row-stacked" style={{ marginBottom: 8 }}>
                                    <label>CIF / Tax ID:</label>
                                    <input
                                        type="text"
                                        value={newClientTaxId}
                                        onChange={e => setNewClientTaxId(e.target.value)}
                                        placeholder="Ej: B12345678"
                                    />
                                </div>
                                <div className="field-row-stacked" style={{ marginBottom: 8 }}>
                                    <label>Email de Facturación:</label>
                                    <input
                                        type="email"
                                        value={newClientEmail}
                                        onChange={e => setNewClientEmail(e.target.value)}
                                        placeholder="billing@empresa.com"
                                    />
                                </div>
                                <div className="field-row-stacked" style={{ marginBottom: 8 }}>
                                    <label>Teléfono:</label>
                                    <input
                                        type="text"
                                        value={newClientPhone}
                                        onChange={e => setNewClientPhone(e.target.value)}
                                        placeholder="+34 ..."
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="field-row-stacked" style={{ marginBottom: 8 }}>
                                    <label>Dirección:</label>
                                    <input
                                        type="text"
                                        value={newClientAddress}
                                        onChange={e => setNewClientAddress(e.target.value)}
                                        placeholder="Calle, Número, Piso..."
                                    />
                                </div>
                                <div className="field-row-stacked" style={{ marginBottom: 8 }}>
                                    <label>Ciudad:</label>
                                    <input
                                        type="text"
                                        value={newClientCity}
                                        onChange={e => setNewClientCity(e.target.value)}
                                        placeholder="Ej: Madrid"
                                    />
                                </div>
                                <div className="field-row-stacked" style={{ marginBottom: 8 }}>
                                    <label>Código Postal:</label>
                                    <input
                                        type="text"
                                        value={newClientZip}
                                        onChange={e => setNewClientZip(e.target.value)}
                                        placeholder="Ej: 28001"
                                    />
                                </div>
                                <div className="field-row-stacked" style={{ marginBottom: 8 }}>
                                    <label>País / Provincia:</label>
                                    <input
                                        type="text"
                                        value={newClientCountry}
                                        onChange={e => setNewClientCountry(e.target.value)}
                                        placeholder="Ej: España"
                                    />
                                </div>
                                <div style={{ marginTop: '25px', textAlign: 'right' }}>
                                    <button type="submit" style={{ width: '100%', height: '35px', fontWeight: 'bold' }}>💾 GUARDAR CLIENTE (LISTO PARA FACTURAR)</button>
                                </div>
                            </div>
                        </div>
                    </form>
                </fieldset>

                <div className="sunken-panel" style={{ flex: 1, backgroundColor: 'white', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid black' }}>
                                <th>Compañía / Razón Social</th>
                                <th>Tax ID</th>
                                <th>Dirección / Ubicación</th>
                                <th>Contacto</th>
                                <th>Balance</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {companies.map(comp => (
                                <tr key={comp.id}>
                                    <td>
                                        <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{comp.name}</div>
                                        <div style={{ fontSize: '0.9em', color: '#333' }}>{comp.legalName || comp.name}</div>
                                    </td>
                                    <td>{comp.taxId}</td>
                                    <td>
                                        <div style={{ fontSize: '0.95em', marginBottom: '1px' }}>{comp.address || '-'}</div>
                                        <div style={{ fontSize: '0.9em', color: '#444' }}>{comp.city} {comp.zip}, {comp.country}</div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.95em', marginBottom: '1px' }}>{comp.contactEmail}</div>
                                        <div style={{ fontSize: '0.9em', color: '#444' }}>{comp.phone}</div>
                                    </td>
                                    <td style={{ fontWeight: 'bold' }}>{comp.balance} €</td>
                                    <td>
                                        <div className="field-row">
                                            <button
                                                style={{ minWidth: 'auto', padding: '0 5px' }}
                                                onClick={() => showAlert('Función de Facturación en 1-Click próximamente...', 'Facturar')}
                                            >
                                                📑
                                            </button>
                                            <button
                                                style={{ color: 'red', minWidth: 'auto', padding: '0 5px' }}
                                                onClick={() => handleDeleteClient(comp.id)}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )).reverse()}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODALS & DIALOGS (OUTSIDE CONDITIONAL TABS) */}
            {showCampaignModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000
                }}>
                    <div className="window" style={{ width: '350px' }}>
                        <div className="title-bar">
                            <div className="title-bar-text">🏆 Nueva Campaña Publicitaria</div>
                            <div className="title-bar-controls">
                                <button aria-label="Close" onClick={() => setShowCampaignModal(false)}></button>
                            </div>
                        </div>
                        <div className="window-body">
                            <form onSubmit={handleSaveCampaign}>
                                <div className="field-row-stacked" style={{ marginBottom: 12 }}>
                                    <label>Nombre de la Campaña:</label>
                                    <input
                                        type="text"
                                        value={newCampaignName}
                                        onChange={e => setNewCampaignName(e.target.value)}
                                        placeholder="Ej: Promo Verano 2024"
                                        autoFocus
                                    />
                                </div>
                                <div className="field-row-stacked" style={{ marginBottom: 12 }}>
                                    <label>Seleccionar Cliente:</label>
                                    <select
                                        value={selectedCompanyId}
                                        onChange={e => setSelectedCompanyId(e.target.value)}
                                        style={{ width: '100%' }}
                                    >
                                        {companies.map(comp => (
                                            <option key={comp.id} value={comp.id}>
                                                {comp.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="field-row-stacked" style={{ marginBottom: 12 }}>
                                    <label>Video Publicitario (Subir Archivo):</label>
                                    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                                        <input
                                            type="file"
                                            accept="video/*"
                                            onChange={e => setSelectedVideoFile(e.target.files?.[0] || null)}
                                            style={{ flex: 1 }}
                                        />
                                    </div>
                                    {selectedVideoFile && (
                                        <div style={{ fontSize: '0.8em', marginTop: 4, color: 'blue' }}>
                                            📄 {selectedVideoFile.name} ({(selectedVideoFile.size / 1024 / 1024).toFixed(2)} MB)
                                        </div>
                                    )}
                                </div>
                                <div className="field-row-stacked" style={{ marginBottom: 12 }}>
                                    <label>O URL del Video (opcional si subes):</label>
                                    <input
                                        type="text"
                                        value={newCampaignVideoUrl}
                                        onChange={e => setNewCampaignVideoUrl(e.target.value)}
                                        placeholder="https://... (mp4)"
                                        disabled={!!selectedVideoFile}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                                    <div className="field-row-stacked">
                                        <label>Fecha Inicio:</label>
                                        <input
                                            type="date"
                                            value={newCampaignStartDate}
                                            onChange={e => setNewCampaignStartDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="field-row-stacked">
                                        <label>Fecha Fin:</label>
                                        <input
                                            type="date"
                                            value={newCampaignEndDate}
                                            onChange={e => setNewCampaignEndDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="field-row">
                                    <input
                                        type="checkbox"
                                        id="forceView"
                                        checked={newCampaignForceView}
                                        onChange={e => setNewCampaignForceView(e.target.checked)}
                                    />
                                    <label htmlFor="forceView" style={{ color: 'red', fontWeight: 'bold' }}>
                                        ⚠️ Visión Obligatoria (Sin pausa/salto)
                                    </label>
                                </div>
                                <div className="field-row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 15 }}>
                                    <button disabled={uploading} onClick={() => setShowCampaignModal(false)}>Cancelar</button>
                                    <button type="submit" style={{ fontWeight: 'bold' }} disabled={uploading}>
                                        {uploading ? '⏳ Subiendo...' : '🚀 Lanzar Campaña'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {dialog.show && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div className="window" style={{ width: 320, boxShadow: '2px 2px 10px rgba(0,0,0,0.3)' }}>
                        <div className="title-bar">
                            <div className="title-bar-text">{dialog.title}</div>
                        </div>
                        <div className="window-body">
                            <p style={{ display: 'flex', alignItems: 'center', gap: 15, margin: '10px 0' }}>
                                <span style={{ fontSize: '32px' }}>{dialog.type === 'confirm' ? '❓' : '⚠️'}</span>
                                {dialog.message}
                            </p>
                            <div className="field-row" style={{ justifyContent: 'flex-end', marginTop: 20, gap: 10 }}>
                                {dialog.type === 'confirm' ? (
                                    <>
                                        <button
                                            style={{ minWidth: 60, fontWeight: 'bold' }}
                                            onClick={() => {
                                                dialog.onConfirm?.();
                                                setDialog({ ...dialog, show: false });
                                            }}
                                        >
                                            Sí
                                        </button>
                                        <button
                                            style={{ minWidth: 60 }}
                                            onClick={() => setDialog({ ...dialog, show: false })}
                                        >
                                            No
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        style={{ minWidth: 80 }}
                                        onClick={() => setDialog({ ...dialog, show: false })}
                                    >
                                        Aceptar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
