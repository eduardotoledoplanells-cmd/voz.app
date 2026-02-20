'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './article.module.css';
import ShareButtons from '@/components/ui/ShareButtons';

interface Article {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    author: string;
    publishedAt: string;
    updatedAt: string;
    category: string;
    tags: string[];
    featuredImage: string;
    views: number;
}

export default function ArticlePage() {
    const params = useParams();
    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.slug) {
            fetchArticle(params.slug as string);
        }
    }, [params.slug]);

    const fetchArticle = async (slug: string) => {
        try {
            const response = await fetch(`/api/blog/${slug}`);
            if (response.ok) {
                const data = await response.json();
                setArticle(data);
            }
        } catch (error) {
            console.error('Error fetching article:', error);
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

    if (loading) {
        return <div className={styles.loading}>Cargando artículo...</div>;
    }

    if (!article) {
        return (
            <div className={styles.notFound}>
                <h1>Artículo no encontrado</h1>
                <Link href="/blog">Volver al blog</Link>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <Link href="/blog" className={styles.backLink}>
                ← Volver al blog
            </Link>

            <article className={styles.article}>
                <header className={styles.header}>
                    <div className={styles.category}>{article.category}</div>
                    <h1>{article.title}</h1>
                    <p className={styles.excerpt}>{article.excerpt}</p>
                    <div className={styles.meta}>
                        <span className={styles.author}>Por {article.author}</span>
                        <span className={styles.date}>{formatDate(article.publishedAt)}</span>
                        <span className={styles.views}>👁 {article.views} vistas</span>
                    </div>
                </header>

                <div className={styles.featuredImage}>
                    <img
                        src={article.featuredImage}
                        alt={article.title}
                        onError={(e) => {
                            e.currentTarget.src = '/images/placeholder-blog.jpg';
                        }}
                    />
                </div>

                <div
                    className={styles.content}
                    dangerouslySetInnerHTML={{ __html: article.content }}
                />

                <footer className={styles.footer}>
                    <div className={styles.tags}>
                        {article.tags.map((tag) => (
                            <span key={tag} className={styles.tag}>#{tag}</span>
                        ))}
                    </div>
                    <div className={styles.share}>
                        <ShareButtons url={`/blog/${article.slug}`} title={article.title} />
                    </div>
                </footer>
            </article>
        </div>
    );
}
