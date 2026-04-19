'use client';

import React, { useState, useEffect } from 'react';
import '98.css';

interface CreatorVerification {
    id: string;
    user_id: string;
    full_name: string;
    dni_number: string;
    dni_front_url?: string;
    dni_back_url?: string;
    iban: string;
    address?: string;
    postal_code?: string;
    country?: string;
    phone?: string;
    status: 'pending' | 'approved' | 'rejected';
    rejection_reason?: string;
    submitted_at: string;
    updated_at: string;
}

interface Creator {
    id: string;
    userHandle: string;
    realName: string;
    totalCoins: number;
    withdrawableCoins: number;
    earnedEuro: number;
    stats: {
        totalGifts: number;
        totalPMs: number;
        earnedFromGifts: number;
        earnedFromPMs: number;
    };
    paymentInfo?: {
        fullName: string;
        dni: string;
        iban: string;
        address: string;
        province: string;
        phone: string;
        email: string;
    };
    verification?: {
        dniFront: string;
        dniBack: string;
        verifiedAt?: string;
    };
    verificationData?: CreatorVerification;
    status: 'active' | 'under_review' | 'suspended' | 'deleted';
    joinedAt: string;
    isCreator?: boolean;
}

interface RedemptionRequest {
    id: string;
    creatorId: string;
    amountCoins: number;
    amountEuro: number;
    status: 'pending' | 'approved' | 'completed' | 'rejected';
    requestedAt: string;
}

