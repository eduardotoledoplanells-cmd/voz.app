'use client';

import React, { useState, useEffect } from 'react';

// Mock Data based on App.js explorations
const VIDEO_RANKING = [
    { id: '1', user: '@alex_voz', views: '0', likes: '0', description: 'El futuro es la voz 🎤', category: 'trending' },
    { id: 'd1', user: '@car_lover', views: '0', likes: '0', description: 'Bestia en la ciudad #Coches', category: 'coches' },
    { id: 'd2', user: '@safari_life', views: '0', likes: '0', description: 'Majestuosidad en directo #Jirafas', category: 'jirafas' },
    { id: 'd3', user: '@art_studio', views: '0', likes: '0', description: 'Creando pinceladas de paz #Arte', category: 'arte' },
    { id: 'edu_1', user: '@edu_voz', views: '0', likes: '0', description: 'Probando la tecnología VOZ 🎧', category: 'trending' },
    { id: 'edu_2', user: '@edu_voz', views: '0', likes: '0', description: 'Melodías nocturnas 🎸', category: 'musica' },
];

const TOP_DONORS = [
    { id: 'u1', name: 'Maria Valdez', handle: '@maria_v', donation: 0, avatarColor: '#ff4b2b' },
    { id: 'u2', name: 'Luna Blue', handle: '@luna_blue', donation: 0, avatarColor: '#6a11cb' },
    { id: 'u3', name: 'Carlos Mendez', handle: '@carlos_m', donation: 0, avatarColor: '#2ecc71' },
    { id: 'u4', name: 'Sofia Rivera', handle: '@sofia_r', donation: 0, avatarColor: '#f1c40f' },
    { id: 'u5', name: 'Elena Sol', handle: '@elena_sol', donation: 0, avatarColor: '#e67e22' },
];

const CATEGORIES = [
    { name: 'Trending', count: 45, color: '#8E2DE2' },
    { name: 'Coches', count: 28, color: '#FF4B2B' },
    { name: 'Jirafas', count: 12, color: '#FFD700' },
    { name: 'Arte', count: 18, color: '#4CD964' },
    { name: 'Música', count: 35, color: '#4FACFE' },
];

export default function ViralRankingPage() {
    const [activeTab, setActiveTab] = useState('videos');
    const [isLoading, setIsLoading] = useState(false);

    const handleRefresh = () => {
        setIsLoading(true);
        setTimeout(() => setIsLoading(false), 800);
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
                            fontSize: '11px',
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
                                fontSize: '11px',
                                width: '120px'
                            }}
                        />
                    </div>
                </div>
                <div style={{ fontSize: '11px', color: '#404040' }}>
                    {activeTab === 'videos' && 'Top Videos del Mes'}
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
                            {VIDEO_RANKING.map((vid, idx) => (
                                <tr key={vid.id} style={{ backgroundColor: idx % 2 === 0 ? '#f0f0f0' : '#ffffff' }}>
                                    <td style={{ padding: '8px', border: '1px solid #dfdfdf', fontWeight: 'bold' }}>#{idx + 1}</td>
                                    <td style={{ padding: '8px', border: '1px solid #dfdfdf', color: '#000080', fontWeight: 'bold' }}>{vid.user}</td>
                                    <td style={{ padding: '8px', border: '1px solid #dfdfdf' }}>{vid.description}</td>
                                    <td style={{ padding: '8px', border: '1px solid #dfdfdf', textAlign: 'right' }}>{vid.views}</td>
                                    <td style={{ padding: '8px', border: '1px solid #dfdfdf', textAlign: 'right' }}>{vid.likes}</td>
                                    <td style={{ padding: '8px', border: '1px solid #dfdfdf', textAlign: 'center' }}>
                                        <span style={{
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            backgroundColor: '#8E2DE2',
                                            color: 'white',
                                            fontSize: '10px'
                                        }}>
                                            {vid.category}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {activeTab === 'donors' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {TOP_DONORS.map((donor, idx) => (
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
                                    <div style={{ fontSize: '12px', color: '#808080' }}>{donor.handle}</div>
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
                                        🪙 {donor.donation.toLocaleString()}
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#808080' }}>ROBcoins donados</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'categories' && (
                    <div style={{ padding: '20px' }}>
                        <h3 style={{ fontSize: '14px', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '18px' }}>📊</span> Análisis de Contenido por Categoría
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {CATEGORIES.map(cat => (
                                <div key={cat.name}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                                        <span style={{ fontWeight: 'bold' }}>{cat.name}</span>
                                        <span style={{ color: '#808080' }}>{cat.count}% del tráfico</span>
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
                            ))}
                        </div>
                        <div style={{
                            marginTop: '40px',
                            padding: '15px',
                            backgroundColor: '#f8f9fa',
                            border: '1px dashed #808080',
                            fontSize: '11px',
                            color: '#606060'
                        }}>
                            <strong>Nota del Sistema:</strong> Los datos mostrados corresponden al periodo seleccionado y se actualizan cada 60 segundos. El algoritmo VOZ Shield prioritiza contenido de alta calidad y evita penalizaciones injustas.
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
                fontSize: '11px',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <span style={{ borderRight: '1px solid #808080', paddingRight: '15px' }}>
                        Total Videos: <strong>1,248</strong>
                    </span>
                    <span style={{ borderRight: '1px solid #808080', paddingRight: '15px' }}>
                        Donaciones Hoy: <strong>12.5K 🪙</strong>
                    </span>
                    <span>
                        Usuarios Activos: <strong>4.2K</strong>
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#008000' }}>📈</span>
                    Viral Engine v3.1 [Online]
                </div>
            </div>
        </div>
    );
}
