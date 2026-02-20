'use client';

import { useState } from 'react';
import { Product } from '@/types';
import ProductCard from '@/components/ui/ProductCard';
import { useAuth } from '@/context/AuthContext';
import styles from '@/app/categories/[slug]/category.module.css';

interface ProductGridProps {
    products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
    const { user } = useAuth();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectionMode, setSelectionMode] = useState(false);

    const isAdmin = user?.role === 'admin';

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const toggleSelectionMode = () => {
        if (selectionMode) {
            setSelectionMode(false);
            setSelectedIds(new Set());
        } else {
            setSelectionMode(true);
        }
    };

    const handleDeleteSelected = async () => {
        if (!confirm(`¿Estás seguro de que quieres eliminar ${selectedIds.size} productos?`)) {
            return;
        }

        setIsDeleting(true);
        try {
            const res = await fetch('/api/products', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: Array.from(selectedIds) })
            });

            if (res.ok) {
                // Refresh the page to show updated list
                window.location.reload();
            } else {
                alert('Error al eliminar productos');
            }
        } catch (error) {
            console.error(error);
            alert('Error al eliminar productos');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            {isAdmin && (
                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        onClick={toggleSelectionMode}
                        style={{
                            padding: '8px 16px',
                            background: selectionMode ? '#666' : 'var(--cex-blue, #0070f3)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        {selectionMode ? 'Cancelar Selección' : 'Seleccionar Productos'}
                    </button>
                </div>
            )}

            {isAdmin && selectedIds.size > 0 && (
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#333',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '50px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px'
                }}>
                    <span>{selectedIds.size} seleccionados</span>
                    <button
                        onClick={handleDeleteSelected}
                        disabled={isDeleting}
                        style={{
                            background: '#dc2626',
                            color: 'white',
                            border: 'none',
                            padding: '5px 15px',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        {isDeleting ? 'Eliminando...' : 'Eliminar'}
                    </button>
                    <button
                        onClick={() => setSelectedIds(new Set())}
                        style={{
                            background: 'transparent',
                            color: '#ccc',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        Limpiar
                    </button>
                </div>
            )}

            <div className={styles.grid}>
                {products.length > 0 ? (
                    products.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            selectable={selectionMode}
                            selected={selectedIds.has(product.id)}
                            onSelect={() => toggleSelection(product.id)}
                            selectionMode={selectionMode}
                        />
                    ))
                ) : (
                    <div className={styles.emptyState} style={{ gridColumn: '1 / -1' }}>
                        <p>No hay productos disponibles en esta sección actualmente.</p>
                        <p className={styles.emptyStateSubtext}>
                            Intenta seleccionar otra subcategoría o vuelve pronto.
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}
