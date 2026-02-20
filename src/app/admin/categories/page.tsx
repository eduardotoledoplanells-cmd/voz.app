'use client';

import { useState, useEffect } from 'react';
import { Category } from '@/types';
import styles from '../admin.module.css';
import Link from 'next/link';

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCategories();
    }, []);

    async function loadCategories() {
        try {
            const response = await fetch('/api/categories');
            const data = await response.json();
            setCategories(data);
        } catch (error) {
            console.error('Error loading categories:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div>Cargando categorías...</div>;
    }

    return (
        <div>
            <div className={styles.header}>
                <h1 className={styles.title}>Gestión de Categorías</h1>
                <Link href="/admin/categories/new" className="btn btn-primary">
                    Nueva Categoría
                </Link>
            </div>

            <div className={styles.card}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                            <th style={{ padding: '12px' }}>Imagen</th>
                            <th style={{ padding: '12px' }}>Nombre</th>
                            <th style={{ padding: '12px' }}>Slug</th>
                            <th style={{ padding: '12px' }}>Descripción</th>
                            <th style={{ padding: '12px' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map((category) => (
                            <tr key={category.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '12px' }}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={category.image}
                                        alt={category.name}
                                        style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                                    />
                                </td>
                                <td style={{ padding: '12px', fontWeight: '500' }}>{category.name}</td>
                                <td style={{ padding: '12px', color: '#666' }}>{category.slug}</td>
                                <td style={{ padding: '12px', color: '#666', maxWidth: '300px' }}>
                                    {category.description || '-'}
                                </td>
                                <td style={{ padding: '12px' }}>
                                    <Link
                                        href={`/admin/categories/edit/${category.id}`}
                                        className="btn btn-outline"
                                        style={{ fontSize: '0.9rem', padding: '6px 12px' }}
                                    >
                                        Editar
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
