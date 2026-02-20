'use client';

import { useState } from 'react';
import styles from '../admin.module.css';

interface ShippingRate {
    id: string;
    company: string;
    price: number;
}

export default function ShipmentsPage() {
    const [rates, setRates] = useState<ShippingRate[]>([
        { id: '1', company: 'Correos', price: 4.95 },
        { id: '2', company: 'SEUR', price: 5.95 },
    ]);

    const [editing, setEditing] = useState<string | null>(null);
    const [editPrice, setEditPrice] = useState<number>(0);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newCompany, setNewCompany] = useState('');
    const [newPrice, setNewPrice] = useState(0);

    const handleEdit = (rate: ShippingRate) => {
        setEditing(rate.id);
        setEditPrice(rate.price);
    };

    const handleSave = (id: string) => {
        setRates(rates.map(r => r.id === id ? { ...r, price: editPrice } : r));
        setEditing(null);
    };

    const handleCancel = () => {
        setEditing(null);
    };

    const handleAddCompany = () => {
        if (newCompany && newPrice > 0) {
            const newRate: ShippingRate = {
                id: Date.now().toString(),
                company: newCompany,
                price: newPrice
            };
            setRates([...rates, newRate]);
            setNewCompany('');
            setNewPrice(0);
            setShowAddForm(false);
        }
    };

    const handleDelete = (id: string) => {
        if (confirm('¿Estás seguro de que quieres eliminar esta compañía de envío?')) {
            setRates(rates.filter(r => r.id !== id));
        }
    };

    return (
        <div>
            <div className={styles.header}>
                <h1 className={styles.title}>Tarifas de Envío</h1>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="btn btn-primary"
                >
                    {showAddForm ? 'Cancelar' : 'Añadir Compañía'}
                </button>
            </div>

            {showAddForm && (
                <div className={styles.card} style={{ marginBottom: '20px' }}>
                    <h2 style={{ marginBottom: '15px' }}>Nueva Compañía de Envío</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '15px', alignItems: 'end' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nombre de la Compañía</label>
                            <input
                                type="text"
                                value={newCompany}
                                onChange={(e) => setNewCompany(e.target.value)}
                                placeholder="Ej: DHL, UPS, etc."
                                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Precio (€)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={newPrice}
                                onChange={(e) => setNewPrice(Number(e.target.value))}
                                placeholder="0.00"
                                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                        </div>
                        <button
                            onClick={handleAddCompany}
                            className="btn btn-primary"
                            disabled={!newCompany || newPrice <= 0}
                        >
                            Añadir
                        </button>
                    </div>
                </div>
            )}

            <div className={styles.card}>
                <h2 style={{ marginBottom: '15px' }}>Compañías de Envío</h2>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#333', color: 'white' }}>
                        <tr>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Compañía</th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Precio (€)</th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rates.map(rate => (
                            <tr key={rate.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '15px', fontWeight: 'bold' }}>{rate.company}</td>
                                <td style={{ padding: '15px' }}>
                                    {editing === rate.id ? (
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={editPrice}
                                            onChange={(e) => setEditPrice(Number(e.target.value))}
                                            style={{ padding: '5px', border: '1px solid #ddd', borderRadius: '4px', width: '100px' }}
                                        />
                                    ) : (
                                        <span>€{rate.price.toFixed(2)}</span>
                                    )}
                                </td>
                                <td style={{ padding: '15px' }}>
                                    {editing === rate.id ? (
                                        <>
                                            <button
                                                onClick={() => handleSave(rate.id)}
                                                style={{ marginRight: '10px', color: 'green', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                                            >
                                                Guardar
                                            </button>
                                            <button
                                                onClick={handleCancel}
                                                style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                                            >
                                                Cancelar
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => handleEdit(rate)}
                                                style={{ marginRight: '10px', color: 'blue', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDelete(rate.id)}
                                                style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                                            >
                                                Eliminar
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div style={{ marginTop: '30px', padding: '15px', background: '#f9f9f9', borderRadius: '4px' }}>
                    <h3 style={{ marginBottom: '10px' }}>Información</h3>
                    <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '5px' }}>
                        • Los precios se aplicarán automáticamente en el checkout
                    </p>
                    <p style={{ fontSize: '0.9rem', color: '#666' }}>
                        • Puedes modificar las tarifas en cualquier momento
                    </p>
                </div>
            </div>
        </div>
    );
}
