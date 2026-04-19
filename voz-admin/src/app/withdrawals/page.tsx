'use client';
import { useState, useEffect } from 'react';
import '98.css';

export default function WithdrawalsPage() {
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchWithdrawals = async () => {
        try {
            const res = await fetch('/api/voz/wallet/withdrawals');
            const data = await res.json();
            if (data.success) {
                setWithdrawals(data.withdrawals);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWithdrawals();
    }, []);

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        if (!confirm(`¿Estás seguro de marcar esta solicitud como ${newStatus}?`)) return;
        
        try {
            const res = await fetch('/api/voz/wallet/withdrawals', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus })
            });
            if (res.ok) {
                fetchWithdrawals();
            } else {
                alert('Error al actualizar');
            }
        } catch (e) {
            alert('Fallo de red');
        }
    };

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="window">
                <div className="title-bar">
                    <div className="title-bar-text">Gestión de Cobros / Retiros (Doble Cartera)</div>
                </div>
                <div className="window-body">
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
                                                    {w.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ padding: '8px', display: 'flex', gap: '5px' }}>
                                                {w.status === 'pending' && (
                                                    <>
                                                        <button onClick={() => handleUpdateStatus(w.id, 'approved')}>Aprobar</button>
                                                        <button onClick={() => handleUpdateStatus(w.id, 'rejected')}>Rechazar</button>
                                                    </>
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

            <div className="window" style={{ width: '400px' }}>
                <div className="title-bar">
                    <div className="title-bar-text">Aviso al Administrador</div>
                </div>
                <div className="window-body">
                    <p style={{ color: 'blue' }}><b>Proceso sugerido:</b></p>
                    <ol>
                        <li>Revisa el email o cuenta bancaria del usuario.</li>
                        <li>Realiza la transferencia MANUAL desde tu cuenta de PayPal o Banco.</li>
                        <li>Una vez enviado el dinero real, pulsa "Aprobar" aquí para cerrar el ticket.</li>
                        <li>Si el usuario tiene datos falsos, pulsa "Rechazar" (esto NO devuelve el dinero automáticamente, deberás gestionarlo con soporte).</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
