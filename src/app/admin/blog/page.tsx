'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './blog.module.css';

interface Article {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    author: string;
    publishedAt: string;
    category: string;
    published: boolean;
    views: number;
}

export default function AdminBlogPage() {
    const router = useRouter();
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

    useEffect(() => {
        fetchArticles();
    }, []);

    const fetchArticles = async () => {
        try {
            const response = await fetch('/api/blog');
            const data = await response.json();
            setArticles(data.articles);
        } catch (error) {
            console.error('Error fetching articles:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`¿Eliminar el artículo "${title}"?`)) return;

        try {
            const response = await fetch(`/api/blog/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert('Artículo eliminado correctamente');
                fetchArticles();
            } else {
                alert('Error al eliminar el artículo');
            }
        } catch (error) {
            console.error('Error deleting article:', error);
            alert('Error al eliminar el artículo');
        }
    };

    const togglePublished = async (article: Article) => {
        try {
            const response = await fetch(`/api/blog/${article.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ published: !article.published })
            });

            if (response.ok) {
                fetchArticles();
            }
        } catch (error) {
            console.error('Error updating article:', error);
        }
    };

    const filteredArticles = articles.filter(article => {
        if (filter === 'published') return article.published;
        if (filter === 'draft') return !article.published;
        return true;
    });

    const stats = {
        total: articles.length,
        published: articles.filter(a => a.published).length,
        draft: articles.filter(a => !a.published).length,
        totalViews: articles.reduce((sum, a) => sum + (a.views || 0), 0)
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>Gestión del Blog</h1>
                    <p>Administra los artículos de tu blog</p>
                </div>
                <Link href="/admin/blog/new" className={styles.createButton}>
                    + Nuevo Artículo
                </Link>
            </div>

            <div className={styles.stats}>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{stats.total}</div>
                    <div className={styles.statLabel}>Total Artículos</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{stats.published}</div>
                    <div className={styles.statLabel}>Publicados</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{stats.draft}</div>
                    <div className={styles.statLabel}>Borradores</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{stats.totalViews}</div>
                    <div className={styles.statLabel}>Vistas Totales</div>
                </div>
            </div>

            <div className={styles.filters}>
                <button
                    className={filter === 'all' ? styles.filterActive : styles.filterButton}
                    onClick={() => setFilter('all')}
                >
                    Todos ({stats.total})
                </button>
                <button
                    className={filter === 'published' ? styles.filterActive : styles.filterButton}
                    onClick={() => setFilter('published')}
                >
                    Publicados ({stats.published})
                </button>
                <button
                    className={filter === 'draft' ? styles.filterActive : styles.filterButton}
                    onClick={() => setFilter('draft')}
                >
                    Borradores ({stats.draft})
                </button>
            </div>

            {loading ? (
                <div className={styles.loading}>Cargando artículos...</div>
            ) : (
                <div className={styles.table}>
                    <table>
                        <thead>
                            <tr>
                                <th>Título</th>
                                <th>Categoría</th>
                                <th>Autor</th>
                                <th>Fecha</th>
                                <th>Vistas</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredArticles.map((article) => (
                                <tr key={article.id}>
                                    <td>
                                        <div className={styles.titleCell}>
                                            <strong>{article.title}</strong>
                                            <span className={styles.excerpt}>{article.excerpt.substring(0, 60)}...</span>
                                        </div>
                                    </td>
                                    <td>{article.category}</td>
                                    <td>{article.author}</td>
                                    <td>{new Date(article.publishedAt).toLocaleDateString('es-ES')}</td>
                                    <td>{article.views || 0}</td>
                                    <td>
                                        <button
                                            className={article.published ? styles.statusPublished : styles.statusDraft}
                                            onClick={() => togglePublished(article)}
                                        >
                                            {article.published ? '✓ Publicado' : '○ Borrador'}
                                        </button>
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            <Link
                                                href={`/blog/${article.slug}`}
                                                className={styles.actionView}
                                                target="_blank"
                                            >
                                                👁
                                            </Link>
                                            <Link
                                                href={`/admin/blog/edit/${article.id}`}
                                                className={styles.actionEdit}
                                            >
                                                ✏️
                                            </Link>
                                            <button
                                                className={styles.actionDelete}
                                                onClick={() => handleDelete(article.id, article.title)}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
