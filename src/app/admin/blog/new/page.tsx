'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './form.module.css';

export default function NewArticlePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        excerpt: '',
        content: '',
        author: 'Eduardo Toledo',
        category: 'Guías y Tutoriales',
        tags: '',
        featuredImage: '/images/blog/placeholder.jpg',
        published: false
    });

    const categories = [
        'Guías y Tutoriales',
        'Historia y Nostalgia',
        'Análisis de Mercado',
        'Noticias',
        'Consejos de Compra/Venta'
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const articleData = {
                ...formData,
                tags: formData.tags.split(',').map(t => t.trim()).filter(t => t)
            };

            const response = await fetch('/api/blog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(articleData)
            });

            if (response.ok) {
                alert('Artículo creado correctamente');
                router.push('/admin/blog');
            } else {
                alert('Error al crear el artículo');
            }
        } catch (error) {
            console.error('Error creating article:', error);
            alert('Error al crear el artículo');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>Nuevo Artículo</h1>
                    <p>Crea un nuevo artículo para el blog</p>
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
                        placeholder="Título del artículo"
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Extracto *</label>
                    <textarea
                        required
                        rows={3}
                        value={formData.excerpt}
                        onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                        placeholder="Breve descripción del artículo (se muestra en el listado)"
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Contenido * (HTML)</label>
                    <textarea
                        required
                        rows={15}
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        placeholder="<h2>Título</h2><p>Contenido del artículo en HTML...</p>"
                        className={styles.contentArea}
                    />
                    <small>Usa HTML para formatear el contenido. Ejemplo: &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;strong&gt;, etc.</small>
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
                        placeholder="retro, nintendo, gaming (separadas por comas)"
                    />
                    <small>Separa las etiquetas con comas</small>
                </div>

                <div className={styles.formGroup}>
                    <label>Imagen destacada (URL)</label>
                    <input
                        type="text"
                        value={formData.featuredImage}
                        onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                        placeholder="/images/blog/mi-imagen.jpg"
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.checkbox}>
                        <input
                            type="checkbox"
                            checked={formData.published}
                            onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                        />
                        <span>Publicar inmediatamente</span>
                    </label>
                    <small>Si no está marcado, se guardará como borrador</small>
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
                        disabled={loading}
                        className={styles.submitButton}
                    >
                        {loading ? 'Creando...' : 'Crear Artículo'}
                    </button>
                </div>
            </form>
        </div>
    );
}
