'use client';
import Link from 'next/link';
import styles from './admin.module.css';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!user || user.role !== 'admin') {
                router.push('/');
            }
        }
    }, [user, isLoading, router]);

    if (isLoading || !user || user.role !== 'admin') {
        return null; // Or a loading spinner
    }

    return (
        <div className={styles.container}>
            <aside className={styles.sidebar}>
                <Link href="/admin" className={styles.logo}>
                    ROB Admin
                </Link>
                {user && (
                    <div style={{ padding: '0 2rem', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '20px', marginTop: '-10px' }}>
                        👋 Hola, {user.name}
                    </div>
                )}
                <nav className={styles.nav}>
                    <Link href="/admin" className={styles.navItem}>
                        Dashboard
                    </Link>
                    <Link href="/admin/products" className={styles.navItem}>
                        Productos
                    </Link>
                    <Link href="/admin/categories" className={styles.navItem}>
                        Categorías
                    </Link>
                    <Link href="/admin/sellers" className={styles.navItem}>
                        👥 Vendedores
                    </Link>
                    <Link href="/admin/shipping" className={styles.navItem}>
                        Gestión de Envíos
                    </Link>
                    <Link href="/admin/shipments" className={styles.navItem}>
                        Tarifas de Envío
                    </Link>
                    <Link href="/admin/analytics" className={styles.navItem}>
                        📊 Estadísticas
                    </Link>
                    <Link href="/admin/marketing" className={styles.navItem}>
                        📢 Marketing
                    </Link>
                    <Link href="/admin/customers" className={styles.navItem}>
                        👥 Clientes
                    </Link>
                    <Link href="/admin/reviews" className={styles.navItem}>
                        💬 Comentarios
                    </Link>
                    <Link href="/admin/media" className={styles.navItem}>
                        🖼️ Medios
                    </Link>
                    <Link href="/admin/blog" className={styles.navItem}>
                        📝 Blog
                    </Link>
                    <Link href="/admin/offers" className={styles.navItem}>
                        📦 Ofertas Recibidas
                    </Link>
                    <div style={{ marginTop: 'auto' }}>
                        <Link href="/" className={styles.navItem}>
                            &larr; Volver a la Tienda
                        </Link>
                    </div>
                </nav>
            </aside>
            <main className={styles.main}>
                {children}
            </main>
        </div>
    );
}
