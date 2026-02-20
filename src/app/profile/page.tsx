'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Order } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './profile.module.css';
import { useFavorites } from '@/context/FavoritesContext';
import ProductCard from '@/components/ui/ProductCard';

export default function ProfilePage() {
    const { user, logout, updateUser, isLoading } = useAuth();
    const { favorites } = useFavorites();
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [address, setAddress] = useState({
        street: '',
        city: '',
        postalCode: '',
        country: '',
        phone: ''
    });
    const [marketingConsent, setMarketingConsent] = useState(false);
    const [saving, setSaving] = useState(false);
    const [sellerStats, setSellerStats] = useState<{
        inventoryValue: number;
        revenue: number;
        productCount: number;
    } | null>(null);

    // ROBcoin Timer Logic
    const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
    useEffect(() => {
        if (!user) return;

        const updateTimer = () => {
            const last = user.lastRobCoinEarned || 0;
            const now = Date.now();
            const ONE_DAY = 24 * 60 * 60 * 1000;
            const diff = now - last;

            if (diff >= ONE_DAY) {
                setTimeRemaining(null); // Available
            } else {
                const remaining = ONE_DAY - diff;
                const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((remaining / (1000 * 60)) % 60);
                const seconds = Math.floor((remaining / 1000) % 60);
                setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
            }
        };

        updateTimer(); // Initial call
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [user?.lastRobCoinEarned]);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (user) {
            setAddress(user.address || {
                street: '',
                city: '',
                postalCode: '',
                country: '',
                phone: ''
            });
            setMarketingConsent(user.marketingConsent || false);

            // Fetch orders
            fetch('/api/orders')
                .then(res => res.json())
                .then((data: Order[]) => {
                    const userOrders = data.filter(o => o.customerEmail === user.email);
                    // Sort by date desc
                    userOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    setOrders(userOrders);
                });

            // Fetch seller stats if admin
            if (user.role === 'admin') {
                fetch('/api/admin/sellers/stats')
                    .then(res => res.json())
                    .then(stats => {
                        const myStats = stats.find((s: any) => s.id === user.id);
                        if (myStats) {
                            setSellerStats(myStats);
                        }
                    })
                    .catch(err => console.error('Error fetching seller stats:', err));
            }
        }
    }, [user]);

    const handleSaveAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: user?.id, address, marketingConsent })
            });

            if (res.ok) {
                const updatedUser = await res.json();
                updateUser(updatedUser);
                alert('Dirección guardada correctamente');
            } else {
                alert('Error al guardar la dirección');
            }
        } catch (error) {
            console.error(error);
            alert('Error al guardar la dirección');
        } finally {
            setSaving(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: '#ff9800',
            processing: '#2196f3',
            shipped: '#9c27b0',
            delivered: '#4caf50',
            cancelled: '#f44336'
        };
        return colors[status] || '#999';
    };

    if (isLoading || !user) return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando perfil...</div>;

    return (
        <div className={styles.container}>
            <aside className={styles.sidebar}>
                <div className={styles.userInfo}>
                    <div className={styles.userName}>{user.name}</div>
                    <div className={styles.userEmail}>{user.email}</div>
                    {user.role === 'admin' && (
                        <Link
                            href="/admin"
                            className="btn btn-primary"
                            style={{
                                marginTop: '15px',
                                width: '100%',
                                textAlign: 'center',
                                display: 'block',
                                padding: '10px'
                            }}
                        >
                            🛠️ Panel de Control
                        </Link>
                    )}
                </div>
                <button onClick={logout} className={styles.logoutButton}>
                    Cerrar Sesión
                </button>
            </aside>

            <main className={styles.mainContent}>

                {user.role === 'admin' && sellerStats && (
                    <section className={styles.section} style={{ marginBottom: '30px', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white' }}>
                        <h2 className={styles.title} style={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            🚀 Tu Panel de Vendedor
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '8px', backdropFilter: 'blur(10px)' }}>
                                <div style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '5px' }}>Artículos en Stock</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{sellerStats.productCount}</div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Productos asignados</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '8px', backdropFilter: 'blur(10px)' }}>
                                <div style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '5px' }}>Valor del Inventario</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#4ade80' }}>
                                    €{sellerStats.inventoryValue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                </div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>En tus productos</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '8px', backdropFilter: 'blur(10px)' }}>
                                <div style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '5px' }}>Tus Ventas</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fbbf24' }}>
                                    €{sellerStats.revenue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                </div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Ingresos generados</div>
                            </div>
                        </div>
                    </section>
                )}

                {/* ROBcoin Customer Dashboard - Desactivado temporalmente con Zona Arcade */}
                {/* 
                <section className={styles.section} style={{ marginBottom: '30px', background: 'linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%)', color: 'white' }}>
                    <h2 className={styles.title} style={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        👾 Tu Panel ROBcoins 👾
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '8px', backdropFilter: 'blur(10px)' }}>
                            <div style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '5px' }}>Tus ROBcoins</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fbbf24' }}>
                                {user.points || 0}
                            </div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Saldo actual</div>
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '8px', backdropFilter: 'blur(10px)' }}>
                            <div style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '5px' }}>Estado Diario</div>
                            {timeRemaining ? (
                                <>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f87171' }}>
                                        {timeRemaining}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Para ganar otro coin</div>
                                </>
                            ) : (
                                <>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4ade80' }}>
                                        ¡Disponible!
                                    </div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Juega ahora para ganar</div>
                                    <Link href="/arcade" style={{ display: 'inline-block', marginTop: '5px', fontSize: '0.8rem', color: '#fbbf24', textDecoration: 'underline' }}>
                                        Ir al Arcade &rarr;
                                    </Link>
                                </>
                            )}
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '8px', backdropFilter: 'blur(10px)' }}>
                            <div style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '5px' }}>Reglas de Juego</div>
                            <div style={{ fontSize: '1rem', fontWeight: '500' }}>
                                1000 ROBcoins = 1 EURO de descuento en tus compras.
                            </div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '2px' }}>
                                Gana ROBcoins para tus descuentos jugando
                            </div>
                        </div>
                    </div>
                </section>
                */}

                <section className={styles.section}>
                    <h2 className={styles.title}>Dirección de Envío Predeterminada</h2>
                    <form onSubmit={handleSaveAddress} className={styles.form}>
                        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                            <label className={styles.label}>Dirección</label>
                            <input
                                type="text"
                                value={address.street}
                                onChange={(e) => setAddress({ ...address, street: e.target.value })}
                                className={styles.input}
                                placeholder="Calle, número, piso..."
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Ciudad</label>
                            <input
                                type="text"
                                value={address.city}
                                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Código Postal</label>
                            <input
                                type="text"
                                value={address.postalCode}
                                onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>País</label>
                            <input
                                type="text"
                                value={address.country}
                                onChange={(e) => setAddress({ ...address, country: e.target.value })}
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Teléfono</label>
                            <input
                                type="text"
                                value={address.phone}
                                onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.fullWidth} style={{ marginTop: '20px', padding: '15px', background: '#f9f9f9', borderRadius: '4px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={marketingConsent}
                                    onChange={(e) => setMarketingConsent(e.target.checked)}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '0.95rem' }}>
                                    Deseo recibir ofertas y promociones por correo electrónico
                                </span>
                            </label>
                        </div>
                        <div className={styles.fullWidth}>
                            <button type="submit" className={styles.saveButton} disabled={saving}>
                                {saving ? 'Guardando...' : 'Guardar Dirección'}
                            </button>
                        </div>
                    </form>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.title}>Mis Pedidos</h2>
                    {orders.length === 0 ? (
                        <p style={{ color: '#666' }}>No has realizado ningún pedido todavía.</p>
                    ) : (
                        orders.map(order => (
                            <div key={order.id} className={styles.orderCard}>
                                <div className={styles.orderHeader}>
                                    <div>
                                        <div className={styles.orderNumber}>{order.orderNumber}</div>
                                        <div className={styles.orderDate}>{new Date(order.date).toLocaleDateString()}</div>
                                    </div>
                                    <span
                                        className={styles.orderStatus}
                                        style={{ background: getStatusColor(order.status) + '20', color: getStatusColor(order.status) }}
                                    >
                                        {order.status}
                                    </span>
                                </div>
                                <div>
                                    {order.items.map((item, idx) => (
                                        <div key={idx} style={{ fontSize: '0.9rem', marginBottom: '5px' }}>
                                            {item.quantity}x {item.title}
                                        </div>
                                    ))}
                                </div>
                                <div className={styles.orderTotal}>
                                    Total: €{order.total.toFixed(2)}
                                </div>
                            </div>
                        ))
                    )}
                </section>

                <section className={styles.section}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 className={styles.title} style={{ margin: 0 }}>Mis Favoritos</h2>
                        {favorites.length > 0 && (
                            <Link href="/favorites" style={{ fontSize: '0.9rem', color: '#e60000', fontWeight: 600 }}>
                                Ver todos ({favorites.length})
                            </Link>
                        )}
                    </div>

                    {favorites.length === 0 ? (
                        <p style={{ color: '#666' }}>No tienes productos en favoritos.</p>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                            gap: '20px'
                        }}>
                            {favorites.slice(0, 4).map(product => (
                                <ProductCard key={product.id} product={product} variant="favorites" />
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