export default function CreatorsPage() {
    const [creators, setCreators] = useState<Creator[]>([]);
    const [redemptions, setRedemptions] = useState<RedemptionRequest[]>([]);
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'folders' | 'details'>('folders');
    const [activeTab, setActiveTab] = useState('general');
    const [currentPath, setCurrentPath] = useState('C:\\Red\\VOZ\\Creadores');

    interface ModalConfig {
        show: boolean;
        title: string;
        message: string;
        type: 'alert' | 'confirm';
        onConfirm: (() => any) | null;
    }

    const [modal, setModal] = useState<ModalConfig>({ show: false, title: '', message: '', type: 'alert', onConfirm: null });

    const [rejectModal, setRejectModal] = useState<{show: boolean, userId: string}>({show: false, userId: ''});
    const [rejectReasons, setRejectReasons] = useState({
        dniFront: false, dniBack: false, fullName: false, dniNumber: false, iban: false, address: false, phone: false, other: ''
    });

    const showWin98Modal = (title: string, message: string, type: 'alert' | 'confirm' = 'alert', onConfirm: (() => any) | null = null) => {
        setModal({ show: true, title, message, type, onConfirm });
    };

    const fetchData = async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const [cRes, rRes, wRes] = await Promise.all([
                fetch('/api/voz/creators'),
                fetch('/api/voz/redemptions'),
                fetch('/api/voz/wallet/withdrawals?t=' + Date.now())
            ]);
            const cData = await cRes.json();
            const rData = await rRes.json();
            const wData = await wRes.json();
            
            setCreators(cData);
            setRedemptions(rData);
            if (wData.success) {
                setWithdrawals(wData.withdrawals);
            }

            if (selectedCreator) {
                const refreshed = cData.find((c: any) => c.id === selectedCreator.id);
                if (refreshed) setSelectedCreator(refreshed);
            }
        } catch (error) {
            console.error('Error fetching creator data:', error);
        } finally {
            if (!silent) setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleProcessVerification = async (userId: string, status: 'approved' | 'rejected', reason?: string) => {
        try {
            const response = await fetch('/api/voz/creators', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: userId, 
                    action: 'processVerification', 
                    status, 
                    reason 
                })
            });
            if (response.ok) {
                showWin98Modal('Éxito', status === 'approved' ? 'El usuario ha sido aprobado como creador.' : 'La solicitud ha sido rechazada.');
                fetchData(true);
                if (selectedCreator?.id === userId) setSelectedCreator(null);
            } else {
                showWin98Modal('Error', 'No se pudo procesar la verificación.');
            }
        } catch (error) {
            console.error('Error processing verification:', error);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!selectedCreator) return;
        try {
            const response = await fetch('/api/voz/creators', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selectedCreator.id, status: newStatus, employeeName: 'Admin' })
            });
            if (response.ok) {
                fetchData(true);
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleRedemptionStatusUpdate = async (redId: string, newStatus: string) => {
        try {
            const response = await fetch('/api/voz/redemptions', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: redId, status: newStatus })
            });
            if (response.ok) {
                fetchData(true);
            }
        } catch (error) {
            console.error('Error updating redemption status:', error);
        }
    };

    const isAtRoot = currentPath === 'C:\\Red\\VOZ\\Creadores';
    const displayedCreators = isAtRoot 
        ? creators.filter(c => c.isCreator || c.verificationData?.status === 'pending') 
        : creators.filter(c => c.verificationData?.status === 'pending');

    if (isLoading) return <div style={{ padding: 20 }}>Cargando base de datos de Creadores...</div>;

    return (
        <div style={{ padding: 10, height: '85vh', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="window" style={{ marginBottom: 5 }}>
                <div className="window-body" style={{ padding: '2px 5px', display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button 
                        onClick={() => { setCurrentPath('C:\\Red\\VOZ\\Creadores'); setViewMode('folders'); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                        disabled={isAtRoot}
                    >
                        <img src="https://win98icons.alexmeub.com/icons/png/directory_up-0.png" width="16" /> Arriba
                    </button>
                    <div style={{ borderLeft: '1px solid #808080', borderRight: '1px solid #fff', height: 20 }} />
                    <span style={{ fontSize: '11px' }}>{currentPath}</span>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flex: 1, overflow: 'hidden' }}>
                <div className="sunken-panel" style={{ flex: 1, backgroundColor: 'white', overflowY: 'auto', padding: 15 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 20 }}>
                        {/* Folder: Solicitudes (Only at Root) */}
                        {/* Folder: Solicitudes (Removed redundant folder to show them in root) */}

                        {displayedCreators.map(creator => (
                            <div
                                key={creator.id}
                                onClick={() => setSelectedCreator(creator)}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    padding: 5,
                                    backgroundColor: selectedCreator?.id === creator.id ? '#000080' : 'transparent',
                                    borderRadius: 2
                                }}
                            >
                                <img
                                    src="https://win98icons.alexmeub.com/icons/png/directory_closed-4.png"
                                    style={{
                                        width: 48,
                                        opacity: creator.status === 'suspended' ? 0.4 : 1,
                                        filter: creator.verificationData?.status === 'pending' ? 'hue-rotate(240deg)' : 'none' // Subtle blue tint for pending folders
                                    }}
                                />
                                <span style={{
                                    fontSize: '12px',
                                    textAlign: 'center',
                                    marginTop: 5,
                                    color: selectedCreator?.id === creator.id ? 'white' : 'black',
                                    wordBreak: 'break-all'
                                }}>
                                    {creator.userHandle} {creator.verificationData?.status === 'pending' && <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'blue' }}>(PTE)</span>}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Lateral: Detalles y Canjes */}
                <div style={{ width: 430, display: 'flex', flexDirection: 'column' }}>
                    <div className="window" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div className="title-bar">
                            <div className="title-bar-text">
                                {selectedCreator ? `Propiedades: ${selectedCreator.userHandle} ${selectedCreator.verificationData?.phone ? `(${selectedCreator.verificationData.phone})` : ''}` : 'Panel de Control de Creadores'}
                            </div>
                        </div>
                        <div className="window-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px 5px' }}>
                            {selectedCreator ? (
                                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <menu role="tablist">
                                        <li role="tab" aria-selected={activeTab === 'general'}><a href="#tabs" onClick={() => setActiveTab('general')}>General</a></li>
                                        <li role="tab" aria-selected={activeTab === 'verificacion'}><a href="#tabs" onClick={() => setActiveTab('verificacion')}>Validar Registro</a></li>
                                        <li role="tab" aria-selected={activeTab === 'pagos'}><a href="#tabs" onClick={() => setActiveTab('pagos')}>Historial/Banco</a></li>
                                    </menu>

                                    <div className="window" role="tabpanel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <div className="window-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                                            {activeTab === 'general' && (
                                                <div style={{ gap: 15, display: 'flex', flexDirection: 'column' }}>
                                                    <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
                                                        <img src="https://win98icons.alexmeub.com/icons/png/users-1.png" width="48" />
                                                        <div>
                                                            <h3 style={{ margin: 0 }}>{selectedCreator.realName || selectedCreator.userHandle}</h3>
                                                            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>ID: {selectedCreator.id}</p>
                                                            <span style={{ fontSize: '13px', fontWeight: 'bold', color: selectedCreator.isCreator ? 'green' : '#ff9800' }}>
                                                                {selectedCreator.isCreator ? "✓ CREADOR ACTIVO" : "⚠ ASPIRANTE PENDIENTE"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <fieldset>
                                                        <legend>Estado de Cuenta</legend>
                                                        <div className="field-row" style={{ gap: 10 }}>
                                                            <input type="radio" id="st-active" checked={selectedCreator.status === 'active'} onChange={() => handleStatusChange('active')} />
                                                            <label htmlFor="st-active">Activo</label>
                                                        </div>
                                                        <div className="field-row" style={{ gap: 10 }}>
                                                            <input type="radio" id="st-review" checked={selectedCreator.status === 'under_review'} onChange={() => handleStatusChange('under_review')} />
                                                            <label htmlFor="st-review">Bajo Revisión</label>
                                                        </div>
                                                    </fieldset>
                                                    <div style={{ marginTop: 10, textAlign: 'center' }}>
                                                        <button 
                                                            style={{ fontWeight: 'bold', width: '100%', padding: '5px' }}
                                                            onClick={() => {
                                                                window.location.href = `/support?user=${encodeURIComponent(selectedCreator.userHandle)}`;
                                                            }}
                                                        >
                                                            ✉️ Enviar Mensaje Directo
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {activeTab === 'verificacion' && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                    {selectedCreator.verificationData ? (
                                                        <>
                                                            <fieldset>
                                                                <legend>Datos de Identidad</legend>
                                                                <TextRow label="Nombre Completo" value={selectedCreator.verificationData.full_name} />
                                                                <TextRow label="Teléfono" value={selectedCreator.verificationData.phone || 'No especificado'} />
                                                                <TextRow label="DNI / NIE" value={selectedCreator.verificationData.dni_number} />
                                                                <TextRow label="País" value={selectedCreator.verificationData.country || 'No especificado'} />
                                                                <TextRow label="Dirección" value={selectedCreator.verificationData.address} />
                                                                <TextRow label="C. Postal" value={selectedCreator.verificationData.postal_code} />
                                                            </fieldset>

                                                            <fieldset>
                                                                <legend>Documentación (DNI)</legend>
                                                                <ViewImages 
                                                                    front={selectedCreator.verificationData.dni_front_url} 
                                                                    back={selectedCreator.verificationData.dni_back_url} 
                                                                />
                                                            </fieldset>

                                                            {selectedCreator.verificationData.status === 'pending' && (
                                                                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                                                                    <button 
                                                                        style={{ flex: 1, backgroundColor: '#c1ffc1', height: 40, fontWeight: 'bold' }}
                                                                        onClick={() => handleProcessVerification(selectedCreator.id, 'approved')}
                                                                    >
                                                                        APROBAR CREADOR
                                                                    </button>
                                                                    <button 
                                                                        style={{ flex: 1, backgroundColor: '#ffcccc', height: 40 }}
                                                                        onClick={() => {
                                                                            setRejectReasons({ dniFront: false, dniBack: false, fullName: false, dniNumber: false, iban: false, address: false, phone: false, other: '' });
                                                                            setRejectModal({ show: true, userId: selectedCreator.id });
                                                                        }}
                                                                    >
                                                                        RECHAZAR
                                                                    </button>
                                                                </div>
                                                            )}
                                                            {selectedCreator.verificationData.status !== 'pending' && (
                                                                <div style={{ textAlign: 'center', padding: 10 }}>
                                                                    <Text style={{ fontWeight: 'bold', color: selectedCreator.verificationData.status === 'approved' ? 'green' : 'red' }}>
                                                                        ESTADO: {selectedCreator.verificationData.status.toUpperCase()}
                                                                    </Text>
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <div style={{ padding: 20, textAlign: 'center' }}>
                                                            <img src="https://win98icons.alexmeub.com/icons/png/message_info-0.png" width="32" />
                                                            <p>Este usuario no ha enviado documentación de registro todavía.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {activeTab === 'pagos' && (
                                                <div style={{ gap: 10, display: 'flex', flexDirection: 'column' }}>
                                                    <fieldset>
                                                        <legend>Información Bancaria</legend>
                                                        <TextRow label="IBAN" value={selectedCreator.verificationData?.iban || 'Sin datos'} />
                                                    </fieldset>
                                                    <fieldset>
                                                        <legend>Estadísticas de Canje (Sincronizado)</legend>
                                                        <div className="field-row" style={{ justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' }}>
                                                            <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#444' }}>Disp. para Canje:</span>
                                                            <span style={{ fontSize: '20px', fontWeight: '900', color: '#000080', backgroundColor: '#ffffcc', padding: '2px 8px', border: '1px inset #808080' }}>
                                                                {selectedCreator.withdrawableCoins.toFixed(2)} 🪙
                                                            </span>
                                                        </div>

                                                        <div className="sunken-panel" style={{ backgroundColor: 'white', padding: 5, maxHeight: 150, overflowY: 'auto' }}>
                                                            <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                                                                <thead>
                                                                    <tr style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>
                                                                        <th>Fecha</th>
                                                                        <th>Cant.</th>
                                                                        <th>Estado</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {withdrawals
                                                                        .filter(w => w.user_handle === selectedCreator.userHandle)
                                                                        .map((w, i) => (
                                                                            <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                                                <td style={{ padding: '4px 0', fontSize: '13px' }}>{new Date(w.created_at).toLocaleDateString()}</td>
                                                                                <td style={{ fontSize: '15px', fontWeight: 'bold', color: '#000' }}>{w.amount} 🪙</td>
                                                                                <td style={{ 
                                                                                    fontSize: '13px',
                                                                                    fontWeight: 'bold',
                                                                                    color: w.status === 'pending' ? '#e65100' : w.status === 'approved' ? '#2e7d32' : '#c62828'
                                                                                }}>
                                                                                    {w.status === 'pending' ? 'PENDIENTE' : 
                                                                                     w.status === 'approved' ? 'APROBADO' : 'RECHAZADO'}
                                                                                </td>
                                                                            </tr>
                                                                        ))
                                                                    }
                                                                    {withdrawals.filter(w => w.user_handle === selectedCreator.userHandle).length === 0 && (
                                                                        <tr><td colSpan={3} style={{ textAlign: 'center', padding: 10, color: '#999' }}>Sin historial de cobros.</td></tr>
                                                                    )}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </fieldset>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ marginTop: 15, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                                        <button style={{ minWidth: 80 }} onClick={() => setSelectedCreator(null)}>Cerrar</button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}>
                                    <img src="https://win98icons.alexmeub.com/icons/png/users-1.png" style={{ width: 64, marginBottom: 20 }} />
                                    <p style={{ textAlign: 'center' }}>
                                        Seleccione una carpeta o un usuario para ver sus propiedades detalladas.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Win98 */}
            {modal.show && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div className="window" style={{ width: 300 }}>
                        <div className="title-bar">
                            <div className="title-bar-text">{modal.title}</div>
                        </div>
                        <div className="window-body" style={{ textAlign: 'center', padding: 20 }}>
                            <p style={{ marginBottom: 20 }}>{modal.message}</p>
                            <button onClick={() => setModal({ ...modal, show: false })}>Aceptar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Rechazo Personalizado Win98 */}
            {rejectModal.show && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div className="window" style={{ width: 400 }}>
                        <div className="title-bar">
                            <div className="title-bar-text">Motivo del Rechazo</div>
                            <div className="title-bar-controls">
                                <button aria-label="Close" onClick={() => setRejectModal({ show: false, userId: '' })}></button>
                            </div>
                        </div>
                        <div className="window-body" style={{ padding: 15 }}>
                            <p>Selecciona los datos que el usuario debe corregir:</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10, marginBottom: 15 }}>
                                <div className="field-row"><input type="checkbox" id="r-name" checked={rejectReasons.fullName} onChange={e => setRejectReasons({...rejectReasons, fullName: e.target.checked})} /><label htmlFor="r-name">Nombre Completo</label></div>
                                <div className="field-row"><input type="checkbox" id="r-dni" checked={rejectReasons.dniNumber} onChange={e => setRejectReasons({...rejectReasons, dniNumber: e.target.checked})} /><label htmlFor="r-dni">Número DNI/NIE</label></div>
                                <div className="field-row"><input type="checkbox" id="r-phone" checked={rejectReasons.phone} onChange={e => setRejectReasons({...rejectReasons, phone: e.target.checked})} /><label htmlFor="r-phone">Teléfono</label></div>
                                <div className="field-row"><input type="checkbox" id="r-address" checked={rejectReasons.address} onChange={e => setRejectReasons({...rejectReasons, address: e.target.checked})} /><label htmlFor="r-address">Dirección / C.P.</label></div>
                                <div className="field-row"><input type="checkbox" id="r-iban" checked={rejectReasons.iban} onChange={e => setRejectReasons({...rejectReasons, iban: e.target.checked})} /><label htmlFor="r-iban">IBAN Bancario</label></div>
                                <div className="field-row"><input type="checkbox" id="r-front" checked={rejectReasons.dniFront} onChange={e => setRejectReasons({...rejectReasons, dniFront: e.target.checked})} /><label htmlFor="r-front">Foto DNI (Anverso)</label></div>
                                <div className="field-row"><input type="checkbox" id="r-back" checked={rejectReasons.dniBack} onChange={e => setRejectReasons({...rejectReasons, dniBack: e.target.checked})} /><label htmlFor="r-back">Foto DNI (Reverso)</label></div>
                            </div>
                            <div className="field-row-stacked" style={{ marginBottom: 15 }}>
                                <label>Detalles adicionales (opcional):</label>
                                <textarea rows={3} value={rejectReasons.other} onChange={e => setRejectReasons({...rejectReasons, other: e.target.value})} placeholder="Ej: Faltan números en tu teléfono..." style={{ resize: 'none' }}></textarea>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                                <button onClick={() => {
                                    let reasons = [];
                                    if (rejectReasons.fullName) reasons.push("Nombre Completo");
                                    if (rejectReasons.dniNumber) reasons.push("Número de DNI/NIE");
                                    if (rejectReasons.phone) reasons.push("Teléfono");
                                    if (rejectReasons.address) reasons.push("Dirección");
                                    if (rejectReasons.iban) reasons.push("IBAN Bancario");
                                    if (rejectReasons.dniFront) reasons.push("Foto DNI (Anverso)");
                                    if (rejectReasons.dniBack) reasons.push("Foto DNI (Reverso)");
                                    
                                    let finalReason = "";
                                    if (reasons.length > 0) {
                                        finalReason = `Revisa: ${reasons.join(', ')}.`;
                                    }
                                    if (rejectReasons.other) {
                                        finalReason += finalReason ? `\nNota: ${rejectReasons.other}` : rejectReasons.other;
                                    }
                                    
                                    if (!finalReason) finalReason = "Por favor, revisa tus datos.";
                                    
                                    handleProcessVerification(rejectModal.userId, 'rejected', finalReason);
                                    setRejectModal({show: false, userId: ''});
                                }}>Enviar Rechazo</button>
                                <button onClick={() => setRejectModal({ show: false, userId: '' })}>Cancelar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function TextRow({ label, value }: { label: string, value?: string }) {
    return (
        <div className="field-row" style={{ marginBottom: 5 }}>
            <label style={{ width: 100 }}>{label}:</label>
            <input type="text" value={value || ''} readOnly style={{ flex: 1, backgroundColor: '#f0f0f0' }} />
        </div>
    );
}

function ViewImages({ front, back }: { front?: string, back?: string }) {
    const [zoom, setZoom] = useState<string | null>(null);

    return (
        <div style={{ display: 'flex', gap: 10 }}>
            {[ { label: 'ANVERSO', url: front }, { label: 'REVERSO', url: back }].map((img, i) => (
                <div key={i} style={{ flex: 1, alignItems: 'center', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '9px', marginBottom: 2 }}>{img.label}</span>
                    <TouchableOpacity onPress={() => img.url && setZoom(img.url)}>
                        <div className="sunken-panel" style={{ width: '100%', aspectRatio: 16/10, backgroundColor: '#000', overflow: 'hidden' }}>
                            {img.url ? <img src={img.url} style={{ width: '100%', height: '100%' }} /> : <div style={{ flex: 1 }} />}
                        </div>
                    </TouchableOpacity>
                </div>
            ))}
            {zoom && (
                <div 
                    onClick={() => setZoom(null)}
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 10000, justifyContent: 'center', alignItems: 'center', display: 'flex' }}
                >
                    <img src={zoom} style={{ maxWidth: '95%', maxHeight: '95%' }} />
                    <button style={{ position: 'absolute', top: 20, right: 20 }}>X Cerrar</button>
                </div>
            )}
        </div>
    );
}

// Minimal TouchableOpacity and Text for Web compatibility if needed, though divs are fine
const TouchableOpacity = ({ children, onPress, style }: any) => <div onClick={onPress} style={{ cursor: 'pointer', ...style }}>{children}</div>;
const Text = ({ children, style }: any) => <span style={style}>{children}</span>;
