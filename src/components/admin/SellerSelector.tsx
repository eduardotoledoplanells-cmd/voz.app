'use client';

import { useState, useEffect } from 'react';

interface SellerStat {
    id: string;
    name: string;
    email: string;
    revenue: number;
    inventoryValue: number;
    productCount: number;
}

interface SellerSelectorProps {
    value?: string;
    onChange?: (sellerId: string) => void;
    error?: string;
}

export default function SellerSelector({ value, onChange, error }: SellerSelectorProps) {
    const [sellers, setSellers] = useState<SellerStat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/sellers/stats')
            .then(res => res.json())
            .then(data => {
                setSellers(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching sellers:', err);
                setLoading(false);
            });
    }, []);

    const handleChange = (id: string) => {
        if (onChange) {
            onChange(id);
        }
    };

    if (loading) return <div>Cargando vendedores...</div>;

    return (
        <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', fontSize: '1.1rem' }}>
                👤 Vendedor Responsable <span style={{ color: 'red' }}>*</span>
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '15px' }}>
                {sellers.map(seller => {
                    const isSelected = value === seller.id;
                    return (
                        <div
                            key={seller.id}
                            onClick={() => handleChange(seller.id)}
                            style={{
                                border: isSelected ? '2px solid #4f46e5' : '1px solid #ddd',
                                borderRadius: '8px',
                                padding: '15px',
                                cursor: 'pointer',
                                background: isSelected ? '#eef2ff' : 'white',
                                transition: 'all 0.2s ease',
                                position: 'relative'
                            }}
                        >
                            <input
                                type="radio"
                                name="sellerId"
                                value={seller.id}
                                checked={isSelected}
                                onChange={() => handleChange(seller.id)}
                                style={{ position: 'absolute', top: '15px', right: '15px' }}
                            />

                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '5px', color: '#1e293b' }}>
                                {seller.name}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '10px' }}>
                                {seller.email}
                            </div>

                            <div style={{ borderTop: '1px solid #eee', paddingTop: '10px', marginTop: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                    <span style={{ color: '#666', fontSize: '0.9rem' }}>📦 Inventario:</span>
                                    <span style={{ fontWeight: '600', color: '#0f172a' }}>
                                        {seller.inventoryValue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#666', fontSize: '0.9rem' }}>💰 Ventas Generadas:</span>
                                    <span style={{ fontWeight: '600', color: '#16a34a' }}>
                                        {seller.revenue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {error && <div style={{ color: 'red', marginTop: '5px', fontSize: '0.9rem' }}>{error}</div>}
        </div>
    );
}
