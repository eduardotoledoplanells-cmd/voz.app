'use client';

import React, { useState, useEffect } from 'react';
import '98.css';

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
    status: 'active' | 'under_review' | 'suspended' | 'deleted';
    joinedAt: string;
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
    const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'folders' | 'details'>('folders');
    const [activeTab, setActiveTab] = useState('general');

    interface ModalConfig {
        show: boolean;
        title: string;
        message: string;
        type: 'alert' | 'confirm';
        onConfirm: (() => any) | null;
    }

    const [modal, setModal] = useState<ModalConfig>({ show: false, title: '', message: '', type: 'alert', onConfirm: null });

    const showWin98Modal = (title: string, message: string, type: 'alert' | 'confirm' = 'alert', onConfirm: (() => any) | null = null) => {
        setModal({ show: true, title, message, type, onConfirm });
    };

    const fetchData = async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const [cRes, rRes] = await Promise.all([
                fetch('/api/voz/creators'),
                fetch('/api/voz/redemptions')
            ]);
            const cData = await cRes.json();
            const rData = await rRes.json();
            setCreators(cData);
            setRedemptions(rData);

            // Re-select current to refresh data
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

    const getRedemptionsForCreator = (creatorId: string) => {
        return redemptions.filter(r => r.creatorId === creatorId);
    };


    const handleSimulate = async (type: 'gift' | 'pm') => {
        if (!selectedCreator) return;
        try {
            const response = await fetch('/api/voz/creators/interact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ creatorId: selectedCreator.id, type, employeeName: 'Admin' })
            });
            if (response.ok) {
                fetchData(true);
            }
        } catch (error) {
            console.error('Error simulating:', error);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!selectedCreator) return;

        // Optimistic Update: Update UI immediately
        const updatedLocal = { ...selectedCreator, status: newStatus as any };
        setSelectedCreator(updatedLocal);
        setCreators(prev => prev.map(c => c.id === selectedCreator.id ? updatedLocal : c));

        try {
            const response = await fetch('/api/voz/creators', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selectedCreator.id, status: newStatus, employeeName: 'Admin' })
            });
            if (response.ok) {
                // Background sync
                fetchData(true);
            } else {
                // Revert on error
                console.error("Failed to update status");
                fetchData(true);
            }
        } catch (error) {
            console.error('Error updating status:', error);
            fetchData(true);
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
                // Notificar al creador
                const request = redemptions.find(r => r.id === redId);
                if (request && (newStatus === 'approved' || newStatus === 'completed')) {
                    const title = newStatus === 'approved' ? 'Solicitud Aprobada' : 'Pago Completado';
                    const message = newStatus === 'approved'
                        ? 'Tu solicitud de canje ha sido aprobada y está en proceso de pago.'
                        : '¡Pago enviado! Ya hemos procesado tu transferencia. Recibirás los fondos en tu cuenta próximamente.';

                    await fetch('/api/voz/notifications', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            recipientId: request.creatorId,
                            type: newStatus === 'approved' ? 'payment_approved' : 'payment_completed',
                            title,
                            message
                        })
                    });
                }
                fetchData(true);
            } else {
                const errorData = await response.json();
                console.error('Error updating redemption status:', errorData.error);
                showWin98Modal('Error de Sistema', `No se pudo actualizar el estado: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error updating redemption status:', error);
            showWin98Modal('Error de Conexión', 'No se ha podido contactar con el servidor de base de datos.');
        }
    };

    if (isLoading) return <div style={{ padding: 20 }}>Cargando base de datos de Creadores...</div>;

    return (
        <div style={{ padding: 10, height: '85vh', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Barra de Herramientas Estilo Explorer */}
            <div className="window" style={{ marginBottom: 5 }}>
                <div className="window-body" style={{ padding: '2px 5px', display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button onClick={() => { setViewMode('folders'); setSelectedCreator(null); }} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <img src="https://win98icons.alexmeub.com/icons/png/directory_open_file_mydocs-4.png" width="16" /> Carpetas
                    </button>
                    <button onClick={() => setViewMode('details')} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <img src="https://win98icons.alexmeub.com/icons/png/file_lines-0.png" width="16" /> Lista Detallada
                    </button>
                    <div style={{ borderLeft: '1px solid #808080', borderRight: '1px solid #fff', height: 20 }} />
                    <span style={{ fontSize: '11px' }}>C:\Red\VOZ\Creadores</span>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, fontSize: '12px', color: '#000' }}>
                        <img src="https://win98icons.alexmeub.com/icons/png/help_book_computer-3.png" width="16" />
                        Comisiones: Regalos 45% / PMs 40%
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flex: 1, overflow: 'hidden' }}>
                {/* Principal: Vista de Carpetas o Tabla */}
                <div className="sunken-panel" style={{ flex: 1, backgroundColor: 'white', overflowY: 'auto', padding: 15 }}>
                    {viewMode === 'folders' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 20 }}>
                            {creators.map(creator => (
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
                                            filter: creator.status === 'suspended' ? 'grayscale(0.5)' : 'none'
                                        }}
                                    />
                                    <span style={{
                                        fontSize: '12px',
                                        textAlign: 'center',
                                        marginTop: 5,
                                        color: selectedCreator?.id === creator.id ? 'white' : 'black',
                                        wordBreak: 'break-all'
                                    }}>
                                        {creator.userHandle}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid black' }}>
                                    <th>Creador</th>
                                    <th>Nombre Real</th>
                                    <th>Monedas Totales</th>
                                    <th>Ganado (Neto)</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {creators.map(creator => (
                                    <tr
                                        key={creator.id}
                                        onClick={() => setSelectedCreator(creator)}
                                        style={{
                                            cursor: 'pointer',
                                            backgroundColor: selectedCreator?.id === creator.id ? '#000080' : 'transparent',
                                            color: selectedCreator?.id === creator.id ? 'white' : 'black'
                                        }}
                                    >
                                        <td style={{ padding: 5 }}>{creator.userHandle}</td>
                                        <td style={{ padding: 5 }}>{creator.realName}</td>
                                        <td style={{ padding: 5 }}>{creator.totalCoins} 🪙</td>
                                        <td style={{ padding: 5, fontWeight: 'bold', color: selectedCreator?.id === creator.id ? 'lime' : 'green' }}>
                                            {creator.earnedEuro?.toFixed(2)}€
                                        </td>
                                        <td style={{ padding: 5 }}>{creator.status.toUpperCase()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Lateral: Detalles y Canjes */}
                <div style={{ width: 400, display: 'flex', flexDirection: 'column' }}>
                    <div className="window" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div className="title-bar">
                            <div className="title-bar-text">
                                {selectedCreator ? `Propiedades: ${selectedCreator.userHandle}` : 'Solicitudes de Retiro de Fondos'}
                            </div>
                        </div>
                        <div className="window-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px 5px' }}>
                            {selectedCreator ? (
                                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <menu role="tablist">
                                        <li role="tab" aria-selected={activeTab === 'general'}>
                                            <a href="#tabs" onClick={() => setActiveTab('general')}>General</a>
                                        </li>
                                        <li role="tab" aria-selected={activeTab === 'pagos'}>
                                            <a href="#tabs" onClick={() => setActiveTab('pagos')}>Pagos</a>
                                        </li>
                                        <li role="tab" aria-selected={activeTab === 'canjes'}>
                                            <a href="#tabs" onClick={() => setActiveTab('canjes')}>Canjes</a>
                                        </li>
                                        <li role="tab" aria-selected={activeTab === 'pruebas'}>
                                            <a href="#tabs" onClick={() => setActiveTab('pruebas')}>Pruebas</a>
                                        </li>
                                        <li role="tab" aria-selected={activeTab === 'verificacion'}>
                                            <a href="#tabs" onClick={() => setActiveTab('verificacion')}>Verificación</a>
                                        </li>
                                    </menu>

                                    <div className="window" role="tabpanel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <div className="window-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

                                            {activeTab === 'general' && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                                                    <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
                                                        <img src="https://win98icons.alexmeub.com/icons/png/users-1.png" width="48" height="48" />
                                                        <div>
                                                            <h3 style={{ margin: 0 }}>{selectedCreator.realName}</h3>
                                                            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{selectedCreator.userHandle}</p>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 5 }}>
                                                                <span style={{ fontSize: '12px', color: '#444' }}>
                                                                    <b>Miembro desde:</b> {new Date(selectedCreator.joinedAt).toLocaleDateString()}
                                                                </span>
                                                                <div style={{ display: 'flex' }}>
                                                                    {(selectedCreator.status === 'active' || !!selectedCreator.verification?.verifiedAt) ? (
                                                                        <span style={{ fontSize: '10px', fontWeight: 'bold', backgroundColor: '#e1f5fe', color: '#01579b', padding: '2px 6px', borderRadius: 2, border: '1px solid #01579b' }}>✓ CUENTA VERIFICADA</span>
                                                                    ) : (
                                                                        <span style={{ fontSize: '10px', fontWeight: 'bold', backgroundColor: '#fff3e0', color: '#e65100', padding: '2px 6px', borderRadius: 2, border: '1px solid #e65100' }}>⚠ PENDIENTE DE VERIFICAR</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <fieldset>
                                                        <legend>Resumen Financiero</legend>
                                                        <div className="field-row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
                                                            <span>Ingresos Totales (Neto):</span>
                                                            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#008000' }}>
                                                                {selectedCreator.earnedEuro?.toFixed(2)}€
                                                            </span>
                                                        </div>
                                                        <div className="field-row" style={{ justifyContent: 'space-between', marginBottom: 5 }}>
                                                            <span>Monedas Totales:</span>
                                                            <span>{selectedCreator.totalCoins?.toFixed(2)} 🪙</span>
                                                        </div>
                                                        <div className="field-row" style={{ justifyContent: 'space-between' }}>
                                                            <span>Disponible para Canje:</span>
                                                            <span style={{ fontWeight: 'bold', color: '#005500' }}>{selectedCreator.withdrawableCoins?.toFixed(2)} 🪙</span>
                                                        </div>
                                                    </fieldset>

                                                    <fieldset>
                                                        <legend>Estado de la Cuenta</legend>
                                                        <div className="field-row" style={{ gap: 10 }}>
                                                            <input type="radio" id="st-active" name="status" checked={selectedCreator.status === 'active'} onChange={() => handleStatusChange('active')} />
                                                            <label htmlFor="st-active">Activo / Verificado</label>
                                                        </div>
                                                        <div className="field-row" style={{ gap: 10 }}>
                                                            <input type="radio" id="st-review" name="status" checked={selectedCreator.status === 'under_review'} onChange={() => handleStatusChange('under_review')} />
                                                            <label htmlFor="st-review">Bajo Revisión</label>
                                                        </div>
                                                        <div className="field-row" style={{ gap: 10 }}>
                                                            <input type="radio" id="st-susp" name="status" checked={selectedCreator.status === 'suspended'} onChange={() => handleStatusChange('suspended')} />
                                                            <label htmlFor="st-susp">Suspendido</label>
                                                        </div>
                                                        <div className="field-row" style={{ gap: 10, color: 'red', fontWeight: 'bold' }}>
                                                            <input type="radio" id="st-del" name="status" checked={selectedCreator.status === 'deleted'}
                                                                onChange={() => {
                                                                    showWin98Modal(
                                                                        'BORRADO DEFINITIVO',
                                                                        `¿Estás SEGURO de eliminar completamente a ${selectedCreator.userHandle}? Se borrará su cuenta, todos sus vídeos, sus cobros y estadísticas. Esta acción NO se puede deshacer.`,
                                                                        'confirm',
                                                                        () => handleStatusChange('deleted')
                                                                    );
                                                                }}
                                                            />
                                                            <label htmlFor="st-del">ELIMINADO (Borrado Total)</label>
                                                        </div>
                                                    </fieldset>
                                                </div>
                                            )}

                                            {activeTab === 'pagos' && (
                                                <form onSubmit={async (e) => {
                                                    e.preventDefault();
                                                    const formData = new FormData(e.currentTarget);
                                                    const paymentInfo = {
                                                        fullName: formData.get('fullName') as string,
                                                        dni: formData.get('dni') as string,
                                                        iban: formData.get('iban') as string,
                                                        address: formData.get('address') as string,
                                                        province: formData.get('province') as string,
                                                        phone: formData.get('phone') as string,
                                                        email: formData.get('email') as string,
                                                    };
                                                    try {
                                                        await fetch('/api/voz/creators', {
                                                            method: 'PATCH',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ id: selectedCreator.id, paymentInfo })
                                                        });
                                                        showWin98Modal('Configuración', 'Datos de pago actualizados correctamente.');
                                                        fetchData(true);
                                                    } catch (error) {
                                                        console.error('Error updating payment info:', error);
                                                    }
                                                }}>
                                                    <div className="field-row-stacked" style={{ marginBottom: 5 }}>
                                                        <label>Titular de la Cuenta:</label>
                                                        <input name="fullName" type="text" defaultValue={selectedCreator.paymentInfo?.fullName || ''} style={{ width: '100%' }} />
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 5 }}>
                                                        <div className="field-row-stacked" style={{ flex: 1 }}>
                                                            <label>DNI/CIF:</label>
                                                            <input name="dni" type="text" defaultValue={selectedCreator.paymentInfo?.dni || ''} style={{ width: '100%' }} />
                                                        </div>
                                                        <div className="field-row-stacked" style={{ flex: 2 }}>
                                                            <label>IBAN Bancario:</label>
                                                            <input name="iban" type="text" defaultValue={selectedCreator.paymentInfo?.iban || ''} style={{ width: '100%' }} />
                                                        </div>
                                                    </div>
                                                    <div className="field-row-stacked" style={{ marginBottom: 5 }}>
                                                        <label>Dirección Fiscal:</label>
                                                        <input name="address" type="text" defaultValue={selectedCreator.paymentInfo?.address || ''} style={{ width: '100%' }} />
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 5 }}>
                                                        <div className="field-row-stacked" style={{ flex: 1 }}>
                                                            <label>Provincia:</label>
                                                            <input name="province" type="text" defaultValue={selectedCreator.paymentInfo?.province || ''} style={{ width: '100%' }} />
                                                        </div>
                                                        <div className="field-row-stacked" style={{ flex: 1 }}>
                                                            <label>Teléfono:</label>
                                                            <input name="phone" type="text" defaultValue={selectedCreator.paymentInfo?.phone || ''} style={{ width: '100%' }} />
                                                        </div>
                                                    </div>
                                                    <div className="field-row-stacked" style={{ marginBottom: 15 }}>
                                                        <label>Email de Contacto:</label>
                                                        <input name="email" type="email" defaultValue={selectedCreator.paymentInfo?.email || ''} style={{ width: '100%' }} />
                                                    </div>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <button type="submit" style={{ padding: '5px 20px' }}>💾 Guardar Cambios</button>
                                                    </div>
                                                </form>
                                            )}

                                            {activeTab === 'canjes' && (
                                                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                                    <p style={{ margin: '0 0 10px 0', fontSize: '11px' }}>Historial y solicitudes pendientes:</p>
                                                    <div className="sunken-panel" style={{ flex: 1, backgroundColor: 'white', overflowY: 'auto' }}>
                                                        <ul className="tree-view" style={{ border: 'none', background: 'none' }}>
                                                            {getRedemptionsForCreator(selectedCreator.id).length === 0 ? (
                                                                <li>No hay registros de canje.</li>
                                                            ) : (
                                                                getRedemptionsForCreator(selectedCreator.id).map(req => (
                                                                    <li key={req.id} style={{
                                                                        marginBottom: 15,
                                                                        padding: 8,
                                                                        borderBottom: '1px dotted #808080',
                                                                        backgroundColor: req.status === 'pending' ? '#f0fff0' : 'transparent'
                                                                    }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                            <span style={{ fontWeight: 'bold' }}>Solicitud: {req.amountCoins} 🪙</span>
                                                                            <select
                                                                                value={req.status}
                                                                                disabled={req.status === 'completed'}
                                                                                onChange={(e) => handleRedemptionStatusUpdate(req.id, e.target.value)}
                                                                                style={{
                                                                                    fontSize: '10px',
                                                                                    color: req.status === 'completed' ? 'green' : req.status === 'pending' ? 'orange' : 'black',
                                                                                    cursor: req.status === 'completed' ? 'not-allowed' : 'pointer'
                                                                                }}
                                                                            >
                                                                                <option value="pending">PENDIENTE</option>
                                                                                <option value="approved">APROBADO (Pte. Pago)</option>
                                                                                <option value="completed">PAGADO (Finalizado)</option>
                                                                                <option value="rejected">RECHAZADO</option>
                                                                            </select>
                                                                        </div>
                                                                        <div style={{ fontSize: '11px', marginTop: 3 }}>Neto a pagar: <b style={{ fontSize: '13px' }}>{req.amountEuro}€</b></div>
                                                                        <div style={{ fontSize: '10px', color: '#666' }}>Fecha: {new Date(req.requestedAt).toLocaleDateString()}</div>

                                                                        {req.status === 'pending' && (
                                                                            <div style={{ display: 'flex', gap: 5, marginTop: 10 }}>
                                                                                <button
                                                                                    style={{ flex: 1, height: 22 }}
                                                                                    disabled={!selectedCreator.verification?.verifiedAt}
                                                                                    onClick={() => handleRedemptionStatusUpdate(req.id, 'approved')}
                                                                                >
                                                                                    APROBAR PARA PAGO
                                                                                </button>
                                                                                <button style={{ flex: 1, height: 22 }} onClick={() => handleRedemptionStatusUpdate(req.id, 'rejected')}>RECHAZAR</button>
                                                                            </div>
                                                                        )}
                                                                        {req.status === 'approved' && (
                                                                            <div style={{ color: '#000080', fontSize: '10px', marginTop: 10, textAlign: 'center', fontWeight: 'bold' }}>
                                                                                ✓ ENVIADO A FACTURACIÓN PARA PAGO
                                                                            </div>
                                                                        )}
                                                                        {!selectedCreator.verification?.verifiedAt && req.status === 'pending' && (
                                                                            <div style={{ color: '#e65100', fontSize: '9px', marginTop: 5, textAlign: 'center' }}>
                                                                                * Requiere verificación de identidad para aprobar
                                                                            </div>
                                                                        )}
                                                                    </li>
                                                                ))
                                                            )}
                                                        </ul>
                                                    </div>
                                                </div>
                                            )}

                                            {activeTab === 'pruebas' && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                                    <fieldset>
                                                        <legend>Simulador de Interacciones VOZ App</legend>
                                                        <p style={{ fontSize: '11px', marginBottom: 10 }}>Utilice estos botones para simular la actividad del usuario final y validar los cálculos de comisiones.</p>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                            <button style={{ padding: 10, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }} onClick={() => handleSimulate('gift')}>
                                                                <span style={{ fontSize: '20px' }}>🎁</span>
                                                                <div>
                                                                    <div style={{ fontWeight: 'bold' }}>Enviar Regalo Directo</div>
                                                                    <div style={{ fontSize: '10px', opacity: 0.7 }}>Coste: 1.00€ | Comisión Creador: 45% (0.45€)</div>
                                                                </div>
                                                            </button>
                                                            <button style={{ padding: 10, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }} onClick={() => handleSimulate('pm')}>
                                                                <span style={{ fontSize: '20px' }}>✉️</span>
                                                                <div>
                                                                    <div style={{ fontWeight: 'bold' }}>Enviar Mensaje Privado</div>
                                                                    <div style={{ fontSize: '10px', opacity: 0.7 }}>Coste: 5.00€ | Comisión Creador: 40% (2.00€)</div>
                                                                </div>
                                                            </button>
                                                        </div>
                                                    </fieldset>

                                                    <fieldset>
                                                        <legend>Desglose de Auditoría</legend>
                                                        <div className="field-row" style={{ justifyContent: 'space-between', fontSize: '11px' }}>
                                                            <span>Regalos Históricos:</span>
                                                            <span>{selectedCreator.stats?.totalGifts || 0}</span>
                                                        </div>
                                                        <div className="field-row" style={{ justifyContent: 'space-between', fontSize: '11px' }}>
                                                            <span>Mensajes Históricos:</span>
                                                            <span>{selectedCreator.stats?.totalPMs || 0}</span>
                                                        </div>
                                                    </fieldset>
                                                </div>
                                            )}

                                            {activeTab === 'verificacion' && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                                                    <p style={{ fontSize: '11px', margin: 0 }}>Documentación de identidad proporcionada por el usuario para la activación de la cuenta:</p>

                                                    <fieldset>
                                                        <legend>DNI / Documento de Identidad</legend>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                                                            <div>
                                                                <span style={{ fontSize: '10px', fontWeight: 'bold', display: 'block', marginBottom: 5 }}>ANVERSO (Frontal):</span>
                                                                <div className="sunken-panel" style={{ backgroundColor: '#fff', padding: 5, textAlign: 'center' }}>
                                                                    {selectedCreator.verification?.dniFront ? (
                                                                        <img src={selectedCreator.verification.dniFront} style={{ maxWidth: '100%', height: 'auto', border: '1px solid #808080' }} alt="DNI Frontal" />
                                                                    ) : (
                                                                        <div style={{ padding: 20, color: '#666', fontSize: '11px' }}>No se ha cargado imagen del anverso.</div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <span style={{ fontSize: '10px', fontWeight: 'bold', display: 'block', marginBottom: 5 }}>REVERSO (Trasera):</span>
                                                                <div className="sunken-panel" style={{ backgroundColor: '#fff', padding: 5, textAlign: 'center' }}>
                                                                    {selectedCreator.verification?.dniBack ? (
                                                                        <img src={selectedCreator.verification.dniBack} style={{ maxWidth: '100%', height: 'auto', border: '1px solid #808080' }} alt="DNI Reverso" />
                                                                    ) : (
                                                                        <div style={{ padding: 20, color: '#666', fontSize: '11px' }}>No se ha cargado imagen del reverso.</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </fieldset>

                                                    {selectedCreator.verification?.verifiedAt && (
                                                        <div style={{ fontSize: '10px', color: '#008000', textAlign: 'right' }}>
                                                            ✓ Verificado el: {new Date(selectedCreator.verification.verifiedAt).toLocaleDateString()}
                                                        </div>
                                                    )}

                                                    <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                                                        <button
                                                            style={{ flex: 1 }}
                                                            disabled={!!selectedCreator.verification?.verifiedAt}
                                                            onClick={async () => {
                                                                showWin98Modal(
                                                                    'Confirmar Verificación',
                                                                    '¿Confirmas que la documentación de este creador es válida?',
                                                                    'confirm',
                                                                    async () => {
                                                                        try {
                                                                            await fetch('/api/voz/creators', {
                                                                                method: 'PATCH',
                                                                                headers: { 'Content-Type': 'application/json' },
                                                                                body: JSON.stringify({
                                                                                    id: selectedCreator.id,
                                                                                    verification: {
                                                                                        ...selectedCreator.verification,
                                                                                        verifiedAt: new Date().toISOString()
                                                                                    }
                                                                                })
                                                                            });
                                                                            showWin98Modal('Éxito', 'Documentación validada. El creador ya puede recibir pagos.');
                                                                            fetchData();
                                                                        } catch (error) {
                                                                            console.error('Error validating documentation:', error);
                                                                        }
                                                                    }
                                                                );
                                                            }}
                                                        >
                                                            {selectedCreator.verification?.verifiedAt ? '✓ Documentación Validada' : 'Validar Documentación'}
                                                        </button>
                                                        <button style={{ flex: 1 }} onClick={() => showWin98Modal('Aviso', 'Función de solicitar nueva foto en desarrollo.')}>Solicitar Nueva Foto</button>
                                                    </div>
                                                </div>
                                            )}

                                        </div>
                                    </div>

                                    <div style={{ marginTop: 15, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                                        <button style={{ minWidth: 80 }} onClick={() => {
                                            showWin98Modal('Aviso', 'Propiedades actualizadas correctamente.');
                                            setSelectedCreator(null);
                                        }}>Aceptar</button>
                                        <button style={{ minWidth: 80 }} onClick={() => setSelectedCreator(null)}>Cancelar</button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <div style={{ padding: '0 5px 10px 5px' }}>
                                        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '13px' }}>Solicitudes Pendientes de Pago:</p>
                                    </div>
                                    <div className="sunken-panel" style={{ flex: 1, backgroundColor: 'white', overflowY: 'auto' }}>
                                        <ul className="tree-view" style={{ border: 'none', background: 'none' }}>
                                            {redemptions.filter(r => r.status === 'pending').length === 0 ? (
                                                <li style={{ padding: 10, textAlign: 'center', opacity: 0.5 }}>
                                                    No hay solicitudes de retiro pendientes.
                                                </li>
                                            ) : (
                                                redemptions.filter(r => r.status === 'pending').map(req => {
                                                    const creator = creators.find(c => c.id === req.creatorId);
                                                    return (
                                                        <li
                                                            key={req.id}
                                                            onClick={(e) => {
                                                                if (creator) {
                                                                    setSelectedCreator(creator);
                                                                    setActiveTab('canjes');
                                                                }
                                                            }}
                                                            style={{
                                                                marginBottom: 5,
                                                                padding: '8px 10px',
                                                                cursor: 'pointer',
                                                                borderBottom: '1px solid #dfdfdf',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                gap: 2
                                                            }}
                                                            className="redemption-item-hover"
                                                        >
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <span style={{ fontWeight: 'bold', color: '#000080' }}>
                                                                    {creator?.userHandle || 'ID: ' + req.creatorId}
                                                                </span>
                                                                <span style={{ fontWeight: 'bold', color: 'green', fontSize: '13px' }}>
                                                                    {req.amountEuro}€
                                                                </span>
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#222' }}>
                                                                <span>{req.amountCoins} monedas</span>
                                                                <span>{new Date(req.requestedAt).toLocaleDateString()}</span>
                                                            </div>
                                                        </li>
                                                    );
                                                })
                                            )}
                                        </ul>
                                    </div>
                                    <div style={{ textAlign: 'center', marginTop: 15, color: '#000', opacity: 0.9, fontSize: '12px' }}>
                                        <img src="https://win98icons.alexmeub.com/icons/png/envelope_closed-0.png" width="32" style={{ marginBottom: 10 }} /><br />
                                        Seleccione una solicitud para gestionar el pago<br />o un perfil de la izquierda para ver detalles.
                                    </div>
                                    <style jsx>{`
                                        .redemption-item-hover:hover {
                                            background-color: #efefef;
                                        }
                                    `}</style>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Win98 */}
            {modal.show && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div className="window" style={{ width: 300 }}>
                        <div className="title-bar">
                            <div className="title-bar-text">{modal.title}</div>
                            <div className="title-bar-controls">
                                <button aria-label="Close" onClick={() => setModal({ ...modal, show: false })}></button>
                            </div>
                        </div>
                        <div className="window-body" style={{ textAlign: 'center', padding: 20 }}>
                            <p style={{ marginBottom: 20 }}>{modal.message}</p>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                                {modal.type === 'confirm' ? (
                                    <>
                                        <button onClick={() => {
                                            if (modal.onConfirm) modal.onConfirm();
                                            setModal({ ...modal, show: false });
                                        }}>Aceptar</button>
                                        <button onClick={() => setModal({ ...modal, show: false })}>Cancelar</button>
                                    </>
                                ) : (
                                    <button onClick={() => setModal({ ...modal, show: false })}>Aceptar</button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
