'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './admin.module.css';
import { Product, Order } from '@/types';

export default function AdminDashboard() {
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [vozAnalytics, setVozAnalytics] = useState({ totalTips: 0, recentTips: [] }); // VOZ state
    const [showLowStockDropdown, setShowLowStockDropdown] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch products
        fetch('/api/products')
            .then(res => res.json())
            .then(data => setProducts(data))
            .catch(err => console.error('Error loading products:', err));

        // Fetch orders
        fetch('/api/orders')
            .then(res => res.json())
            .then(data => setOrders(data))
            .catch(err => console.error('Error loading orders:', err))
            .finally(() => setLoading(false));

        // Fetch Voz Analytics
        fetch('/api/voz/analytics')
            .then(res => res.json())
            .then(data => setVozAnalytics(data))
            .catch(err => console.error('Error loading voz analytics:', err));
    }, []);

    // Calculate today's sales
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysSales = orders
        .filter(order => {
            const orderDate = new Date(order.date);
            orderDate.setHours(0, 0, 0, 0);
            return orderDate.getTime() === today.getTime();
        })
        .reduce((sum, order) => sum + order.total, 0);

    // Count pending shipments
    const pendingShipments = orders.filter(order => order.status === 'processing').length;

    // Get low stock products
    const lowStockProducts = products.filter(p => (p.stock || 0) < 5);

    // Get recent activity (last 3 orders)
    const recentOrders = orders
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3);

    if (loading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando dashboard...</div>;
    }

    return (
        <div>
            <div className={styles.header}>
                <h1 className={styles.title}>Dashboard</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                <div className={styles.card}>
                    <h3>Total Productos</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--cex-red)' }}>{products.length}</p>
                </div>
                <div className={styles.card}>
                    <h3>Ventas Hoy</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--cex-red)' }}>€{todaysSales.toFixed(2)}</p>
                </div>
                <div className={styles.card}>
                    <h3>Ingresos App VOZ</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8E2DE2' }}>{vozAnalytics.totalTips} 🪙</p>
                </div>
                <div className={styles.card}>
                    <h3>Envíos Pendientes</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--cex-red)' }}>{pendingShipments}</p>
                </div>
                <div className={styles.card} style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowLowStockDropdown(!showLowStockDropdown)}>
                    <h3>Stock Bajo</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff9800' }}>
                        {lowStockProducts.length}
                    </p>
                    {lowStockProducts.length > 0 && (
                        <small style={{ color: '#666', fontSize: '0.85rem', display: 'block', marginTop: '5px' }}>
                            Click para ver detalles ▼
                        </small>
                    )}

                    {showLowStockDropdown && lowStockProducts.length > 0 && (
                        <div className={styles.lowStockDropdown}>
                            <div style={{
                                padding: '10px',
                                borderBottom: '1px solid #eee',
                                fontWeight: 'bold',
                                fontSize: '0.9rem',
                                background: '#f8f8f8'
                            }}>
                                Productos con Stock Bajo
                            </div>
                            {lowStockProducts.map(product => (
                                <Link
                                    key={product.id}
                                    href={`/admin/products/${product.id}`}
                                    className={styles.lowStockItem}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '500', marginBottom: '3px' }}>
                                            {product.title}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                            Stock: <span style={{ color: '#ff9800', fontWeight: 'bold' }}>{product.stock || 0}</span> unidades
                                        </div>
                                    </div>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="9 18 15 12 9 6"></polyline>
                                    </svg>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.card} style={{ marginTop: '20px' }}>
                <h3>Actividad Reciente</h3>
                <ul style={{ listStyle: 'none', marginTop: '15px' }}>
                    {recentOrders.length === 0 ? (
                        <li style={{ padding: '10px 0', color: '#666' }}>No hay pedidos recientes</li>
                    ) : (
                        recentOrders.map(order => (
                            <li key={order.id} style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>
                                <strong>{order.orderNumber}</strong> - {order.customerName} - €{order.total.toFixed(2)} - {order.status}
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
}
