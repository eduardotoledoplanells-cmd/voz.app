'use client';

import { useState, useEffect, use } from 'react';
import { Product } from '@/types';
import styles from './page.module.css';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useSellCart } from '@/context/SellContext';
import { useRouter } from 'next/navigation';
import Reviews from '@/components/ui/Reviews';
import { useFavorites } from '@/context/FavoritesContext';
import ShareButtons from '@/components/ui/ShareButtons';

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [product, setProduct] = useState<Product | null>(null);
    const [selectedImage, setSelectedImage] = useState(0);
    const { addToCart } = useCart();
    const { addToSellCart } = useSellCart();
    const { user } = useAuth();
    const { isFavorite, toggleFavorite } = useFavorites();
    const router = useRouter();
    const [added, setAdded] = useState(false);

    const isFav = product ? isFavorite(product.id) : false;

    const handleToggleFavorite = async () => {
        if (!product) return;
        await toggleFavorite(product);
    };

    useEffect(() => {
        fetch(`/api/products/${id}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error('Product not found');
                }
                return res.json();
            })
            .then(data => {
                setProduct(data);

                // Track product view
                if (data) {
                    fetch('/api/analytics', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            productId: data.id,
                            productTitle: data.title,
                            category: data.category
                        })
                    }).catch(err => console.error('Analytics error:', err));
                }
            })
            .catch(err => console.error(err));
    }, [id]);

    const handleAddToCart = () => {
        if (product) {
            addToCart(product);
            setAdded(true);
            setTimeout(() => setAdded(false), 2000);
        }
    };

    const handleSell = () => {
        if (product) {
            addToSellCart(product);
            router.push('/sell');
        }
    };

    if (!product) {
        return <div className={styles.productPage}>Cargando...</div>;
    }

    return (
        <div className={styles.productPage}>
            <Link href="/" className={styles.backLink}>
                ← Volver a la tienda
            </Link>

            <div className={styles.grid}>
                {/* Image Section */}
                <div className={styles.imageSection}>
                    <div className={styles.mainImage}>
                        {product.images && product.images.length > 0 ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={product.images[selectedImage]} alt={product.title} />
                        ) : (
                            <div>Sin imagen</div>
                        )}
                    </div>

                    {product.images && product.images.length > 1 && (
                        <div className={styles.thumbnails}>
                            {product.images.map((img, index) => (
                                <div
                                    key={index}
                                    className={`${styles.thumbnail} ${selectedImage === index ? styles.active : ''}`}
                                    onClick={() => setSelectedImage(index)}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={img} alt={`${product.title} ${index + 1}`} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Details Section */}
                <div className={styles.details}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h1 className={styles.title} style={{ marginBottom: 0 }}>{product.title}</h1>
                            {user && user.role === 'admin' && (
                                <Link
                                    href={`/admin/products/${product.id}`}
                                    title="Editar producto"
                                    style={{
                                        background: '#f0f0f0',
                                        border: '1px solid #ccc',
                                        borderRadius: '50%',
                                        width: '32px',
                                        height: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#333',
                                        textDecoration: 'none'
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                </Link>
                            )}
                        </div>
                        <button
                            onClick={handleToggleFavorite}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'white',
                                border: '1px solid #ddd',
                                padding: '8px 16px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 500
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={isFav ? "red" : "none"} stroke={isFav ? "red" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            Favorito
                        </button>
                    </div>
                    {product.reference && (
                        <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '10px', fontFamily: 'monospace' }}>
                            Ref: {product.reference}
                        </div>
                    )}

                    <div className={styles.priceSection}>
                        {product.isOnSale && product.salePrice ? (
                            <>
                                <div>
                                    <span className={styles.originalPrice}>€{product.price}</span>
                                    <span className={styles.price}>€{product.salePrice}</span>
                                </div>
                                <div className={styles.saleBadge}>
                                    ¡EN OFERTA! -{Math.round(((product.price - product.salePrice) / product.price) * 100)}%
                                </div>
                            </>
                        ) : (
                            <div className={styles.price}>€{product.price}</div>
                        )}
                    </div>

                    <div className={styles.info}>
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>Categoría</span>
                            <span className={styles.infoValue}>{product.category}</span>
                        </div>

                        {product.grade && (
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Estado</span>
                                <span className={styles.grade}>
                                    Grado {product.grade} - {
                                        product.grade === 'A' ? 'Como nuevo' :
                                            product.grade === 'B' ? 'Buen estado' :
                                                'Usado'
                                    }
                                </span>
                            </div>
                        )}

                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>Disponibilidad</span>
                            {product.stock > 0 ? (
                                <span className={styles.infoValue} style={{ color: product.stock < 5 ? '#ff9800' : '#4CAF50' }}>
                                    {product.stock < 5 ? `¡Solo quedan ${product.stock}!` : 'En stock'}
                                </span>
                            ) : (
                                <span className={styles.infoValue} style={{ color: '#f44336' }}>Agotado</span>
                            )}
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button
                            className={styles.addToCart}
                            onClick={handleAddToCart}
                            style={{
                                background: product.stock === 0 ? '#ccc' : (added ? '#4CAF50' : 'var(--cex-red)'),
                                cursor: product.stock === 0 ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {product.stock === 0 ? 'Agotado' : (added ? '✓ Añadido a la cesta' : 'Añadir a la cesta')}
                        </button>

                        <div className={styles.sellSection}>
                            {product.buyPrice && (
                                <div className={styles.buyPrice}>
                                    Te lo compramos por: <span>€{product.buyPrice}</span>
                                </div>
                            )}
                            <button
                                className={`btn btn-outline ${styles.sellButton}`}
                                onClick={handleSell}
                            >
                                Vender el mío
                            </button>
                        </div>
                    </div>

                    <ShareButtons url={`/product/${product.id}`} title={product.title} />
                </div>
            </div>

            {product.description && (
                <div className={styles.description}>
                    <h2>Descripción</h2>
                    <p>{product.description}</p>
                </div>
            )}

            <Reviews productId={product.id} />
        </div >
    );
}
