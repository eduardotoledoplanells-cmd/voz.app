'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import styles from '../../new/form.module.css';

export default function EditArticlePage() {
    const router = useRouter();
    const params = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        excerpt: '',
        content: '',
        author: '',
        category: '',
        tags: '',
        featuredImage: '',
        published: false
    });

    const categories = [
        'Guías y Tutoriales',
        'Historia y Nostalgia',
        'Análisis de Mercado',
        'Noticias',
        'Consejos de Compra/Venta'
    ];

    useEffect(() => {
        if (params.id) {
            fetchArticle(params.id as string);
        }
    }, [params.id]);

    const fetchArticle = async (id: string) => {
        try {
            const response = await fetch(`/api/blog/${id}`);
            if (response.ok) {
                const article = await response.json();
                setFormData({
                    title: article.title,
                    excerpt: article.excerpt,
                    content: article.content,
                    author: article.author,
                    category: article.category,
                    tags: article.tags.join(', '),
                    featuredImage: article.featuredImage,
                    published: article.published
                });
            }
        } catch (error) {
            console.error('Error fetching article:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const articleData = {
                ...formData,
                tags: formData.tags.split(',').map(t => t.trim()).filter(t => t)
            };

            const response = await fetch(`/api/blog/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(articleData)
            });

            if (response.ok) {
                alert('Artículo actualizado correctamente');
                router.push('/admin/blog');
            } else {
                alert('Error al actualizar el artículo');
            }
        } catch (error) {
            console.error('Error updating article:', error);
            alert('Error al actualizar el artículo');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className={styles.container}><div className={styles.loading}>Cargando...</div></div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>Editar Artículo</h1>
                    <p>Modifica el artículo del blog</p>
                </div>
                <Link href="/admin/blog" className={styles.backButton}>
                    ← Volver
                </Link>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                    <label>Título *</label>
                    <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Extracto *</label>
                    <textarea
                        required
                        rows={3}
                        value={formData.excerpt}
                        onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Contenido * (HTML)</label>
                    <textarea
                        required
                        rows={15}
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        className={styles.contentArea}
                    />
                    <small>Usa HTML para formatear el contenido</small>
                </div>

                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                        <label>Autor *</label>
                        <input
                            type="text"
                            required
                            value={formData.author}
                            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Categoría *</label>
                        <select
                            required
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label>Etiquetas</label>
                    <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    />
                    <small>Separa las etiquetas con comas</small>
                </div>

                <div className={styles.formGroup}>
                    <label>Imagen destacada (URL)</label>
                    <input
                        type="text"
                        value={formData.featuredImage}
                        onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.checkbox}>
                        <input
                            type="checkbox"
                            checked={formData.published}
                            onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                        />
                        <span>Publicado</span>
                    </label>
                </div>

                <div className={styles.formActions}>
                    <button
                        type="button"
                        onClick={() => router.push('/admin/blog')}
                        className={styles.cancelButton}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className={styles.submitButton}
                    >
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </form>
        </div>
    );
}
