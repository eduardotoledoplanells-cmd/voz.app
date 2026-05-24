'use client';
import { useState, useEffect } from 'react';
import '98.css';

export default function WithdrawalsPage() {
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [debugInfo, setDebugInfo] = useState<string>('');

    const fetchWithdrawals = async () => {
        setLoading(true);
        setDebugInfo('Fetching withdrawals from automated Stripe Connect system...');
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

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="window">
                <div className="title-bar">
                    <div className="title-bar-text">Auditoría de Retiros Automatizados (Stripe Connect)</div>
                </div>
                <div className="window-body">
                    <p>Historial inmutable de retiros procesados automáticamente. Los retiros ahora se liquidan a través de Stripe Express, reteniendo automáticamente el 25% para VOZ.</p>
                    
                    <div className="sunken-panel" style={{ backgroundColor: 'white', marginTop: '10px', minHeight: '300px', padding: '10px', overflowX: 'auto' }}>
                        {loading ? <p>Cargando datos...</p> : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>
                                        <th style={{ padding: '8px' }}>Usuario</th>
                                        <th style={{ padding: '8px' }}>Bruto Retirado</th>
                                        <th style={{ padding: '8px' }}>Neto Creador (75%)</th>
                                        <th style={{ padding: '8px' }}>Comisión VOZ (25%)</th>
                                        <th style={{ padding: '8px' }}>Stripe Tx ID</th>
                                        <th style={{ padding: '8px' }}>Fecha</th>
                                        <th style={{ padding: '8px' }}>Estado Payout</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {withdrawals.length === 0 && (
                                        <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: 'gray' }}>No hay solicitudes registradas.</td></tr>
                                    )}
                                    {withdrawals.map((w) => (
                                        <tr key={w.id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '8px', fontWeight: 'bold' }}>{w.user_handle || w.user_id}</td>
                                            <td style={{ padding: '8px', fontWeight: 'bold' }}>{w.amount} €</td>
                                            <td style={{ padding: '8px', color: '#2e7d32' }}>{w.net_amount || (w.amount * 0.75).toFixed(2)} €</td>
                                            <td style={{ padding: '8px', color: '#c62828' }}>{w.fee_amount || (w.amount * 0.25).toFixed(2)} €</td>
                                            <td style={{ padding: '8px', fontSize: '11px', fontFamily: 'monospace' }}>
                                                {w.stripe_transfer_id || w.stripe_payout_id || 'N/A'}
                                            </td>
                                            <td style={{ padding: '8px', fontSize: '13px', color: '#444' }}>
                                                {new Date(w.created_at).toLocaleString()}
                                            </td>
                                            <td style={{ padding: '8px' }}>
                                                {w.status === 'approved' ? (
                                                    <span style={{ color: '#2e7d32', fontWeight: 'bold', fontSize: '13px' }}>LIQUIDADO</span>
                                                ) : w.status === 'rejected' ? (
                                                    <span style={{ color: '#c62828', fontWeight: 'bold', fontSize: '13px' }}>RECHAZADO/ERROR</span>
                                                ) : (
                                                    <span style={{ color: '#ff9800', fontWeight: 'bold', fontSize: '13px' }}>PROCESANDO</span>
                                                )}
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
                        <p style={{ color: 'blue' }}><b>Información del nuevo sistema:</b></p>
                        <ul>
                            <li>Las aprobaciones manuales han sido desactivadas.</li>
                            <li>Los retiros se ejecutan automáticamente a las cuentas bancarias de los creadores a través de Stripe Connect.</li>
                            <li>La comisión del 25% de VOZ queda retenida en nuestra cuenta de Stripe, de la cual Stripe NO nos deducirá costos operativos de los 'payouts' de los creadores.</li>
                        </ul>
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
