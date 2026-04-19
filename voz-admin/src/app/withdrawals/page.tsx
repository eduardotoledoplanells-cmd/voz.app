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
        setDebugInfo(`Starting PATCH for ${id} -> ${newStatus}`);

        try {
            const res = await fetch(`/api/voz/wallet/withdrawals?t=${Date.now()}`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
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
                                        <th style={{ padding: '8px' }}>Cantidad (🪙)</th>
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
                                            <td style={{ padding: '8px' }}>{w.amount} 🪙</td>
                                            <td style={{ padding: '8px' }}>
                                                <span style={{ textTransform: 'uppercase', fontSize: '10px', padding: '2px 5px', backgroundColor: '#e1e1e1', borderRadius: '3px' }}>
                                                    {w.method}
                                                </span>
                                            </td>
                                            <td style={{ padding: '8px', fontSize: '11px' }}>
                                                {w.details?.info || JSON.stringify(w.details)}
                                            </td>
                                            <td style={{ padding: '8px', fontSize: '11px', color: 'gray' }}>
                                                {new Date(w.created_at).toLocaleString()}
                                            </td>
                                            <td style={{ padding: '8px' }}>
                                                <span style={{ 
                                                    fontWeight: 'bold', 
                                                    color: w.status === 'pending' ? 'orange' : w.status === 'approved' ? 'green' : 'red' 
                                                }}>
                                                    {w.status === 'pending' ? 'PENDIENTE' : w.status === 'approved' ? 'APROBADO' : 'RECHAZADO'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '8px', position: 'relative' }}>
                                                {w.status === 'pending' && (
                                                    <div style={{ display: 'flex', gap: '5px' }}>
                                                        {confirmAction?.id === w.id ? (
                                                            <div style={{ backgroundColor: '#ffeb3b', padding: '5px', borderRadius: '4px', display: 'flex', gap: '5px', zIndex: 10 }}>
                                                                <button 
                                                                    className="confirm-btn"
                                                                    onClick={() => confirmAction && handleUpdateStatus(w.id, confirmAction.status)}
                                                                    style={{ backgroundColor: confirmAction?.status === 'approved' ? 'green' : 'red', color: 'white' }}
                                                                >
                                                                    SÍ, {confirmAction?.status.toUpperCase()}
                                                                </button>
                                                                <button onClick={() => setConfirmAction(null)}>NO</button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <button 
                                                                    disabled={processingId === w.id}
                                                                    onClick={() => setConfirmAction({ id: w.id, status: 'approved' })}
                                                                >
                                                                    {processingId === w.id && confirmAction === null ? '...' : 'Aprobar'}
                                                                </button>
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
                                                )}
                                                {w.status !== 'pending' && <span style={{ color: 'gray', fontSize: '10px' }}>Procesado</span>}
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
