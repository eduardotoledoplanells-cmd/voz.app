'use client';

import { useState, useEffect } from 'react';
import styles from './analytics.module.css';

interface TopProduct {
    productId: string;
    count: number;
    title: string;
    category?: string;
    lastViewed: string;
}

interface AnalyticsData {
    totalViews: number;
    topProducts: TopProduct[];
}

export default function AnalyticsPage() {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await fetch('/api/analytics');
            const data = await res.json();
            setAnalytics(data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const getMedal = (index: number) => {
        if (index === 0) return '🥇';
        if (index === 1) return '🥈';
        if (index === 2) return '🥉';
        return '';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return <div className={styles.loading}>Cargando estadísticas...</div>;
    }

    if (!analytics) {
        return <div className={styles.noData}>No hay datos disponibles</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>📊 Estadísticas</h1>
                <p className={styles.subtitle}>Análisis de visualizaciones de productos</p>
            </div>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Total de Visualizaciones</div>
                    <div className={styles.statValue}>{analytics.totalViews.toLocaleString()}</div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Productos Únicos Vistos</div>
                    <div className={styles.statValue}>{analytics.topProducts.length}</div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Producto Más Visto</div>
                    <div className={styles.statValue} style={{ fontSize: '1.2rem', marginTop: '10px' }}>
                        {analytics.topProducts[0]?.title || 'N/A'}
                    </div>
                </div>
            </div>

            <div className={styles.tableContainer}>
                <div className={styles.tableHeader}>
                    <h2 className={styles.tableTitle}>🏆 Ranking de Productos Más Vistos</h2>
                </div>

                {analytics.topProducts.length === 0 ? (
                    <div className={styles.noData}>
                        No hay datos de visualizaciones todavía
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th style={{ width: '60px' }}>Rank</th>
                                <th>Producto</th>
                                <th>Categoría</th>
                                <th style={{ width: '120px' }}>Vistas</th>
                                <th style={{ width: '180px' }}>Última Vista</th>
                            </tr>
                        </thead>
                        <tbody>
                            {analytics.topProducts.map((product, index) => (
                                <tr
                                    key={product.productId}
                                    className={index < 3 ? styles.topThree : ''}
                                >
                                    <td className={styles.rank}>
                                        <span className={styles.medal}>{getMedal(index)}</span>
                                        #{index + 1}
                                    </td>
                                    <td className={styles.productTitle}>{product.title}</td>
                                    <td className={styles.category}>{product.category || 'Sin categoría'}</td>
                                    <td className={styles.viewCount}>{product.count}</td>
                                    <td className={styles.lastViewed}>{formatDate(product.lastViewed)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
