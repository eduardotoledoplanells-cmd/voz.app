'use client';

import React, { useState, useEffect } from 'react';
import '98.css';

export default function BillingPage() {
    const [data, setData] = useState<{ sales: any[], stats: any, redemptions: any[], creators: any[], campaigns: any[], companies: any[] } | null>(null);
    const [stripeData, setStripeData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'folders' | 'summary' | 'wallet' | 'packs' | 'journal' | 'payouts' | 'history' | 'ads_payments' | 'stripe'>('folders');

    const stripeSalesCount = React.useMemo(() => {
        if (!stripeData?.paymentIntents) return { counts: {}, totalRevenue: 0, totalSales: 0 };
        const counts: any = {};
        let totalRevenue = 0;
        let totalSales = 0;
        const packIdToPrice: any = { 'p1': 5, 'p2': 10, 'p3': 20, 'p4': 50, 'ps': 100 };
        stripeData.paymentIntents.forEach((pi: any) => {
            if (pi.status === 'succeeded' && pi.metadata?.packId) {
                const price = packIdToPrice[pi.metadata.packId];
                if (price) {
                    counts[price] = (counts[price] || 0) + 1;
                    totalRevenue += price;
                    totalSales += 1;
                }
            }
        });
        return { counts, totalRevenue, totalSales };
    }, [stripeData]);

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

    const fetchStripeData = async () => {
        try {
            const response = await fetch('/api/voz/stripe-stats');
            const result = await response.json();
            setStripeData(result);
        } catch (error) {
            console.error('Error fetching stripe data:', error);
        }
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/voz/billing');
            const result = await response.json();
            setData(result);
            await fetchStripeData();
        } catch (error) {
            console.error('Error fetching billing data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkAsPaid = async (redId: string) => {
        showWin98Modal(
            'Confirmación',
            '¿Quieres marcar esta solicitud como pagada?',
            'confirm',
            async () => {
                try {
                    const response = await fetch('/api/voz/redemptions', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: redId, status: 'completed' })
                    });
                    if (response.ok) {
                        showWin98Modal('Configuración', 'Pago registrado y archivado correctamente.');
                        fetchData();
                    } else {
                        showWin98Modal('Error', 'No se pudo actualizar el estado del pago.');
                    }
                } catch (error) {
                    showWin98Modal('Error', 'Error de conexión al procesar el pago.');
                }
            }
        );
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (isLoading) return <div style={{ padding: 20 }}>Cargando explorador de finanzas...</div>;
    if (!data) return <div style={{ padding: 20 }}>Error al cargar datos de facturación.</div>;

    const { sales = [], stats = {}, redemptions = [], creators = [], campaigns = [], companies = [] } = data;

    const renderFolders = () => (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '30px',
            padding: '40px',
            backgroundColor: 'white',
            flex: 1,
            border: '2px solid',
            borderColor: '#808080 #ffffff #ffffff #808080'
        }}>
            {[
                { id: 'summary', name: 'Resumen General.doc', icon: '📄' },
                { id: 'wallet', name: 'Monedas en el Aire.exe', icon: '🪙' },
                { id: 'packs', name: 'Ventas por Packs.xls', icon: '📊' },
                { id: 'journal', name: 'Libro Diario.log', icon: '📑' },
                { id: 'payouts', name: 'Pagos Pendientes.exe', icon: '🏦' },
                { id: 'ads_payments', name: 'Pagos Publicidad.exe', icon: '💰' },
                { id: 'stripe', name: 'Stripe Gateway.exe', icon: '💳' },
                { id: 'history', name: 'Transacciones Finalizadas.exe', icon: '✅' }
            ].map(folder => (
                <div
                    key={folder.id}
                    onClick={() => setViewMode(folder.id as any)}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        cursor: 'pointer',
                        padding: '10px',
                        borderRadius: '4px'
                    }}
                    className="folder-icon"
                >
                    <div style={{ position: 'relative' }}>
                        {folder.id === 'wallet' ? (
                            <img src="/coin-pixel.jpg" width="50" height="50" style={{ marginBottom: 10, borderRadius: '50%', border: '1px solid #808080' }} alt="Monedas" />
                        ) : (
                            <div style={{ fontSize: '50px', marginBottom: '10px' }}>{folder.icon}</div>
                        )}
                        {folder.id === 'payouts' && redemptions?.filter(r => r.status === 'approved').length > 0 && (
                            <div style={{
                                position: 'absolute',
                                top: -5,
                                right: -10,
                                backgroundColor: 'red',
                                color: 'white',
                                borderRadius: '50%',
                                width: 22,
                                height: 22,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                border: '1px solid white',
                                zIndex: 1,
                                fontWeight: 'bold',
                                boxShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                            }}>
                                {redemptions.filter(r => r.status === 'approved').length}
                            </div>
                        )}
                    </div>
                    <div style={{ fontSize: '13px', textAlign: 'center', fontWeight: 'bold' }}>{folder.name}</div>
                </div>
            ))}
        </div>
    );

    const renderContent = () => {
        const titleMap = {
            summary: 'Resumen General del Sistema',
            wallet: 'Control de Monedas Circulantes',
            packs: 'Desglose de Ventas por Producto',
            journal: 'Libro Diario de Transacciones (Ingresos y Gastos)',
            payouts: 'Gestión de Pagos Pendientes a Creadores',
            ads_payments: 'Control de Cobros por Publicidad',
            stripe: 'Stripe Gateway - ' + (stripeData?.account?.id || 'acct_1Sm1OD3BtXxsW9yn'),
            history: 'Archivo de Pagos a Creadores Realizados'
        };

        const formatCents = (amount: number) => (amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '€';

        return (
            <div className="window" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div className="title-bar">
                    <div className="title-bar-text">[{viewMode.toUpperCase()}] - {titleMap[viewMode as keyof typeof titleMap]}</div>
                    <div className="title-bar-controls">
                        <button aria-label="Close" onClick={() => setViewMode('folders')}></button>
                    </div>
                </div>
                <div className="window-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 10, overflowY: 'auto' }}>

                    <button onClick={() => setViewMode('folders')} style={{ marginBottom: 15, alignSelf: 'flex-start' }}>
                        ⬅️ Volver a Carpetas
                    </button>

                    {viewMode === 'stripe' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div style={{ display: 'flex', gap: 15 }}>
                                <fieldset style={{ flex: 1 }}>
                                    <legend>Balance en Stripe</legend>
                                    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: '100%' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '12px', color: '#666' }}>DISPONIBLE</div>
                                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#008000' }}>
                                                {stripeData?.balance?.available?.[0] ? formatCents(stripeData.balance.available[0].amount) : '0,00€'}
                                            </div>
                                        </div>
                                        <div style={{ borderLeft: '1px solid #ccc', height: '40px' }}></div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '12px', color: '#666' }}>PENDIENTE</div>
                                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#800000' }}>
                                                {stripeData?.balance?.pending?.[0] ? formatCents(stripeData.balance.pending[0].amount) : '0,00€'}
                                            </div>
                                        </div>
                                    </div>
                                </fieldset>

                                <fieldset style={{ flex: 1 }}>
                                    <legend>Información de Cuenta</legend>
                                    <div style={{ fontSize: '12px' }}>
                                        <div><strong>ID:</strong> {stripeData?.account?.id}</div>
                                        <div><strong>Tipo:</strong> {stripeData?.account?.type || 'Standard'}</div>
                                        <div><strong>País:</strong> {stripeData?.account?.country || 'ES'}</div>
                                        <div><strong>Sincronizado:</strong> {new Date(stripeData?.syncTime).toLocaleTimeString()}</div>
                                    </div>
                                </fieldset>
                            </div>

                            <div className="window">
                                <div className="title-bar">
                                    <div className="title-bar-text">Últimas Transacciones (PaymentIntents)</div>
                                </div>
                                <div className="window-body" style={{ padding: 0 }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', backgroundColor: '#c0c0c0' }}>
                                                <th style={{ padding: '8px', borderBottom: '1px solid black' }}>ID Pago</th>
                                                <th style={{ padding: '8px', borderBottom: '1px solid black' }}>Usuario</th>
                                                <th style={{ padding: '8px', borderBottom: '1px solid black' }}>Monto</th>
                                                <th style={{ padding: '8px', borderBottom: '1px solid black' }}>Estado</th>
                                                <th style={{ padding: '8px', borderBottom: '1px solid black' }}>Fecha</th>
                                            </tr>
                                        </thead>
                                        <tbody style={{ backgroundColor: 'white' }}>
                                            {stripeData?.paymentIntents?.map((pi: any) => (
                                                <tr key={pi.id} className="table-row-hover">
                                                    <td style={{ padding: '8px', borderBottom: '1px solid #dfdfdf', fontSize: '11px' }}>{pi.id}</td>
                                                    <td style={{ padding: '8px', borderBottom: '1px solid #dfdfdf', fontWeight: 'bold' }}>{pi.metadata?.userHandle || 'Anónimo'}</td>
                                                    <td style={{ padding: '8px', borderBottom: '1px solid #dfdfdf' }}>{formatCents(pi.amount)}</td>
                                                    <td style={{ padding: '8px', borderBottom: '1px solid #dfdfdf' }}>
                                                        <span style={{
                                                            padding: '2px 5px',
                                                            backgroundColor: pi.status === 'succeeded' ? '#dfd' : '#ffd',
                                                            border: '1px solid #888',
                                                            fontSize: '10px',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            {pi.status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '8px', borderBottom: '1px solid #dfdfdf', fontSize: '11px' }}>
                                                        {new Date(pi.created * 1000).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!stripeData?.paymentIntents || stripeData.paymentIntents.length === 0) && (
                                                <tr>
                                                    <td colSpan={5} style={{ textAlign: 'center', padding: '20px', opacity: 0.5 }}>No se encontraron transacciones recientes.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {viewMode === 'summary' && (
                        <div style={{ display: 'flex', gap: 20 }}>
                            <fieldset style={{ flex: 1 }}>
                                <legend>Estado de Ingresos</legend>
                                <h1 style={{ color: '#008000', fontSize: '32px' }}>
                                    {(stats.totalRevenue + stripeSalesCount.totalRevenue).toLocaleString()},00€
                                </h1>
                                <p style={{ fontSize: '11px' }}>
                                    Incluye {stats.totalRevenue}€ (Local/Publicidad) + {stripeSalesCount.totalRevenue}€ (Stripe).
                                </p>
                            </fieldset>
                            <fieldset style={{ flex: 1 }}>
                                <legend>Actividad Total</legend>
                                <h1 style={{ fontSize: '32px' }}>{sales.length + stripeSalesCount.totalSales}</h1>
                                <p style={{ fontSize: '11px' }}>
                                    {sales.length} locales + {stripeSalesCount.totalSales} transacciones en Stripe.
                                </p>
                            </fieldset>
                        </div>
                    )}

                    {viewMode === 'wallet' && (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <img src="/coin-pixel.jpg" width="80" height="80" style={{ marginBottom: 20, borderRadius: '50%', border: '2px solid #000' }} />
                            <h2 style={{ margin: '0 0 10px 0' }}>Control de Monedas en Circulación</h2>
                            <p style={{ maxWidth: 500, margin: '0 auto 20px auto', fontSize: '13px', lineHeight: '1.4' }}>
                                Este reporte muestra el total de <b>ROBcoins</b> que han sido compradas por los usuarios pero aún no han sido gastadas ni canjeadas. Representa una deuda técnica de servicios pendientes.
                            </p>
                            <div className="sunken-panel" style={{ display: 'inline-block', padding: '20px 40px', backgroundColor: '#fff' }}>
                                <div style={{ fontSize: '14px', marginBottom: 5 }}>TOTAL CIRCULANTE:</div>
                                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#000080' }}>{(stats.totalCirculatingCoins || 0).toLocaleString()} 🪙</div>
                            </div>
                        </div>
                    )}

                    {viewMode === 'packs' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-around', gap: 15, marginBottom: 25 }}>
                                {[5, 10, 20, 50, 100].map(p => {
                                    const sCount = stripeSalesCount.counts[p] || 0;
                                    const lCount = stats.packs?.[p]?.count || 0;
                                    const totalCount = sCount + lCount;
                                    return (
                                        <div key={p} style={{ textAlign: 'center', flex: 1 }}>
                                            <div style={{ fontWeight: 'bold', marginBottom: 5 }}>Pack {p}€</div>
                                            <div className="sunken-panel" style={{ padding: 20, backgroundColor: 'white', position: 'relative' }}>
                                                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{totalCount}</div>
                                                <div style={{ fontSize: '10px', color: '#666' }}>
                                                    {lCount} local + {sCount} Stripe
                                                </div>
                                                {sCount > 0 && (
                                                    <div style={{ position: 'absolute', top: 2, right: 2, fontSize: '12px' }} title="Ventas en Stripe">💳</div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {(() => {
                                let bestP = 5;
                                let max = -1;
                                [5, 10, 20, 50, 100].forEach(p => {
                                    const total = (stripeSalesCount.counts[p] || 0) + (stats.packs?.[p]?.count || 0);
                                    if (total > max) { max = total; bestP = p; }
                                });
                                return (
                                    <div style={{ marginTop: 20, padding: 10, backgroundColor: '#ffffcc', border: '1px solid #808080', marginBottom: 20 }}>
                                        <strong>Análisis:</strong> El paquete de <b>{bestP}€</b> es actualmente el más demandado (incluyendo ventas vía Stripe).
                                    </div>
                                );
                            })()}

                            {/* Desglose Fiscal de Packs */}
                            <div style={{ display: 'flex', gap: 20, marginTop: 20 }}>
                                <div className="window" style={{ flex: 1 }}>
                                    <div className="title-bar">
                                        <div className="title-bar-text">TOTAL BRUTO (Packs)</div>
                                    </div>
                                    <div className="window-body" style={{ textAlign: 'center', padding: '15px' }}>
                                        <h2 style={{ margin: 0, color: '#000080' }}>
                                            {(stats.totalRevenue - (stats.totalAdRevenue || 0)).toLocaleString()} €
                                        </h2>
                                        <p style={{ fontSize: '11px', margin: '5px 0 0 0' }}>Ingresos totales por venta de monedas</p>
                                    </div>
                                </div>

                                <div className="window" style={{ flex: 1 }}>
                                    <div className="title-bar">
                                        <div className="title-bar-text">IVA 21% (Packs)</div>
                                    </div>
                                    <div className="window-body" style={{ textAlign: 'center', padding: '15px' }}>
                                        <h2 style={{ margin: 0, color: '#800000' }}>
                                            {((stats.totalRevenue - (stats.totalAdRevenue || 0)) * 0.21).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                        </h2>
                                        <p style={{ fontSize: '11px', margin: '5px 0 0 0' }}>IVA a devengar de ventas directas</p>
                                    </div>
                                </div>

                                <div className="window" style={{ flex: 1 }}>
                                    <div className="title-bar">
                                        <div className="title-bar-text">TOTAL NETO (Packs)</div>
                                    </div>
                                    <div className="window-body" style={{ textAlign: 'center', padding: '15px' }}>
                                        <h2 style={{ margin: 0, color: '#008000' }}>
                                            {((stats.totalRevenue - (stats.totalAdRevenue || 0)) * 0.79).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                        </h2>
                                        <p style={{ fontSize: '11px', margin: '5px 0 0 0' }}>Beneficio neto tras impuestos</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {viewMode === 'payouts' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                            <p style={{ margin: 0, fontSize: '14px', color: '#000', lineHeight: '1.4' }}>Las siguientes solicitudes han sido <b>APROBADAS</b> por el equipo de creadores y requieren ejecución de pago:</p>

                            {redemptions.filter(r => r.status === 'approved').length === 0 ? (
                                <div style={{ padding: 40, textAlign: 'center', opacity: 0.5 }}>
                                    No hay pagos pendientes de ejecución.
                                </div>
                            ) : (
                                redemptions.filter(r => r.status === 'approved').map(req => {
                                    const creator = creators.find(c => c.id === req.creatorId);
                                    return (
                                        <div key={req.id} className="window" style={{ marginBottom: 10 }}>
                                            <div className="title-bar">
                                                <div className="title-bar-text">Orden de Pago: {creator?.userHandle || req.creatorId}</div>
                                            </div>
                                            <div className="window-body" style={{ display: 'flex', gap: 20, padding: 15 }}>
                                                <div style={{ flex: 1 }}>
                                                    <h3 style={{ margin: '0 0 10px 0', color: '#008000', fontSize: '18px' }}>Importe: {req.amountEuro},00€</h3>
                                                    <div className="field-row" style={{ fontSize: '13px' }}>
                                                        <label>Monto en Monedas:</label>
                                                        <span>{req.amountCoins} 🪙</span>
                                                    </div>
                                                </div>

                                                <div className="sunken-panel" style={{ flex: 2, padding: 15, backgroundColor: '#f5f5f5', border: '2px solid #808080' }}>
                                                    <div style={{ fontWeight: 'bold', marginBottom: 12, textDecoration: 'underline', fontSize: '14px', color: '#000080' }}>DATOS BANCARIOS:</div>
                                                    {creator?.paymentInfo ? (
                                                        <div style={{ fontSize: '15px', display: 'flex', flexDirection: 'column', gap: 8, color: '#000' }}>
                                                            <div><b style={{ color: '#555', fontSize: '12px' }}>Titular:</b> <span style={{ fontSize: '17px', fontWeight: 'bold' }}>{creator.paymentInfo.fullName}</span></div>
                                                            <div><b style={{ color: '#555', fontSize: '12px' }}>IBAN:</b> <span style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 'bold' }}>{creator.paymentInfo.iban}</span></div>
                                                        </div>
                                                    ) : (
                                                        <div style={{ color: 'red' }}>Faltan datos de pago.</div>
                                                    )}
                                                </div>

                                                <button
                                                    style={{ height: 40, padding: '0 15px', fontWeight: 'bold' }}
                                                    disabled={!creator?.paymentInfo?.iban}
                                                    onClick={() => handleMarkAsPaid(req.id)}
                                                >
                                                    💰 MARCAR COMO PAGADO
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {viewMode === 'ads_payments' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                            <div className="status-bar" style={{ backgroundColor: '#000080', color: 'yellow', padding: '10px', fontSize: '1.2em', fontWeight: 'bold' }}>
                                TOTAL BRUTO PUBLICIDAD: {(stats.totalAdRevenue || 0).toLocaleString()} €
                            </div>

                            <div className="sunken-panel" style={{ flex: 1, maxHeight: '300px', backgroundColor: 'white', overflowY: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', backgroundColor: '#c0c0c0', position: 'sticky', top: 0 }}>
                                            <th style={{ padding: '8px', borderBottom: '1px solid black' }}>Fecha</th>
                                            <th style={{ padding: '8px', borderBottom: '1px solid black' }}>Cliente</th>
                                            <th style={{ padding: '8px', borderBottom: '1px solid black' }}>Campaña</th>
                                            <th style={{ padding: '8px', borderBottom: '1px solid black' }}>Importe</th>
                                            <th style={{ padding: '8px', borderBottom: '1px solid black' }}>IVA 21%</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {campaigns.filter((c: any) => (c.investment || 0) > 0).map((c: any) => (
                                            <tr key={c.id} className="table-row-hover">
                                                <td style={{ padding: '8px', borderBottom: '1px solid #dfdfdf' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                                                <td style={{ padding: '8px', borderBottom: '1px solid #dfdfdf', fontWeight: 'bold' }}>
                                                    {companies.find((comp: any) => comp.id === c.companyId)?.name || 'N/A'}
                                                </td>
                                                <td style={{ padding: '8px', borderBottom: '1px solid #dfdfdf' }}>{c.name}</td>
                                                <td style={{ padding: '8px', borderBottom: '1px solid #dfdfdf', color: 'green', fontWeight: 'bold' }}>
                                                    {c.investment.toLocaleString()} €
                                                </td>
                                                <td style={{ padding: '8px', borderBottom: '1px solid #dfdfdf', fontSize: '0.9em' }}>
                                                    {(c.investment * 0.21).toFixed(2)}€
                                                </td>
                                            </tr>
                                        )).reverse()}
                                        {campaigns.filter((c: any) => (c.investment || 0) > 0).length === 0 && (
                                            <tr>
                                                <td colSpan={5} style={{ textAlign: 'center', padding: '20px', opacity: 0.5 }}>No hay registros de publicidad.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Desglose Fiscal Final */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, gap: 20 }}>
                                <div className="window" style={{ flex: 1 }}>
                                    <div className="title-bar">
                                        <div className="title-bar-text">TOTAL NETO (Beneficio Real)</div>
                                    </div>
                                    <div className="window-body" style={{ textAlign: 'center', padding: '15px' }}>
                                        <h2 style={{ margin: 0, color: '#008000' }}>
                                            {((stats.totalAdRevenue || 0) * 0.79).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                        </h2>
                                        <p style={{ fontSize: '10px', margin: '5px 0 0 0' }}>Excluyendo 21% de IVA estimado</p>
                                    </div>
                                </div>

                                <div className="window" style={{ flex: 1 }}>
                                    <div className="title-bar">
                                        <div className="title-bar-text">IVA 21% (A pagar)</div>
                                    </div>
                                    <div className="window-body" style={{ textAlign: 'center', padding: '15px' }}>
                                        <h2 style={{ margin: 0, color: '#800000' }}>
                                            {((stats.totalAdRevenue || 0) * 0.21).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                                        </h2>
                                        <p style={{ fontSize: '10px', margin: '5px 0 0 0' }}>Impuestos retenidos para Hacienda</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {viewMode === 'history' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                            <p style={{ margin: 0, fontSize: '14px' }}>Historial de pagos completados:</p>
                            <div className="sunken-panel" style={{ flex: 1, backgroundColor: 'white', overflowY: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', backgroundColor: '#c0c0c0' }}>
                                            <th style={{ padding: '8px', borderBottom: '1px solid black' }}>Creador</th>
                                            <th style={{ padding: '8px', borderBottom: '1px solid black' }}>Importe</th>
                                            <th style={{ padding: '8px', borderBottom: '1px solid black' }}>Fecha</th>
                                            <th style={{ padding: '8px', borderBottom: '1px solid black' }}>Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {redemptions.filter(r => r.status === 'completed').map(req => {
                                            const creator = creators.find(c => c.id === req.creatorId);
                                            return (
                                                <tr key={req.id} className="table-row-hover">
                                                    <td style={{ padding: '8px', borderBottom: '1px solid #dfdfdf' }}>{creator?.userHandle || req.creatorId}</td>
                                                    <td style={{ padding: '8px', borderBottom: '1px solid #dfdfdf', color: 'red' }}>-{req.amountEuro},00€</td>
                                                    <td style={{ padding: '8px', borderBottom: '1px solid #dfdfdf' }}>{new Date(req.requestedAt).toLocaleDateString()}</td>
                                                    <td style={{ padding: '8px', borderBottom: '1px solid #dfdfdf', color: 'green' }}>COMPLETADO</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {viewMode === 'journal' && (
                        <div className="sunken-panel" style={{ flex: 1, backgroundColor: 'white', overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#c0c0c0', zIndex: 1 }}>
                                    <tr style={{ textAlign: 'left' }}>
                                        <th style={{ padding: '8px', borderBottom: '1px solid black' }}>Desc</th>
                                        <th style={{ padding: '8px', borderBottom: '1px solid black' }}>Usuario/Creador</th>
                                        <th style={{ padding: '8px', borderBottom: '1px solid black' }}>Monto</th>
                                        <th style={{ padding: '8px', borderBottom: '1px solid black' }}>Fecha</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        ...sales.map(s => ({ type: 'IN', title: `Venta Pack ${s.packType}€`, user: s.userHandle, amount: s.price, date: s.timestamp })),
                                        ...campaigns.filter((c: any) => (c.investment || 0) > 0).map((c: any) => ({
                                            type: 'IN',
                                            title: `Publicidad: ${c.name}`,
                                            user: companies.find((comp: any) => comp.id === c.companyId)?.name || 'Cliente',
                                            amount: c.investment,
                                            date: c.createdAt
                                        })),
                                        ...redemptions.filter(r => r.status === 'completed').map(r => {
                                            const c = creators.find(cr => cr.id === r.creatorId);
                                            return { type: 'OUT', title: 'Pago a Creador', user: c?.userHandle || r.creatorId, amount: r.amountEuro, date: r.requestedAt };
                                        })
                                    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((item, idx) => (
                                        <tr key={idx} className="table-row-hover">
                                            <td style={{ padding: '8px', borderBottom: '1px solid #dfdfdf' }}>{item.title}</td>
                                            <td style={{ padding: '8px', borderBottom: '1px solid #dfdfdf', fontWeight: 'bold' }}>{item.user}</td>
                                            <td style={{ padding: '8px', borderBottom: '1px solid #dfdfdf', color: item.type === 'IN' ? 'green' : 'red', fontWeight: 'bold' }}>
                                                {item.type === 'IN' ? '+' : '-'}{item.amount}€
                                            </td>
                                            <td style={{ padding: '8px', borderBottom: '1px solid #dfdfdf' }}>{new Date(item.date).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                <div className="status-bar">
                    <p className="status-bar-field">Estado: {viewMode === 'folders' ? 'Explorando' : 'Viendo ' + viewMode}</p>
                    <p className="status-bar-field">VOZ Finance System</p>
                </div>
            </div>
        );
    };

    return (
        <div style={{ padding: 15, height: '85vh', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>📂 C:\Admin\Finanzas</h3>
                <div style={{ display: 'flex', gap: 5 }}>
                    <button onClick={() => fetchData()}>Refrescar</button>
                    <button onClick={() => setViewMode('folders')}>Carpetas</button>
                </div>
            </div>

            {viewMode === 'folders' ? renderFolders() : renderContent()}

            {modal.show && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div className="window" style={{ width: 300 }}>
                        <div className="title-bar">
                            <div className="title-bar-text">{modal.title}</div>
                            <div className="title-bar-controls">
                                <button aria-label="Close" onClick={() => setModal({ ...modal, show: false })}></button>
                            </div>
                        </div>
                        <div className="window-body" style={{ textAlign: 'center' }}>
                            <p style={{ marginBottom: 15 }}>{modal.message}</p>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                                <button style={{ minWidth: 60 }} onClick={() => {
                                    if (modal.onConfirm) modal.onConfirm();
                                    setModal({ ...modal, show: false });
                                }}>Aceptar</button>
                                {modal.type === 'confirm' && (
                                    <button style={{ minWidth: 60 }} onClick={() => setModal({ ...modal, show: false })}>Cancelar</button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .folder-icon:hover { background-color: #000080; color: white; }
                .table-row-hover:hover { background-color: #000080; color: white; }
                .table-row-hover:hover td { color: white !important; }
            `}</style>
        </div>
    );
}
