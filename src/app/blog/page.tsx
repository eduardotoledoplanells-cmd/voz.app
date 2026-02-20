'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './blog.module.css';

interface Article {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    author: string;
    publishedAt: string;
    category: string;
    tags: string[];
    featuredImage: string;
    views: number;
}

interface Category {
    id: string;
    name: string;
    slug: string;
    description: string;
}

export default function BlogPage() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchArticles();
    }, [selectedCategory, searchQuery]);

    const fetchArticles = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                published: 'true',
                ...(selectedCategory && { category: selectedCategory }),
                ...(searchQuery && { search: searchQuery })
            });

            const response = await fetch(`/api/blog?${params}`);
            const data = await response.json();
            setArticles(data.articles);
            setCategories(data.categories);
        } catch (error) {
            console.error('Error fetching articles:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Blog RevoluxBit</h1>
                <p>Noticias, guías y análisis del mundo retro gaming</p>
            </div>

            <div className={styles.content}>
                <aside className={styles.sidebar}>
                    <div className={styles.searchBox}>
                        <input
                            type="text"
                            placeholder="Buscar artículos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>

                    <div className={styles.categories}>
                        <h3>Categorías</h3>
                        <button
                            className={!selectedCategory ? styles.categoryActive : styles.categoryButton}
                            onClick={() => setSelectedCategory('')}
                        >
                            Todas
                        </button>
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                className={selectedCategory === category.name ? styles.categoryActive : styles.categoryButton}
                                onClick={() => setSelectedCategory(category.name)}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                </aside>

                <main className={styles.articles}>
                    {loading ? (
                        <div className={styles.loading}>Cargando artículos...</div>
                    ) : articles.length === 0 ? (
                        <div className={styles.noResults}>
                            No se encontraron artículos.
                        </div>
                    ) : (
                        <div className={styles.articleGrid}>
                            {articles.map((article) => (
                                <Link
                                    key={article.id}
                                    href={`/blog/${article.slug}`}
                                    className={styles.articleCard}
                                >
                                    <div className={styles.articleImage}>
                                        <img
                                            src={article.featuredImage}
                                            alt={article.title}
                                            onError={(e) => {
                                                e.currentTarget.src = '/images/placeholder-blog.jpg';
                                            }}
                                        />
                                        <span className={styles.category}>{article.category}</span>
                                    </div>
                                    <div className={styles.articleContent}>
                                        <h2>{article.title}</h2>
                                        <p className={styles.excerpt}>{article.excerpt}</p>
                                        <div className={styles.meta}>
                                            <span className={styles.author}>Por {article.author}</span>
                                            <span className={styles.date}>{formatDate(article.publishedAt)}</span>
                                            <span className={styles.views}>👁 {article.views} vistas</span>
                                        </div>
                                        <div className={styles.tags}>
                                            {article.tags.slice(0, 3).map((tag) => (
                                                <span key={tag} className={styles.tag}>#{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
