'use client';
import { useState, useEffect } from 'react';
import '98.css';

export default function WithdrawalsPage() {
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [confirmAction, setConfirmAction] = useState<{ id: string, status: string } | null>(null);
    const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);
    const [debugInfo, setDebugInfo] = useState<string>('');
    const [employee, setEmployee] = useState<any>(null);

    useEffect(() => {
        const stored = localStorage.getItem('vozEmployee');
        if (stored) {
            try {
                setEmployee(JSON.parse(stored));
            } catch (e) {}
        }
    }, []);

    const fetchWithdrawals = async () => {
        setLoading(true);
        setDebugInfo('Fetching withdrawals...');
        try {
            const res = await fetch(`/api/voz/wallet/withdrawals?t=${Date.now()}`, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            const data = await res.json();
            if (data.success) {
                setWithdrawals(data.withdrawals);
                setDebugInfo(`Fetched ${data.withdrawals.length} records.`);
            } else {
                setDebugInfo(`Error fetching: ${JSON.stringify(data)}`);
            }
        } catch (e: any) {
            console.error('Fetch error:', e);
            setDebugInfo(`Exception fetching: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWithdrawals();
    }, []);

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        setConfirmAction(null);
        setProcessingId(id);
        setStatusMessage({ text: `Procesando ${newStatus}...`, type: 'info' });
        setDebugInfo(`Starting POST for ${id} -> ${newStatus}`);

        try {
            const stored = localStorage.getItem('vozEmployee');
            if (!stored) {
                setStatusMessage({ text: '🚨 Error: Debes iniciar sesión como empleado para realizar esta acción.', type: 'error' });
                setProcessingId(null);
                return;
            }
            const emp = JSON.parse(stored);

            const res = await fetch(`/api/voz/admin/approve-withdrawal`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'x-employee-id': emp.id || '',
                    'x-employee-username': emp.username || '',
                    'x-employee-password': emp.password || ''
                },
                body: JSON.stringify({ id, status: newStatus })
            });

            const rawText = await res.text();
            setDebugInfo(`Raw Response: ${rawText}`);

            let data;
            try {
                data = JSON.parse(rawText);
            } catch (jsE) {
                throw new Error(`Invalid JSON response: ${rawText.substring(0, 50)}...`);
            }

            if (res.ok && data.success) {
                setStatusMessage({ text: `✅ Solicitud ${newStatus} procesada correctamente.`, type: 'success' });
                await fetchWithdrawals();
            } else {
                setStatusMessage({ text: `❌ Error: ${data.error || 'Fallo desconocido'}`, type: 'error' });
            }
        } catch (e: any) {
            console.error('[ADMIN] FATAL ERROR:', e);
            setStatusMessage({ text: `🚨 Fallo crítico: ${e.message}`, type: 'error' });
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="window">
                <div className="title-bar">
                    <div className="title-bar-text">Gestión de Cobros / Retiros (v1.4 - UI Confirmation)</div>
                </div>
                <div className="window-body">
                    {statusMessage && (
                        <div style={{ 
                            padding: '10px', 
                            marginBottom: '15px', 
                            border: '2px solid',
                            borderColor: statusMessage.type === 'success' ? 'green' : (statusMessage.type === 'error' ? 'red' : 'blue'),
                            backgroundColor: statusMessage.type === 'success' ? '#e6fffa' : (statusMessage.type === 'error' ? '#fff5f5' : '#ebf8ff'),
                            fontWeight: 'bold'
                        }}>
                            {statusMessage.text}
                            <button style={{ float: 'right', padding: '0 5px' }} onClick={() => setStatusMessage(null)}>X</button>
                        </div>
                    )}

                    <p>Aquí aparecen las solicitudes de creadores que quieren retirar dinero real de su <b>Cartera de Ingresos</b>.</p>
                    
                    <div className="sunken-panel" style={{ backgroundColor: 'white', marginTop: '10px', minHeight: '300px', padding: '10px', overflowX: 'auto' }}>
                        {loading ? <p>Cargando datos...</p> : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>
                                        <th style={{ padding: '8px' }}>Usuario</th>
                                        <th style={{ padding: '8px' }}>Cantidad (€)</th>
                                        <th style={{ padding: '8px' }}>Método</th>
                                        <th style={{ padding: '8px' }}>Detalles de Pago</th>
                                        <th style={{ padding: '8px' }}>Fecha</th>
                                        <th style={{ padding: '8px' }}>Estado</th>
                                        <th style={{ padding: '8px' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {withdrawals.length === 0 && (
                                        <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: 'gray' }}>No hay solicitudes registradas.</td></tr>
                                    )}
                                    {withdrawals.map((w) => (
                                        <tr key={w.id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '8px', fontWeight: 'bold' }}>{w.user_handle}</td>
                                            <td style={{ padding: '8px' }}>
                                                <span style={{ 
                                                    fontWeight: 'bold', 
                                                    fontSize: '18px',
                                                    color: '#000'
                                                }}>
                                                    {w.amount} €
                                                </span>
                                            </td>
                                            <td style={{ padding: '8px' }}>
                                                <span style={{ textTransform: 'uppercase', fontSize: '13px', padding: '2px 5px', backgroundColor: '#e1e1e1', borderRadius: '3px', fontWeight: 'bold' }}>
                                                    {w.method === 'bank' ? 'BANCO / IBAN' : w.method.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ padding: '8px', fontSize: '13px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px' }}>
                                                    <span style={{ wordBreak: 'break-all', flex: 1 }}>{w.details?.info || JSON.stringify(w.details)}</span>
                                                    <button 
                                                        onClick={() => {
                                                            const textToCopy = w.details?.info || JSON.stringify(w.details);
                                                            navigator.clipboard.writeText(textToCopy);
                                                        }}
                                                        style={{
                                                            background: 'none',
                                                            border: '1px solid #ccc',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            padding: '4px 8px',
                                                            fontSize: '11px',
                                                            backgroundColor: '#f9f9f9',
                                                            flexShrink: 0
                                                        }}
                                                        title="Copiar detalles"
                                                    >
                                                        📋 Copiar
                                                    </button>
                                                </div>
                                            </td>
                                            <td style={{ padding: '8px', fontSize: '13px', color: '#444' }}>
                                                {new Date(w.created_at).toLocaleString()}
                                            </td>
                                            <td style={{ padding: '8px' }}>
                                                {(() => {
                                                    switch (w.status) {
                                                        case 'pending':
                                                            return <span style={{ color: '#e65100', fontWeight: 'bold', fontSize: '13px' }}>PENDIENTE</span>;
                                                        case 'employee_approved':
                                                            return (
                                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                    <span style={{ color: '#ff9800', fontWeight: 'bold', fontSize: '13px' }}>PENDIENTE DIR</span>
                                                                    <span style={{ fontSize: '10px', color: '#666' }}>Aprobó: {w.details?.approved_by_employee || 'Empleado'}</span>
                                                                </div>
                                                            );
                                                        case 'director_approved':
                                                            return (
                                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                    <span style={{ color: '#4caf50', fontWeight: 'bold', fontSize: '13px' }}>PENDIENTE EMP</span>
                                                                    <span style={{ fontSize: '10px', color: '#666' }}>Aprobó: {w.details?.approved_by_director || 'Director'}</span>
                                                                </div>
                                                            );
                                                        case 'approved':
                                                            return <span style={{ color: '#2e7d32', fontWeight: 'bold', fontSize: '13px' }}>LIQUIDADO</span>;
                                                        case 'rejected':
                                                            return <span style={{ color: '#c62828', fontWeight: 'bold', fontSize: '13px' }}>RECHAZADO</span>;
                                                        default:
                                                            return <span style={{ color: '#666', fontWeight: 'bold', fontSize: '13px' }}>{w.status.toUpperCase()}</span>;
                                                    }
                                                })()}
                                            </td>
                                            <td style={{ padding: '8px', position: 'relative' }}>
                                                {(() => {
                                                    const isCompleted = w.status === 'approved' || w.status === 'rejected';
                                                    if (isCompleted) {
                                                        return <span style={{ color: '#666', fontSize: '13px', fontWeight: 'bold' }}>PROCESADO</span>;
                                                    }

                                                    const isDirector = employee?.role === 1;
                                                    const requiresDual = Number(w.amount) > 1000;
                                                    
                                                    let canApproveThis = true;
                                                    let disabledMessage = '';

                                                    if (requiresDual) {
                                                        if (w.status === 'employee_approved' && !isDirector) {
                                                            canApproveThis = false;
                                                            disabledMessage = 'Espera firma Director';
                                                        } else if (w.status === 'director_approved' && isDirector) {
                                                            canApproveThis = false;
                                                            disabledMessage = 'Espera firma Empleado';
                                                        }
                                                    }

                                                    return (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                            {requiresDual && (
                                                                <span style={{ fontSize: '9px', backgroundColor: '#e1f5fe', color: '#0288d1', padding: '2px', borderRadius: '3px', fontWeight: 'bold', width: 'fit-content' }}>
                                                                    🔒 Dual ({w.amount} €)
                                                                </span>
                                                            )}
                                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                                {confirmAction?.id === w.id ? (
                                                                    <div style={{ backgroundColor: '#ffeb3b', padding: '5px', borderRadius: '4px', display: 'flex', gap: '5px', zIndex: 10 }}>
                                                                        <button 
                                                                            className="confirm-btn"
                                                                            onClick={() => confirmAction && handleUpdateStatus(w.id, confirmAction.status)}
                                                                            style={{ backgroundColor: confirmAction?.status === 'approved' ? 'green' : 'red', color: 'white' }}
                                                                        >
                                                                            SÍ, {confirmAction?.status === 'approved' ? 'APROBAR' : 'RECHAZAR'}
                                                                        </button>
                                                                        <button onClick={() => setConfirmAction(null)}>NO</button>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        {canApproveThis ? (
                                                                            <button 
                                                                                disabled={processingId === w.id}
                                                                                onClick={() => setConfirmAction({ id: w.id, status: 'approved' })}
                                                                            >
                                                                                {processingId === w.id && confirmAction === null ? '...' : 'Aprobar'}
                                                                            </button>
                                                                        ) : (
                                                                            <span style={{ fontSize: '11px', color: '#888', fontStyle: 'italic', alignSelf: 'center' }}>
                                                                                {disabledMessage}
                                                                            </span>
                                                                        )}
                                                                        <button 
                                                                            disabled={processingId === w.id}
                                                                            onClick={() => setConfirmAction({ id: w.id, status: 'rejected' })}
                                                                            style={{ backgroundColor: '#ffcccc', color: 'red' }}
                                                                        >
                                                                            {processingId === w.id && confirmAction === null ? '...' : 'Rechazar'}
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '20px' }}>
                <div className="window" style={{ width: '400px' }}>
                    <div className="title-bar">
                        <div className="title-bar-text">Aviso al Administrador</div>
                    </div>
                    <div className="window-body">
                        <p style={{ color: 'blue' }}><b>Proceso sugerido:</b></p>
                        <ol>
                            <li>Revisa el email o cuenta bancaria del usuario.</li>
                            <li>Realiza la transferencia MANUAL.</li>
                            <li>Pulsa "Aprobar" para cerrar el ticket.</li>
                            <li>Si el usuario tiene datos falsos, pulsa "Rechazar". <b>Ahora el sistema devuelve las monedas automáticamente.</b></li>
                        </ol>
                    </div>
                </div>

                <div className="window" style={{ flex: 1 }}>
                    <div className="title-bar">
                        <div className="title-bar-text">Diagnóstico del Servidor (DEBUG)</div>
                    </div>
                    <div className="window-body">
                        <pre style={{ 
                            backgroundColor: '#000', 
                            color: '#0f0', 
                            padding: '10px', 
                            fontSize: '10px', 
                            height: '100px', 
                            overflowY: 'auto',
                            margin: 0
                        }}>
                            {debugInfo}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
}
