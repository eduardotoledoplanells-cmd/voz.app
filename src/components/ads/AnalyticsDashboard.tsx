'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
    PieChart, Pie, Cell, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    ResponsiveContainer,
    AreaChart, Area,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    Brush
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Metrics {
    totalImpressions: number;
    totalClicks: number;
    ctr: number;
    totalBudget: number;
    deviceData: { name: string; value: number }[];
    retentionData: { name: string; rate: number }[];
    temporalData: { name: string; impressions: number; clicks: number }[];
}

const EMPTY_METRICS: Metrics = {
    totalImpressions: 0,
    totalClicks: 0,
    ctr: 0,
    totalBudget: 0,
    deviceData: [
        { name: 'App iOS', value: 0 },
        { name: 'App Android', value: 0 },
        { name: 'Web Desktop', value: 0 },
        { name: 'Web Mobile', value: 0 },
    ],
    retentionData: [
        { name: '3s', rate: 0 },
        { name: '25%', rate: 0 },
        { name: '50%', rate: 0 },
        { name: '75%', rate: 0 },
        { name: '100%', rate: 0 },
    ],
    temporalData: [],
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

// ─── Skeleton / Spinner ───────────────────────────────────────────────────────
function Skeleton({ height = 300 }: { height?: number }) {
    return (
        <div style={{
            width: '100%',
            height,
            borderRadius: '8px',
            background: 'linear-gradient(90deg, #e8e8e8 25%, #f4f4f4 50%, #e8e8e8 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.4s infinite',
        }}>
            <style>{`
                @keyframes shimmer {
                    0%   { background-position: -200% 0; }
                    100% { background-position:  200% 0; }
                }
            `}</style>
        </div>
    );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, color = '#1a1a1a', loading }: {
    label: string; value: string; color?: string; loading: boolean;
}) {
    return (
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: 8 }}>{label}</div>
            {loading
                ? <Skeleton height={36} />
                : <div style={{ fontSize: '28px', fontWeight: 'bold', color }}>{value}</div>
            }
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AnalyticsDashboard({ campaigns, companies }: { campaigns: any[]; companies: any[] }) {
    const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
    const [selectedCompany,  setSelectedCompany]  = useState<string>('all');
    const [dateRange,        setDateRange]        = useState<string>('30d');
    const [metrics,          setMetrics]          = useState<Metrics>(EMPTY_METRICS);
    const [loading,          setLoading]          = useState(true);
    const [error,            setError]            = useState<string | null>(null);
    const [exporting,        setExporting]        = useState(false);

    // ── Fetch real metrics from API ──────────────────────────────────────────
    const fetchMetrics = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                campaignId: selectedCampaign,
                companyId:  selectedCompany,
                dateRange,
            });
            const res = await fetch(`/api/ads/analytics?${params.toString()}`);
            const json = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(json.error || 'Error al obtener datos');
            }
            setMetrics(json.metrics);
        } catch (err: any) {
            console.error('[AnalyticsDashboard] fetch error:', err.message);
            setError('No se pudieron cargar las métricas. Inténtalo de nuevo.');
            setMetrics(EMPTY_METRICS);
        } finally {
            setLoading(false);
        }
    }, [selectedCampaign, selectedCompany, dateRange]);

    useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

    // ── PDF Export ───────────────────────────────────────────────────────────
    const handleExportPDF = async () => {
        setExporting(true);
        try {
            const html2canvas = (await import('html2canvas')).default;
            const jsPDF       = (await import('jspdf')).default;
            const element = document.getElementById('analytics-report');
            if (element) {
                const canvas   = await html2canvas(element, { scale: 2 });
                const imgData  = canvas.toDataURL('image/png');
                const pdf      = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`LYVO_Reporte_Publicidad_${new Date().toISOString().split('T')[0]}.pdf`);
            }
        } catch (e) {
            console.error('Export failed', e);
            alert('Error al exportar PDF');
        }
        setExporting(false);
    };

    const noData = !loading && metrics.totalImpressions === 0;

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f0f2f5', height: '100%', overflowY: 'auto' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ margin: 0, color: '#1a1a1a' }}>📊 Analítica en Tiempo Real</h2>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button
                        onClick={fetchMetrics}
                        disabled={loading}
                        style={{ padding: '10px 16px', backgroundColor: '#f4f5f7', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }}
                    >
                        {loading ? '⏳' : '🔄 Actualizar'}
                    </button>
                    <button
                        onClick={handleExportPDF}
                        disabled={exporting || loading}
                        style={{ padding: '10px 20px', backgroundColor: '#0052cc', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        {exporting ? 'Generando PDF...' : '📥 Exportar Informe (PDF)'}
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', backgroundColor: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <select value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
                    <option value="all">Todos los Clientes</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={selectedCampaign} onChange={e => setSelectedCampaign(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
                    <option value="all">Todas las Campañas</option>
                    {campaigns
                        .filter(c => selectedCompany === 'all' || c.companyId === selectedCompany)
                        .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={dateRange} onChange={e => setDateRange(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
                    <option value="7d">Últimos 7 días</option>
                    <option value="30d">Últimos 30 días</option>
                    <option value="year">Este Año</option>
                </select>
            </div>

            {/* Error banner */}
            {error && (
                <div style={{ background: '#fff0f0', border: '1px solid #ffcccc', color: '#cc0000', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px' }}>
                    ⚠️ {error}
                </div>
            )}

            <div id="analytics-report">

                {/* KPIs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                    <KpiCard label="Impresiones Totales"   value={metrics.totalImpressions.toLocaleString()} loading={loading} />
                    <KpiCard label="Clics Totales"         value={metrics.totalClicks.toLocaleString()}      loading={loading} />
                    <KpiCard label="CTR Real"              value={`${metrics.ctr.toFixed(2)}%`}             loading={loading} color="#0052cc" />
                    <KpiCard label="Inversión Total"       value={`${metrics.totalBudget.toLocaleString()} €`} loading={loading} color="#00875a" />
                </div>

                {/* No data banner */}
                {noData && !error && (
                    <div style={{ background: '#fffbe6', border: '1px solid #ffe58f', color: '#7c5500', padding: '16px 20px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
                        📭 <strong>Sin datos registrados</strong> — Aún no hay impresiones ni clics en el período seleccionado. Las gráficas se mostrarán en cuanto comiencen a registrarse eventos reales.
                    </div>
                )}

                {/* Gráficas fila 1 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

                    {/* Distribución por plataforma */}
                    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ marginTop: 0, color: '#333' }}>Distribución por Plataforma</h3>
                        {loading ? <Skeleton height={300} /> : noData ? (
                            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>Sin datos registrados</div>
                        ) : (
                            <div style={{ height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={metrics.deviceData} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                                            {metrics.deviceData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => value.toLocaleString()} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* Retención de vídeo */}
                    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ marginTop: 0, color: '#333' }}>Retención de Vídeo (Funnel Real)</h3>
                        {loading ? <Skeleton height={300} /> : noData ? (
                            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>Sin datos registrados</div>
                        ) : (
                            <div style={{ height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={metrics.retentionData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} />
                                        <YAxis dataKey="name" type="category" />
                                        <Tooltip formatter={(value: number) => `${value}%`} />
                                        <Bar dataKey="rate" fill="#8884d8" barSize={30}>
                                            {metrics.retentionData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>

                {/* Gráficas fila 2 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

                    {/* Engagement table */}
                    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ marginTop: 0, color: '#333' }}>Resumen de Engagement</h3>
                        {loading ? <Skeleton height={200} /> : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #eee' }}>
                                        <th style={{ padding: '10px' }}>Métrica</th>
                                        <th style={{ padding: '10px' }}>Valor Real</th>
                                        <th style={{ padding: '10px' }}>Tasa</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { icon: '👁️', label: 'Impresiones', value: metrics.totalImpressions, rate: null },
                                        { icon: '🔗', label: 'Clics Salientes', value: metrics.totalClicks, rate: metrics.ctr },
                                    ].map(row => (
                                        <tr key={row.label} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '10px' }}>{row.icon} {row.label}</td>
                                            <td style={{ padding: '10px', fontWeight: 'bold' }}>{row.value.toLocaleString()}</td>
                                            <td style={{ padding: '10px', color: '#0052cc' }}>
                                                {row.rate !== null ? `${row.rate.toFixed(2)}%` : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        {!loading && noData && (
                            <p style={{ color: '#999', textAlign: 'center', marginTop: 12 }}>Sin datos registrados</p>
                        )}
                    </div>

                    {/* Device breakdown detail */}
                    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ marginTop: 0, color: '#333' }}>Detalle por Canal</h3>
                        {loading ? <Skeleton height={200} /> : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #eee' }}>
                                        <th style={{ padding: '10px' }}>Canal</th>
                                        <th style={{ padding: '10px' }}>Impresiones</th>
                                        <th style={{ padding: '10px' }}>% del Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {metrics.deviceData.map(row => (
                                        <tr key={row.name} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '10px' }}>{row.name}</td>
                                            <td style={{ padding: '10px', fontWeight: 'bold' }}>{row.value.toLocaleString()}</td>
                                            <td style={{ padding: '10px', color: '#555' }}>
                                                {metrics.totalImpressions > 0 ? `${((row.value / metrics.totalImpressions) * 100).toFixed(1)}%` : '0%'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        {!loading && noData && (
                            <p style={{ color: '#999', textAlign: 'center', marginTop: 12 }}>Sin datos registrados</p>
                        )}
                    </div>
                </div>

                {/* Evolución temporal */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                    <h3 style={{ marginTop: 0, color: '#333' }}>Evolución Temporal Real (Impresiones vs Clics)</h3>
                    {loading ? <Skeleton height={350} /> : noData ? (
                        <div style={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>Sin datos registrados</div>
                    ) : (
                        <div style={{ height: 350 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={metrics.temporalData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorImp" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%"  stopColor="#8884d8" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorClk" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%"  stopColor="#82ca9d" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <Tooltip />
                                    <Legend />
                                    <Area type="monotone" dataKey="impressions" name="Impresiones" stroke="#8884d8" fillOpacity={1} fill="url(#colorImp)" />
                                    <Area type="monotone" dataKey="clicks"      name="Clics"       stroke="#82ca9d" fillOpacity={1} fill="url(#colorClk)" />
                                    {metrics.temporalData.length > 7 && (
                                        <Brush dataKey="name" height={30} stroke="#8884d8" startIndex={0} endIndex={9} />
                                    )}
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
