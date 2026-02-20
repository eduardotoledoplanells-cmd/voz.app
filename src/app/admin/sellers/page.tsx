
import { readFile } from 'fs/promises';
import path from 'path';
import { User, Order, Product } from '@/types';
import styles from '../admin.module.css';

const USERS_FILE = path.join(process.cwd(), 'src', 'data', 'users.json');
const ORDERS_FILE = path.join(process.cwd(), 'src', 'data', 'orders.json');
const DB_FILE = path.join(process.cwd(), 'src', 'lib', 'db.json');

async function getData() {
    try {
        const usersData = await readFile(USERS_FILE, 'utf-8');
        const ordersData = await readFile(ORDERS_FILE, 'utf-8');
        // Read products DB to calculate inventory value
        let products: Product[] = [];
        try {
            const dbData = await readFile(DB_FILE, 'utf-8');
            products = JSON.parse(dbData).products;
        } catch (e) {
            console.error("Error reading products db", e);
        }

        const users: User[] = JSON.parse(usersData);
        const orders: Order[] = JSON.parse(ordersData);

        return { users, orders, products };
    } catch (error) {
        console.error('Error reading data:', error);
        return { users: [], orders: [], products: [] };
    }
}

export default async function SellersPage() {
    const { users, orders, products } = await getData();

    // Filter for sellers (admins) because usually in this context admins are the sellers
    const sellers = users.filter(user => user.role === 'admin');

    // 1. Calculate per-seller stats
    const sellerStats = sellers.map(seller => {
        const sellerOrders = orders.filter(order => order.sellerId === seller.id);
        const sellerProducts = products.filter(p => p.sellerId === seller.id);

        const productCount = sellerProducts.length;
        const totalRevenue = sellerOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        const inventoryValue = sellerProducts.reduce((sum, p) => sum + (p.price * p.stock), 0);

        return {
            ...seller,
            stats: {
                productCount,
                totalRevenue,
                inventoryValue
            }
        };
    });

    // 2. Calculate Global Stats
    const globalRevenue = sellerStats.reduce((sum, s) => sum + s.stats.totalRevenue, 0);
    const globalInventory = sellerStats.reduce((sum, s) => sum + s.stats.inventoryValue, 0);
    const topSeller = [...sellerStats].sort((a, b) => b.stats.totalRevenue - a.stats.totalRevenue)[0];

    return (
        <div className={styles.section}>
            <div className={styles.header}>
                <h1 className={styles.title}>Panel de Vendedores</h1>
            </div>

            {/* GLOBAL KPI CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                {/* Total Sales Card */}
                <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: '25px', borderRadius: '12px', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '5px' }}>Ventas Totales Tienda</div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 'bold' }}>
                        {globalRevenue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '5px' }}>🚀 Ingresos acumulados</div>
                </div>

                {/* Inventory Value Card */}
                <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)', padding: '25px', borderRadius: '12px', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '5px' }}>Valor Total Inventario</div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 'bold' }}>
                        {globalInventory.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '5px' }}>📦 Activos combinados</div>
                </div>

                {/* Top Seller Card */}
                <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', padding: '25px', borderRadius: '12px', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '5px' }}>Top Vendedor del Mes</div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 'bold' }}>
                        {globalRevenue > 0 ? topSeller?.name : '---'}
                    </div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '5px' }}>🏆 Líder en ventas</div>
                </div>
            </div>

            {/* VISUAL CHARTS SECTION */}
            <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '30px', display: 'flex', gap: '40px', flexWrap: 'wrap', alignItems: 'center' }}>

                {/* BAR CHARTS (Left Side) */}
                <div style={{ flex: 1, minWidth: '300px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px', color: '#374151' }}>📊 Cuota de Mercado</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                        {sellerStats.map((seller) => {
                            const percentage = globalRevenue > 0 ? (seller.stats.totalRevenue / globalRevenue) * 100 : 0;

                            return (
                                <div key={seller.id}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.95rem', fontWeight: 500 }}>
                                        <span>{seller.name}</span>
                                        <span style={{ color: '#4b5563' }}>{percentage.toFixed(1)}% ({seller.stats.totalRevenue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })})</span>
                                    </div>
                                    <div style={{ width: '100%', height: '12px', background: '#f3f4f6', borderRadius: '6px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${percentage}%`,
                                            height: '100%',
                                            background: seller.id === 'admin-1' ? 'linear-gradient(90deg, #3b82f6, #2563eb)' : 'linear-gradient(90deg, #ec4899, #db2777)',
                                            borderRadius: '6px',
                                            transition: 'width 1s ease-in-out'
                                        }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ELECTION PIE CHART (Right Side) */}
                <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px', color: '#374151' }}>🥊 PELEA</h3>

                    <div style={{ position: 'relative', width: '220px', height: '220px' }}>
                        {/* Conic Gradient Chart */}
                        <div style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            background: `conic-gradient(
                                #3b82f6 0% ${globalRevenue > 0 ? (sellerStats.find(s => s.id === 'admin-1')?.stats.totalRevenue || 0) / globalRevenue * 100 : 50}%, 
                                #ec4899 ${globalRevenue > 0 ? (sellerStats.find(s => s.id === 'admin-1')?.stats.totalRevenue || 0) / globalRevenue * 100 : 50}% 100%
                            )`,
                            transition: 'background 1s ease-in-out',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                            opacity: globalRevenue === 0 ? 0.5 : 1,
                            filter: globalRevenue === 0 ? 'grayscale(0.5)' : 'none'
                        }}></div>

                        {/* Inner Circle for Donut Effect */}
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '140px',
                            height: '140px',
                            background: 'white',
                            borderRadius: '50%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.05)'
                        }}>
                            <span style={{ fontSize: '4rem', lineHeight: '1' }}>⚔️</span>
                        </div>
                    </div>

                    {/* Legend */}
                    <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#3b82f6' }}></div>
                            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Xisco</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ec4899' }}></div>
                            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Eduardo</span>
                        </div>
                    </div>
                    {globalRevenue === 0 && (
                        <p style={{ marginTop: '10px', fontSize: '0.8rem', color: '#9ca3af', fontStyle: 'italic' }}>
                            (Simulación: Sin ventas reales aún)
                        </p>
                    )}
                </div>
            </div>

            <div className={styles.card} style={{ padding: '0', overflow: 'hidden', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                <table className={styles.table} style={{ borderCollapse: 'separate', borderSpacing: '0', width: '100%' }}>
                    <thead style={{ background: '#f9fafb' }}>
                        <tr style={{ textAlign: 'left', color: '#6b7280', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <th style={{ padding: '20px' }}>Vendedor</th>
                            <th style={{ padding: '20px', textAlign: 'center' }}>Artículos</th>
                            <th style={{ padding: '20px' }}>VALOR EN INVENTARIO</th>
                            <th style={{ padding: '20px' }}>Ventas Totales</th>
                            <th style={{ padding: '20px' }}>Rendimiento</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sellerStats.map((seller, index) => {
                            const percentage = globalRevenue > 0 ? (seller.stats.totalRevenue / globalRevenue) * 100 : 0;

                            return (
                                <tr key={seller.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '20px', borderBottom: '1px solid #f3f4f6' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: '35px', height: '35px', borderRadius: '50%',
                                                background: index === 0 ? '#eff6ff' : '#fdf2f8',
                                                color: index === 0 ? '#1d4ed8' : '#be185d',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                                            }}>
                                                {seller.name.charAt(0)}
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#111827' }}>{seller.name}</span>
                                                <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{seller.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px', fontSize: '1rem', fontWeight: 500, color: '#374151', textAlign: 'center', borderBottom: '1px solid #f3f4f6' }}>
                                        {seller.stats.productCount}
                                    </td>
                                    <td style={{ padding: '20px', borderBottom: '1px solid #f3f4f6' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 600, fontSize: '1rem', color: '#4f46e5' }}>
                                                {seller.stats.inventoryValue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px', borderBottom: '1px solid #f3f4f6' }}>
                                        <span style={{ fontWeight: 700, fontSize: '1rem', color: '#059669' }}>
                                            {seller.stats.totalRevenue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                        </span>
                                    </td>
                                    <td style={{ padding: '20px', borderBottom: '1px solid #f3f4f6' }}>
                                        {/* Efficiency Bar Mini */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ flex: 1, height: '6px', background: '#e5e7eb', borderRadius: '3px', width: '80px' }}>
                                                <div style={{
                                                    width: `${percentage}%`,
                                                    height: '100%',
                                                    background: percentage > 50 ? '#10b981' : '#f59e0b',
                                                    borderRadius: '3px'
                                                }} />
                                            </div>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#6b7280' }}>
                                                {percentage.toFixed(0)}%
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>

                {sellerStats.length === 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
                        No hay vendedores registrados todavía.
                    </div>
                )}
            </div>
        </div>
    );
}
