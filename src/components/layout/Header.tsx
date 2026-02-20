'use client';

import Link from 'next/link';
import styles from './Header.module.css';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { Product } from '@/types';

export default function Header() {
    const { itemCount } = useCart();
    const { user, logout } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [allProducts, setAllProducts] = useState<Product[]>([]);

    useEffect(() => {
        // Load all products for search
        fetch('/api/products')
            .then(res => res.json())
            .then(data => setAllProducts(data))
            .catch(err => console.error('Error loading products:', err));
    }, []);

    useEffect(() => {
        if (searchQuery.trim().length > 0) {
            const filtered = allProducts.filter(product =>
                product.title.toLowerCase().includes(searchQuery.toLowerCase())
            ).slice(0, 5);
            setSearchResults(filtered);
            setShowResults(true);
        } else {
            setSearchResults([]);
            setShowResults(false);
        }
    }, [searchQuery, allProducts]);

    return (
        <header className={styles.header}>
            <div className={styles.topBar}>
                <Link href="/" className={styles.logo}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo/logo-white.png" alt="RevoluxBit" style={{ height: '120px' }} />
                </Link>

                <div className={styles.searchContainer}>
                    <input
                        type="text"
                        placeholder="Busca tu producto..."
                        className={styles.searchInput}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => searchQuery && setShowResults(true)}
                    />
                    <button className={styles.searchButton}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </button>

                    {showResults && searchResults.length > 0 && (
                        <div className={styles.searchResults}>
                            {searchResults.map((product) => (
                                <Link
                                    key={product.id}
                                    href={`/product/${product.id}`}
                                    className={styles.searchResultItem}
                                    onClick={() => {
                                        setShowResults(false);
                                        setSearchQuery('');
                                    }}
                                >
                                    <div className={styles.resultImage}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={product.images[0]} alt={product.title} />
                                    </div>
                                    <div className={styles.resultInfo}>
                                        <div className={styles.resultTitle}>{product.title}</div>
                                        <div className={styles.resultPrice}>€{product.price}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.actions}>
                    <Link href="/sell">
                        <button className="btn btn-outline">VENDER</button>
                    </Link>
                    {user ? (
                        <div className={styles.userMenu}>
                            <button
                                className={styles.userButton}
                                onClick={() => setShowUserMenu(!showUserMenu)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                                <span>{user.name.split(' ')[0]}</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                            {showUserMenu && (
                                <div className={styles.userDropdown}>
                                    <Link href="/profile" className={styles.dropdownItem} onClick={() => setShowUserMenu(false)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                        Mi Perfil
                                    </Link>
                                    {user.role === 'admin' && (
                                        <Link href="/admin" className={styles.dropdownItem} onClick={() => setShowUserMenu(false)}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                <line x1="9" y1="9" x2="15" y2="15"></line>
                                                <line x1="15" y1="9" x2="9" y2="15"></line>
                                            </svg>
                                            Panel Admin
                                        </Link>
                                    )}
                                    <button onClick={() => { logout(); setShowUserMenu(false); }} className={styles.dropdownItem}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                            <polyline points="16 17 21 12 16 7"></polyline>
                                            <line x1="21" y1="12" x2="9" y2="12"></line>
                                        </svg>
                                        Cerrar Sesión
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link href="/login">
                            <button className="btn btn-outline">Iniciar Sesión</button>
                        </Link>
                    )}

                    <Link href="/favorites" className={styles.cartLink} style={{ marginRight: '15px' }}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill={user?.favorites?.length ? "red" : "none"}
                            stroke={user?.favorites?.length ? "red" : "currentColor"}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        {user?.favorites && user.favorites.length > 1 && (
                            <span className={styles.cartBadge}>{user.favorites.length}</span>
                        )}
                    </Link>
                    <Link href="/cart" className={styles.cartLink}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="9" cy="21" r="1"></circle>
                            <circle cx="20" cy="21" r="1"></circle>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                        {itemCount > 0 && (
                            <span className={styles.cartBadge}>{itemCount}</span>
                        )}
                    </Link>
                </div>
            </div>

            <nav className={styles.navBar}>
                <ul className={styles.navList}>
                    <li className={styles.navItem}>
                        <Link href="/categories">Juegos</Link>
                    </li>
                    <li className={styles.navItem}>
                        <Link href="/categories/moviles">Móviles</Link>
                    </li>
                    <li className={styles.navItem}>
                        <Link href="/categories/informatica">Informática</Link>
                    </li>
                    <li className={styles.navItem}>
                        <Link href="/categories/electronica">Electrónica</Link>
                    </li>
                    <li className={styles.navItem}>
                        <Link href="/categories/peliculas">Películas</Link>
                    </li>
                    <li className={styles.navItem}>
                        <Link href="/categories/musica">Música</Link>
                    </li>
                    <li className={styles.navItem}>
                        <Link href="/blog">Blog</Link>
                    </li>
                </ul>
            </nav>
        </header>
    );
}
