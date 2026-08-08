import React, { useState, useEffect } from 'react';
import {
    PieChart, Pie, Cell, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    LineChart, Line, ResponsiveContainer,
    AreaChart, Area, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Brush
} from 'recharts';

export default function AnalyticsDashboard({ campaigns, companies }: { campaigns: any[], companies: any[] }) {
    const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
    const [selectedCompany, setSelectedCompany] = useState<string>('all');
    const [dateRange, setDateRange] = useState<string>('30d');
    const [exporting, setExporting] = useState(false);

    // Mock data generation based on actual campaigns
    const getFilteredCampaigns = () => {
        let filtered = campaigns;
        if (selectedCampaign !== 'all') filtered = filtered.filter(c => c.id === selectedCampaign);
        if (selectedCompany !== 'all') filtered = filtered.filter(c => c.companyId === selectedCompany);
        return filtered;
    };

    const filtered = getFilteredCampaigns();
    const totalImpressions = filtered.reduce((sum, c) => sum + (c.impressions || 0), 0);
    const totalSpent = filtered.reduce((sum, c) => sum + (c.budget || 0), 0);

    // Pseudo-random factor based on selected IDs so it changes per client/campaign
    const hash = (selectedCompany + selectedCampaign).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const baseCtr = 2.5 + (hash % 40) / 10; // Between 2.5% and 6.5%
    const totalClicks = Math.floor(totalImpressions * (baseCtr / 100));
    
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    // Vary device distribution
    const iosPerc = 0.35 + (hash % 20) / 100;
    const androidPerc = 0.40 + ((hash * 2) % 15) / 100;
    const desktopPerc = 0.15 + ((hash * 3) % 10) / 100;
    const mobilePerc = 1 - (iosPerc + androidPerc + desktopPerc);

    const deviceData = [
        { name: 'App iOS', value: Math.floor(totalImpressions * iosPerc) },
        { name: 'App Android', value: Math.floor(totalImpressions * androidPerc) },
        { name: 'Web Desktop', value: Math.floor(totalImpressions * desktopPerc) },
        { name: 'Web Mobile', value: Math.floor(totalImpressions * mobilePerc) },
    ];

    // Vary retention
    const drop1 = 10 + (hash % 15);
    const drop2 = drop1 + 15 + (hash % 10);
    const drop3 = drop2 + 15 + ((hash*2) % 15);
    const drop4 = drop3 + 10 + ((hash*3) % 15);

    const retentionData = [
        { name: '3s', rate: 100 },
        { name: '25%', rate: 100 - drop1 },
        { name: '50%', rate: 100 - drop2 },
        { name: '75%', rate: 100 - drop3 },
        { name: '100%', rate: Math.max(5, 100 - drop4) },
    ];

    const interestData = [
        { subject: 'Deportes', A: 80 + (hash % 20), fullMark: 100 },
        { subject: 'Moda', A: 40 + ((hash*2) % 30), fullMark: 100 },
        { subject: 'Tecnología', A: 90 + (hash % 10), fullMark: 100 },
        { subject: 'Gaming', A: 60 + ((hash*3) % 40), fullMark: 100 },
        { subject: 'Música', A: 70 + ((hash*4) % 25), fullMark: 100 },
        { subject: 'Viajes', A: 50 + ((hash*5) % 30), fullMark: 100 },
    ];

    const getTemporalData = () => {
        let points = 7;
        let labelPrefix = 'Día';
        if (dateRange === '30d') points = 30;
        if (dateRange === 'year') {
            points = 12;
            labelPrefix = 'Mes';
        }

        // Generate pseudo-random weights based on hash
        const weights = Array.from({ length: points }, (_, i) => 1 + ((hash * (i + 1)) % 10));
        const totalWeight = weights.reduce((a, b) => a + b, 0);

        return weights.map((w, i) => {
            const fraction = w / totalWeight;
            return {
                name: `${labelPrefix} ${i + 1}`,
                impressions: Math.floor(totalImpressions * fraction),
                clicks: Math.floor(totalClicks * fraction)
            };
        });
    };

    const temporalData = getTemporalData();
    
    const engagementMetrics = {
        likes: Math.floor(totalImpressions * (0.02 + (hash % 3)/100)),
        comments: Math.floor(totalImpressions * (0.005 + (hash % 2)/100)),
        shares: Math.floor(totalImpressions * (0.01 + (hash % 2)/100)),
        saves: Math.floor(totalImpressions * (0.015 + (hash % 3)/100)),
        outboundClicks: totalClicks
    };


    const handleExportPDF = async () => {
        setExporting(true);
        try {
            const html2canvas = (await import('html2canvas')).default;
            const jsPDF = (await import('jspdf')).default;
            
            const element = document.getElementById('analytics-report');
            if (element) {
                const canvas = await html2canvas(element, { scale: 2 });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`LYVO_Reporte_Publicidad_${new Date().toISOString().split('T')[0]}.pdf`);
            }
        } catch (error) {
            console.error("Export failed", error);
            alert("Error al exportar PDF");
        }
        setExporting(false);
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f0f2f5', height: '100%', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ margin: 0, color: '#1a1a1a' }}>📊 Analítica Avanzada</h2>
                <button 
                    onClick={handleExportPDF}
                    disabled={exporting}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#0052cc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    {exporting ? 'Generando PDF...' : '📥 Exportar Informe (PDF)'}
                </button>
            </div>

            {/* Filtros */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', backgroundColor: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <select value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
                    <option value="all">Todos los Clientes</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <select value={selectedCampaign} onChange={(e) => setSelectedCampaign(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
                    <option value="all">Todas las Campañas</option>
                    {campaigns.filter(c => selectedCompany === 'all' || c.companyId === selectedCompany).map(c => 
                        <option key={c.id} value={c.id}>{c.name}</option>
                    )}
                </select>

                <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
                    <option value="7d">Últimos 7 días</option>
                    <option value="30d">Últimos 30 días</option>
                    <option value="year">Este Año</option>
                </select>
            </div>

            <div id="analytics-report">
                {/* KPIs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div style={{ fontSize: '14px', color: '#666' }}>Impresiones Totales</div>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a1a1a' }}>{totalImpressions.toLocaleString()}</div>
                    </div>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div style={{ fontSize: '14px', color: '#666' }}>Clics Estimados</div>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a1a1a' }}>{totalClicks.toLocaleString()}</div>
                    </div>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div style={{ fontSize: '14px', color: '#666' }}>CTR Medio</div>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0052cc' }}>{baseCtr.toFixed(1)}%</div>
                    </div>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div style={{ fontSize: '14px', color: '#666' }}>Presupuesto Total</div>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#00875a' }}>{totalSpent.toLocaleString()} €</div>
                    </div>
                </div>

                {/* Charts */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ marginTop: 0, color: '#333' }}>Distribución por Plataforma</h3>
                        <div style={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={deviceData} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                                        {deviceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ marginTop: 0, color: '#333' }}>Retención de Video (Funnel)</h3>
                        <div style={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={retentionData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" domain={[0, 100]} />
                                    <YAxis dataKey="name" type="category" />
                                    <Tooltip formatter={(value) => `${value}%`} />
                                    <Bar dataKey="rate" fill="#8884d8" barSize={30}>
                                        {retentionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Second row of charts */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ marginTop: 0, color: '#333' }}>Afinidad de Audiencia (Intereses)</h3>
                        <div style={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={interestData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="subject" />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                    <Radar name="Afinidad" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                                    <Tooltip />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ marginTop: 0, color: '#333' }}>Engagement Detallado</h3>
                        <div style={{ overflowX: 'auto', marginTop: '20px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #eee' }}>
                                        <th style={{ padding: '10px' }}>Métrica</th>
                                        <th style={{ padding: '10px' }}>Volumen</th>
                                        <th style={{ padding: '10px' }}>Tasa (vs Impresiones)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '10px' }}>❤️ Me Gusta</td>
                                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{engagementMetrics.likes.toLocaleString()}</td>
                                        <td style={{ padding: '10px' }}>{totalImpressions > 0 ? ((engagementMetrics.likes / totalImpressions) * 100).toFixed(2) : 0}%</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '10px' }}>💬 Comentarios</td>
                                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{engagementMetrics.comments.toLocaleString()}</td>
                                        <td style={{ padding: '10px' }}>{totalImpressions > 0 ? ((engagementMetrics.comments / totalImpressions) * 100).toFixed(2) : 0}%</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '10px' }}>📤 Compartidos</td>
                                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{engagementMetrics.shares.toLocaleString()}</td>
                                        <td style={{ padding: '10px' }}>{totalImpressions > 0 ? ((engagementMetrics.shares / totalImpressions) * 100).toFixed(2) : 0}%</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '10px' }}>🔖 Guardados</td>
                                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{engagementMetrics.saves.toLocaleString()}</td>
                                        <td style={{ padding: '10px' }}>{totalImpressions > 0 ? ((engagementMetrics.saves / totalImpressions) * 100).toFixed(2) : 0}%</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '10px' }}>🔗 Clics Salientes</td>
                                        <td style={{ padding: '10px', fontWeight: 'bold', color: '#0052cc' }}>{engagementMetrics.outboundClicks.toLocaleString()}</td>
                                        <td style={{ padding: '10px', color: '#0052cc' }}>{totalImpressions > 0 ? ((engagementMetrics.outboundClicks / totalImpressions) * 100).toFixed(2) : 0}%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Third row of charts */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                    <h3 style={{ marginTop: 0, color: '#333' }}>Evolución Temporal (Impresiones vs Clics)</h3>
                    <div style={{ height: 350 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={temporalData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorImp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" />
                                <YAxis />
                                <CartesianGrid strokeDasharray="3 3" />
                                <Tooltip />
                                <Legend />
                                <Area type="monotone" dataKey="impressions" name="Impresiones" stroke="#8884d8" fillOpacity={1} fill="url(#colorImp)" />
                                <Area type="monotone" dataKey="clicks" name="Clics" stroke="#82ca9d" fillOpacity={1} fill="url(#colorClicks)" />
                                {temporalData.length > 7 && (
                                    <Brush dataKey="name" height={30} stroke="#8884d8" startIndex={0} endIndex={9} />
                                )}
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
