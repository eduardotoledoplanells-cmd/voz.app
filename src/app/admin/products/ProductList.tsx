'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import styles from '../admin.module.css';

interface ProductListProps {
    initialProducts: Product[];
}

export default function ProductList({ initialProducts }: ProductListProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [products, setProducts] = useState(initialProducts);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);

    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const filteredProducts = products.filter(product =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.reference && product.reference.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredProducts.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredProducts.map(p => p.id)));
        }
    };

    const handleDeleteClick = () => {
        setShowConfirmModal(true);
    };

    const confirmDelete = async () => {
        setIsDeleting(true);
        try {
            const res = await fetch('/api/products', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: Array.from(selectedIds) })
            });

            if (res.ok) {
                // Force reload
                window.location.reload();
            } else {
                const data = await res.json();
                console.error('Delete error:', data);
                // Fallback alert for API error only
                alert(`Error: ${data.message || 'Error al eliminar'}`);
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Error de conexión al eliminar productos.');
        } finally {
            setIsDeleting(false);
            setShowConfirmModal(false);
        }
    };

    return (
        <div>
            <div className={styles.header}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <h1 className={styles.title} style={{ margin: 0 }}>Gestión de Productos</h1>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {selectedIds.size > 0 && (
                            <button
                                onClick={handleDeleteClick}
                                className="btn"
                                style={{
                                    background: '#dc2626',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                {isDeleting ? '...' : `Eliminar (${selectedIds.size})`}
                            </button>
                        )}
                        <Link href="/admin/products/new" className="btn btn-primary">
                            + Añadir Producto
                        </Link>
                    </div>
                </div>
            </div>

            {/* ... search input ... */}
            <div style={{ marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="Buscar por nombre o referencia..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '1rem',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                />
            </div>

            <div className={styles.card}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                            <th style={{ padding: '12px', width: '40px' }}>
                                <input
                                    type="checkbox"
                                    checked={filteredProducts.length > 0 && selectedIds.size === filteredProducts.length}
                                    onChange={toggleSelectAll}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                            </th>
                            <th style={{ padding: '12px' }}>Imagen</th>
                            <th style={{ padding: '12px' }}>Referencia</th>
                            <th style={{ padding: '12px' }}>Título</th>
                            <th style={{ padding: '12px' }}>Precio</th>
                            <th style={{ padding: '12px' }}>Categoría</th>
                            <th style={{ padding: '12px' }}>Stock</th>
                            <th style={{ padding: '12px' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.length === 0 ? (
                            <tr>
                                <td colSpan={8} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                    No se encontraron productos que coincidan con tu búsqueda.
                                </td>
                            </tr>
                        ) : (
                            filteredProducts.map((product) => (
                                <tr key={product.id} style={{ borderBottom: '1px solid #eee', background: selectedIds.has(product.id) ? '#f0f9ff' : 'transparent' }}>
                                    <td style={{ padding: '12px' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(product.id)}
                                            onChange={() => toggleSelection(product.id)}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                        />
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={product.images[0]}
                                            alt={product.title}
                                            style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                                        />
                                    </td>
                                    <td style={{ padding: '12px', fontFamily: 'monospace', color: '#666' }}>
                                        {product.reference || 'N/A'}
                                    </td>
                                    <td style={{ padding: '12px', fontWeight: '500' }}>
                                        <Link href={`/product/${product.id}`} target="_blank" style={{ color: '#2196F3', textDecoration: 'none' }}>
                                            {product.title}
                                        </Link>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        {product.isOnSale && product.salePrice ? (
                                            <div>
                                                <span style={{ textDecoration: 'line-through', color: '#999', marginRight: '8px' }}>
                                                    €{product.price.toFixed(2)}
                                                </span>
                                                <span style={{ color: '#e53935', fontWeight: 'bold' }}>
                                                    €{product.salePrice.toFixed(2)}
                                                </span>
                                            </div>
                                        ) : (
                                            <span>€{product.price.toFixed(2)}</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '12px', color: '#666' }}>{product.category}</td>
                                    <td style={{ padding: '12px' }}>{product.stock || 0}</td>
                                    <td style={{ padding: '12px' }}>
                                        <Link
                                            href={`/admin/products/${product.id}`}
                                            className="btn btn-outline"
                                            style={{ fontSize: '0.9rem', padding: '6px 12px' }}
                                        >
                                            Editar
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Custom Confirm Modal */}
            {showConfirmModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '24px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        maxWidth: '400px',
                        width: '90%'
                    }}>
                        <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#dc2626' }}>Confirmar Eliminación</h3>
                        <p style={{ marginBottom: '24px', lineHeight: '1.5' }}>
                            ¿Estás seguro de que deseas eliminar permanentemente <strong>{selectedIds.size}</strong> producto(s)? esta acción no se puede deshacer.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '4px',
                                    border: '1px solid #ddd',
                                    background: 'white',
                                    cursor: 'pointer'
                                }}
                                disabled={isDeleting}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '4px',
                                    border: 'none',
                                    background: '#dc2626',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    opacity: isDeleting ? 0.7 : 1
                                }}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Eliminando...' : 'Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
