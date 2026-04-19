'use client';

import React, { useState, useEffect } from 'react';





const getCategoryStyle = () => {
    return {
        padding: '3px 10px',
        borderRadius: '3px',
        backgroundColor: '#000080', // Navy blue typical of Win98
        color: '#ffffff',
        fontSize: '12px',
        fontWeight: 'bold' as const,
        textTransform: 'uppercase' as const,
        display: 'inline-block',
        minWidth: '70px',
        textAlign: 'center' as const,
        border: '1px solid #ffffff',
        boxShadow: 'inset -1px -1px 0 #000000, inset 1px 1px 0 #dfdfdf'
    };
};

export default function ViralRankingPage() {
    const [activeTab, setActiveTab] = useState('videos');
    const [isLoading, setIsLoading] = useState(false);
    const [videoRanking, setVideoRanking] = useState<any[]>([]);
    const [topDonors, setTopDonors] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [summary, setSummary] = useState({ donationsToday: 0, activeUsers: 0 });
    const [auditData, setAuditData] = useState<any>(null);

    const fetchStats = async () => {
        setIsLoading(true);
        try {
            const [statsRes, auditRes] = await Promise.all([
                fetch('/api/voz/stats'),
                fetch('/api/voz/admin/audit')
            ]);

            const [data, audit] = await Promise.all([
                statsRes.json(),
                auditRes.json()
            ]);

            // Handle new API structure { videos: [], donors: [], summary: {}, categories: [] }
            if (data.videos) {
                setVideoRanking(Array.isArray(data.videos) ? data.videos : []);
                setTopDonors(Array.isArray(data.donors) ? data.donors : []);
                setCategories(Array.isArray(data.categories) ? data.categories : []);
                if (data.summary) setSummary(data.summary);
            } else if (Array.isArray(data)) {
                // Fallback for old structure just in case
                setVideoRanking(data);
            }

            if (audit && audit.status) {
                setAuditData(audit);
            }

            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching stats:', error);
            setIsLoading(false); // Ensure loading state is reset even on error
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleRefresh = () => {
        fetchStats();
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#c0c0c0' }}>
            {/* Ribbon/Tabs */}
            <div style={{
                display: 'flex',
                gap: '2px',
                padding: '4px 4px 0 4px',
                borderBottom: '2px solid #808080'
            }}>
                <button
                    onClick={() => setActiveTab('videos')}
                    style={{
                        padding: '6px 12px',
                        backgroundColor: activeTab === 'videos' ? '#c0c0c0' : '#d0d0d0',
                        border: '2px solid',
                        borderColor: activeTab === 'videos' ? '#ffffff #808080 #c0c0c0 #ffffff' : '#ffffff #808080 #808080 #ffffff',
                        borderBottom: activeTab === 'videos' ? 'none' : '2px solid #808080',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        zIndex: activeTab === 'videos' ? 1 : 0,
                        transform: activeTab === 'videos' ? 'translateY(2px)' : 'none'
                    }}
                >
                    <span style={{ fontSize: '14px' }}>🎥</span> Videos Virales
                </button>
                <button
                    onClick={() => setActiveTab('donors')}
                    style={{
                        padding: '6px 12px',
                        backgroundColor: activeTab === 'donors' ? '#c0c0c0' : '#d0d0d0',
                        border: '2px solid',
                        borderColor: activeTab === 'donors' ? '#ffffff #808080 #c0c0c0 #ffffff' : '#ffffff #808080 #808080 #ffffff',
                        borderBottom: activeTab === 'donors' ? 'none' : '2px solid #808080',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        zIndex: activeTab === 'donors' ? 1 : 0,
                        transform: activeTab === 'donors' ? 'translateY(2px)' : 'none'
                    }}
                >
                    <span style={{ fontSize: '14px' }}>🎁</span> Top Donantes
                </button>
                <button
                    onClick={() => setActiveTab('categories')}
                    style={{
                        padding: '6px 12px',
                        backgroundColor: activeTab === 'categories' ? '#c0c0c0' : '#d0d0d0',
                        border: '2px solid',
                        borderColor: activeTab === 'categories' ? '#ffffff #808080 #c0c0c0 #ffffff' : '#ffffff #808080 #808080 #ffffff',
                        borderBottom: activeTab === 'categories' ? 'none' : '2px solid #808080',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        zIndex: activeTab === 'categories' ? 1 : 0,
                        transform: activeTab === 'categories' ? 'translateY(2px)' : 'none'
                    }}
                >
                    <span style={{ fontSize: '14px' }}>📉</span> Categorías
                </button>
            </div>

            {/* Toolbar */}
            <div style={{
                padding: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #ffffff',
                boxShadow: 'inset 0 -1px 0 #808080'
            }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={handleRefresh}
                        className="retro-button-active"
                        style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}
                    >
                        <span style={{ display: 'inline-block', transform: isLoading ? 'rotate(360deg)' : 'none', transition: 'transform 0.8s ease' }}>🔄</span>
                        Refrescar
                    </button>
                    <div style={{
                        backgroundColor: '#ffffff',
                        border: '2px solid',
                        borderColor: '#808080 #ffffff #ffffff #808080',
                        padding: '2px 6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <span style={{ fontSize: '12px' }}>🔍</span>
                        <input
                            type="text"
                            placeholder="Buscar..."
                            style={{
                                border: 'none',
                                outline: 'none',
                                fontSize: '12px',
                                width: '120px'
                            }}
                        />
                    </div>
                </div>
                <div style={{ fontSize: '12px', color: '#000' }}>
                    {activeTab === 'videos' && 'Top Videos Reales de la App'}
                    {activeTab === 'donors' && 'Ranking de Generosidad'}
                    {activeTab === 'categories' && 'Distribución de Contenido'}
                </div>
            </div>

            {/* Content Area */}
            <div style={{
                flex: 1,
                padding: '15px',
                overflowY: 'auto',
                backgroundColor: '#ffffff',
                margin: '10px',
                border: '2px solid',
                borderColor: '#808080 #ffffff #ffffff #808080'
            }}>
                {/* SECURITY AUDIT WIDGET */}
                {auditData && (
                    <div style={{
                        marginBottom: '20px',
                        padding: '15px',
                        backgroundColor: auditData.status === 'BREACHED' ? '#ffcccc' : '#d4f0d4',
                        border: '2px solid',
                        borderColor: auditData.status === 'BREACHED' ? '#cc0000' : '#008000',
                        color: '#000'
                    }}>
                        <h2 style={{
                            fontSize: '18px',
                            color: auditData.status === 'BREACHED' ? '#cc0000' : '#006400',
                            marginTop: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            {auditData.status === 'BREACHED' ? '🚨 ALERTA CRÍTICA: Descuadre de Monedas Detectado' : '✅ Auditoría Matemática: Sistema Seguro'}
                        </h2>

                        <div style={{ display: 'flex', gap: '20px', fontSize: '12px', marginTop: '10px' }}>
                            <div>
                                <strong>Ventas Oficiales (Stripe):</strong> {auditData.globalMath.totalCoinsFromStripe.toFixed(2)} €
                                <br />
                                <strong>Bonos de Admin:</strong> {auditData.globalMath.totalCoinsFromAdmins.toFixed(2)} €
                                <br />
                                <br />
                                <strong>Total Esperado (Matemático):</strong> {auditData.globalMath.totalExpectedSupply.toFixed(2)} €
                                <br />
                                <strong>Monedas Reales en Carteras:</strong> {auditData.globalMath.totalRealCirculatingSupply.toFixed(2)} €
                            </div>
                            <div>
                                <strong>Descuadre Global:</strong> <span style={{ color: auditData.globalMath.globalDiscrepancy > 0.1 ? 'red' : 'green', fontWeight: 'bold' }}>{auditData.globalMath.globalDiscrepancy.toFixed(2)}</span>
                            </div>
                        </div>

                        {auditData.suspiciousUsers && auditData.suspiciousUsers.length > 0 && (
                            <div style={{ marginTop: '15px', borderTop: '1px solid #cc0000', paddingTop: '10px' }}>
                                <strong style={{ color: '#cc0000' }}>Usuarios Sospechosos (Monedas Inyectadas):</strong>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginTop: '5px', backgroundColor: '#fff' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ border: '1px solid #cc0000', padding: '4px', textAlign: 'left' }}>Usuario</th>
                                            <th style={{ border: '1px solid #cc0000', padding: '4px', textAlign: 'right' }}>Cartera Actual</th>
                                            <th style={{ border: '1px solid #cc0000', padding: '4px', textAlign: 'right' }}>Balance Matemático</th>
                                            <th style={{ border: '1px solid #cc0000', padding: '4px', textAlign: 'right' }}>Descuadre (Falso)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {auditData.suspiciousUsers.map((u: any) => (
                                            <tr key={u.handle}>
                                                <td style={{ border: '1px solid #cc0000', padding: '4px', fontWeight: 'bold' }}>{u.handle}</td>
                                                <td style={{ border: '1px solid #cc0000', padding: '4px', textAlign: 'right' }}>{u.currentBalance}</td>
                                                <td style={{ border: '1px solid #cc0000', padding: '4px', textAlign: 'right' }}>{u.expectedBalance}</td>
                                                <td style={{ border: '1px solid #cc0000', padding: '4px', textAlign: 'right', color: 'red', fontWeight: 'bold' }}>+{u.discrepancy}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'videos' && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead style={{ position: 'sticky', top: 0, backgroundColor: '#c0c0c0', zIndex: 10 }}>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '8px', border: '1px solid #808080' }}>Pos.</th>
                                <th style={{ textAlign: 'left', padding: '8px', border: '1px solid #808080' }}>Usuario</th>
                                <th style={{ textAlign: 'left', padding: '8px', border: '1px solid #808080' }}>Descripción</th>
                                <th style={{ textAlign: 'right', padding: '8px', border: '1px solid #808080' }}>👁️ Vistas</th>
                                <th style={{ textAlign: 'right', padding: '8px', border: '1px solid #808080' }}>❤️ Likes</th>
                                <th style={{ textAlign: 'center', padding: '8px', border: '1px solid #808080' }}>Categoría</th>
                            </tr>
                        </thead>
                        <tbody>
                            {videoRanking.length > 0 ? (
                                videoRanking.map((vid, idx) => (
                                    <tr key={vid.id} style={{ backgroundColor: idx % 2 === 0 ? '#f0f0f0' : '#ffffff' }}>
                                        <td style={{ padding: '8px', border: '1px solid #dfdfdf', fontWeight: 'bold' }}>#{idx + 1}</td>
                                        <td style={{ padding: '8px', border: '1px solid #dfdfdf', color: '#000080', fontWeight: 'bold' }}>{vid.user}</td>
                                        <td style={{ padding: '8px', border: '1px solid #dfdfdf' }}>{vid.description}</td>
                                        <td style={{ padding: '8px', border: '1px solid #dfdfdf', textAlign: 'right' }}>{formatNumber(vid.views)}</td>
                                        <td style={{ padding: '8px', border: '1px solid #dfdfdf', textAlign: 'right' }}>{formatNumber(vid.likes)}</td>
                                        <td style={{ padding: '8px', border: '1px solid #dfdfdf', textAlign: 'center' }}>
                                            <span style={getCategoryStyle()}>
                                                {vid.category}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#808080' }}>
                                        {isLoading ? 'Cargando datos virales...' : 'No hay datos de actividad todavía.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}

                {activeTab === 'donors' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {topDonors.length === 0 ? (
                            <p style={{ textAlign: 'center', padding: '40px', color: '#808080' }}>
                                {isLoading ? 'Cargando ranking...' : 'Todavía no hay donantes registrados.'}
                            </p>
                        ) : (
                            topDonors.map((donor, idx) => (
                                <div key={donor.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '12px',
                                    border: '1px solid #dfdfdf',
                                    borderRadius: '4px',
                                    backgroundColor: idx === 0 ? '#fffae6' : '#ffffff'
                                }}>
                                    <div style={{
                                        width: '30px',
                                        fontSize: '18px',
                                        fontWeight: 'bold',
                                        color: idx === 0 ? '#b8860b' : '#808080'
                                    }}>
                                        {idx + 1}
                                    </div>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        backgroundColor: donor.avatarColor,
                                        marginRight: '15px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: 'bold'
                                    }}>
                                        {donor.name[0]}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{donor.name}</div>
                                        <div style={{ fontSize: '12px', color: '#222' }}>{donor.handle}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{
                                            color: '#000080',
                                            fontWeight: 'bold',
                                            fontSize: '16px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}>
                                            € {donor.donation.toLocaleString()}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#222' }}>Monedas donadas</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'categories' && (
                    <div style={{ padding: '20px' }}>
                        <h3 style={{ fontSize: '14px', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '18px' }}>📊</span> Análisis de Contenido por Categoría
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {categories.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#808080', padding: '20px' }}>
                                    {isLoading ? 'Calculando tendencias...' : 'Sin datos de categorías aún.'}
                                </p>
                            ) : (
                                categories.map(cat => (
                                    <div key={cat.name}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                                            <span style={{ fontWeight: 'bold' }}>{cat.name}</span>
                                            <span style={{ color: '#222' }}>{cat.count}% del tráfico</span>
                                        </div>
                                        <div style={{
                                            height: '24px',
                                            backgroundColor: '#f0f0f0',
                                            border: '1px solid #808080',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                width: `${cat.count}%`,
                                                height: '100%',
                                                backgroundColor: cat.color,
                                                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)'
                                            }} />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div style={{
                            marginTop: '40px',
                            padding: '15px',
                            backgroundColor: '#f8f9fa',
                            border: '1px dashed #808080',
                            fontSize: '12px',
                            color: '#222'
                        }}>
                            <strong>Nota del Sistema:</strong> Los datos mostrados corresponden al periodo seleccionado y se actualizan cada vez que sincroniza la App. El algoritmo VOZ Shield prioritiza contenido de alta calidad y evita penalizaciones injustas.
                        </div>
                    </div>
                )}
            </div>

            {/* Status Bar */}
            <div style={{
                height: '25px',
                backgroundColor: '#c0c0c0',
                borderTop: '2px solid #ffffff',
                display: 'flex',
                alignItems: 'center',
                padding: '0 10px',
                fontSize: '12px',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <span style={{ borderRight: '1px solid #808080', paddingRight: '15px' }}>
                        Total Videos Trackeados: <strong>{videoRanking.length}</strong>
                    </span>
                    <span style={{ borderRight: '1px solid #808080', paddingRight: '15px' }}>
                        Donaciones Hoy: <strong>{summary.donationsToday} €</strong>
                    </span>
                    <span>
                        Usuarios Activos: <strong>{summary.activeUsers}</strong>
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#008000' }}>📈</span>
                    Viral Engine v3.1 [Real-Time Sync]
                </div>
            </div>
        </div>
    );
}

