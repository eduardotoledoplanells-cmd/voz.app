'use client';

import { useFavorites } from '@/context/FavoritesContext';
import ProductCard from '@/components/ui/ProductCard';
import Link from 'next/link';
import styles from './favorites.module.css';

export default function FavoritesPage() {
    const { favorites, clearFavorites } = useFavorites();

    const handleClearAll = async () => {
        if (confirm('¿Estás seguro de que quieres eliminar todos los favoritos?')) {
            await clearFavorites();
        }
    };

    if (favorites.length === 0) {
        return (
            <div className={styles.emptyFavorites}>
                <div className={styles.emptyContent}>
                    <span className={styles.emptyIcon}>❤️</span>
                    <h1>Tu lista de favoritos está vacía</h1>
                    <p>Guarda tus productos favoritos para encontrarlos fácilmente más tarde</p>
                    <Link href="/categories" className="btn btn-primary">
                        Explorar Productos
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.favoritesPage}>
            <div className={styles.header}>
                <div>
                    <h1>Mis Favoritos</h1>
                    <p className={styles.count}>
                        {favorites.length} {favorites.length === 1 ? 'producto' : 'productos'}
                    </p>
                </div>
                <button
                    onClick={handleClearAll}
                    style={{
                        padding: '8px 16px',
                        background: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                    }}
                >
                    Vaciar Lista
                </button>
            </div>

            <div className={styles.productsGrid}>
                {favorites.map((product) => (
                    <ProductCard key={product.id} product={product} variant="favorites" />
                ))}
            </div>
        </div>
    );
}
