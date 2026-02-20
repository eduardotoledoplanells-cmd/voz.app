'use client';

import { Product } from '@/types';
import styles from './ProductCard.module.css';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

interface ProductCardProps {
    product: Product;
    variant?: 'default' | 'favorites';
    selectable?: boolean;
    selected?: boolean;
    onSelect?: () => void;
    selectionMode?: boolean;
}

export default function ProductCard({ product, variant = 'default', selectable, selected, onSelect, selectionMode }: ProductCardProps) {
    const { addToCart } = useCart();
    const [added, setAdded] = useState(false);
    const { user } = useAuth();
    const { isFavorite, toggleFavorite } = useFavorites();
    const isFav = isFavorite(product.id);

    const handleAddToCart = (e: React.MouseEvent) => {
        if (selectionMode) {
            e.preventDefault();
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        addToCart(product);
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
    };

    const handleToggleFavorite = async (e: React.MouseEvent) => {
        if (selectionMode) {
            e.preventDefault();
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        await toggleFavorite(product);
    };

    const handleCardClick = (e: React.MouseEvent) => {
        if (selectionMode) {
            e.preventDefault();
            e.stopPropagation();
            onSelect?.();
        }
    };

    const isFavoritesVariant = variant === 'favorites';

    return (
        <div
            className={styles.card}
            style={{
                border: selected ? '2px solid red' : undefined,
                cursor: selectionMode ? 'pointer' : 'default',
                opacity: selectionMode && !selected ? 0.7 : 1
            }}
            onClick={handleCardClick}
        >
            <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', display: 'flex', justifyContent: 'space-between', zIndex: 50 }}>
                {selectable ? (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.nativeEvent.stopImmediatePropagation();
                            onSelect?.();
                        }}
                        style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            background: selected ? 'red' : 'rgba(255,255,255,0.9)',
                            border: selected ? '2px solid white' : '1px solid #ccc',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: selected ? 'white' : '#ccc',
                            zIndex: 100,
                            padding: 0,
                        }}
                    >
                        {selected ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        ) : (
                            <div style={{ width: '16px', height: '16px', border: '2px solid #ccc', borderRadius: '4px' }}></div>
                        )}
                    </button>
                ) : <div></div>}

                <div style={{ display: 'flex', gap: '5px' }}>
                    {user && user.role === 'admin' && (
                        selectionMode ? (
                            <div
                                title="Modo selección"
                                style={{
                                    background: '#eee',
                                    borderRadius: '50%',
                                    width: '30px',
                                    height: '30px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#ccc',
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </div>
                        ) : (
                            <Link
                                href={`/admin/products/${product.id}`}
                                title="Editar producto"
                                style={{
                                    background: 'rgba(255,255,255,0.9)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '30px',
                                    height: '30px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: '#333',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </Link>
                        )
                    )}
                    <button
                        className={styles.favoriteButton}
                        onClick={handleToggleFavorite}
                        title={isFavoritesVariant ? "Eliminar de favoritos" : (isFav ? "Quitar de favoritos" : "Añadir a favoritos")}
                        style={{
                            background: 'rgba(255,255,255,0.8)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '30px',
                            height: '30px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: isFavoritesVariant ? '#dc2626' : (isFav ? 'red' : '#ccc'),
                            pointerEvents: selectionMode ? 'none' : 'auto',
                            opacity: selectionMode ? 0.5 : 1
                        }}
                    >
                        {isFavoritesVariant ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={isFav ? "red" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {selectionMode ? (
                <div className={styles.imageContainer}>
                    {product.images && product.images.length > 0 ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={product.images[0]} alt={product.title} className={styles.image} />
                    ) : (
                        <div className={styles.noImage}>Sin imagen</div>
                    )}
                </div>
            ) : (
                <Link href={`/product/${product.id}`} className={styles.imageContainer}>
                    {product.images && product.images.length > 0 ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={product.images[0]} alt={product.title} className={styles.image} />
                    ) : (
                        <div className={styles.noImage}>Sin imagen</div>
                    )}
                </Link>
            )}

            <div className={styles.content}>
                {selectionMode ? (
                    <div className={styles.title}>
                        {product.title}
                    </div>
                ) : (
                    <Link href={`/product/${product.id}`} className={styles.title}>
                        {product.title}
                    </Link>
                )}
                <div className={styles.details}>
                    {product.isOnSale && product.salePrice ? (
                        <div className={styles.priceContainer}>
                            <span className={styles.originalPrice}>€{product.price}</span>
                            <span className={styles.price}>€{product.salePrice}</span>
                            <span className={styles.saleBadge}>OFERTA</span>
                        </div>
                    ) : (
                        <span className={styles.price}>€{product.price}</span>
                    )}
                    {product.grade && <span className={styles.grade}>Grado {product.grade}</span>}
                </div>
                <div className={styles.actions}>
                    <button
                        className={styles.addButton}
                        onClick={handleAddToCart}
                        style={{
                            background: added ? '#4CAF50' : 'var(--cex-red)',
                            opacity: selectionMode ? 0.5 : 1,
                            pointerEvents: selectionMode ? 'none' : 'auto'
                        }}
                    >
                        {added ? '✓ Añadido' : 'Añadir a Cesta'}
                    </button>
                    {isFavoritesVariant && (
                        <button
                            className={styles.removeButton}
                            onClick={handleToggleFavorite}
                            style={{
                                background: 'white',
                                color: '#dc2626',
                                border: '1px solid #dc2626',
                                padding: '8px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                marginTop: '5px',
                                width: '100%',
                                fontSize: '0.9rem',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px'
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                            Eliminar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
