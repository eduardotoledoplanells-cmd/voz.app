'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../../admin.module.css';
import MediaGallery from '@/components/admin/MediaGallery';

export default function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [showMediaGallery, setShowMediaGallery] = useState(false);
    const [imageSource, setImageSource] = useState<'upload' | 'gallery'>('upload');
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        image: '',
        description: ''
    });

    useEffect(() => {
        loadCategory();
    }, [id]);

    async function loadCategory() {
        try {
            const response = await fetch('/api/categories');
            const categories = await response.json();
            const category = categories.find((c: any) => c.id === id);

            if (category) {
                setFormData({
                    name: category.name,
                    slug: category.slug,
                    image: category.image,
                    description: category.description || ''
                });
                setImagePreview(category.image);
            }
        } catch (error) {
            console.error('Error loading category:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleGenerateDescription() {
        if (!formData.name) return;

        setGenerating(true);
        try {
            const response = await fetch('/api/ai/generate-description', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ categoryName: formData.name })
            });

            if (response.ok) {
                const data = await response.json();
                setFormData(prev => ({ ...prev, description: data.description }));
            } else {
                alert('No se pudo generar la descripción');
            }
        } catch (error) {
            console.error('Error generating description:', error);
            alert('Error al conectar con el servicio de IA');
        } finally {
            setGenerating(false);
        }
    }

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);

        try {
            let imagePath = formData.image;

            // Upload image if a new one was selected
            if (imageFile) {
                const imageFormData = new FormData();
                imageFormData.append('file', imageFile);
                imageFormData.append('folder', 'categories');

                const uploadResponse = await fetch('/api/media/upload', {
                    method: 'POST',
                    body: imageFormData
                });

                if (uploadResponse.ok) {
                    const { url } = await uploadResponse.json();
                    imagePath = url;
                } else {
                    alert('Error al subir la imagen');
                    setSaving(false);
                    return;
                }
            }

            const response = await fetch('/api/categories', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    name: formData.name,
                    slug: formData.slug,
                    image: imagePath,
                    description: formData.description
                })
            });

            if (response.ok) {
                alert('Categoría actualizada correctamente');
                router.push('/admin/categories');
            } else {
                alert('Error al actualizar la categoría');
            }
        } catch (error) {
            console.error('Error updating category:', error);
            alert('Error al actualizar la categoría');
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return <div>Cargando...</div>;
    }

    return (
        <div>
            <div className={styles.header}>
                <h1 className={styles.title}>Editar Categoría</h1>
            </div>

            <div className={styles.card}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nombre</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Slug</label>
                        <input
                            type="text"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            required
                            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Imagen</label>

                        <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
                            <button
                                type="button"
                                onClick={() => {
                                    setImageSource('upload');
                                    setShowMediaGallery(false);
                                }}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: imageSource === 'upload' ? '#e74c3c' : '#f0f0f0',
                                    color: imageSource === 'upload' ? 'white' : '#333',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Subir Archivo
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setImageSource('gallery');
                                    setShowMediaGallery(true);
                                }}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: imageSource === 'gallery' ? '#e74c3c' : '#f0f0f0',
                                    color: imageSource === 'gallery' ? 'white' : '#333',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Elegir del Servidor
                            </button>
                        </div>

                        {imageSource === 'upload' ? (
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                        ) : (
                            <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '10px' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowMediaGallery(!showMediaGallery)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        backgroundColor: '#3498db',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        marginBottom: showMediaGallery ? '15px' : '0'
                                    }}
                                >
                                    {showMediaGallery ? 'Cerrar Galería' : 'Abrir Galería Multimedia'}
                                </button>

                                {showMediaGallery && (
                                    <div style={{ marginTop: '10px', maxHeight: '500px', overflowY: 'auto' }}>
                                        <MediaGallery
                                            selectionMode={true}
                                            maxSelection={1}
                                            onSelect={(files) => {
                                                if (files.length > 0) {
                                                    setFormData({ ...formData, image: files[0] });
                                                    setImagePreview(files[0]);
                                                    setImageFile(null); // Clear file if server image selected
                                                    setShowMediaGallery(false);
                                                }
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {imagePreview && (
                            <div style={{ marginTop: '10px' }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #ddd' }}
                                />
                                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
                                    {imageFile ? `Archivo seleccionado: ${imageFile.name}` : `URL: ${formData.image}`}
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                            <label style={{ fontWeight: 'bold' }}>Descripción</label>
                            <button
                                type="button"
                                onClick={handleGenerateDescription}
                                disabled={generating || !formData.name}
                                style={{
                                    padding: '5px 10px',
                                    fontSize: '0.8rem',
                                    backgroundColor: '#8e44ad',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: (generating || !formData.name) ? 'not-allowed' : 'pointer',
                                    opacity: (generating || !formData.name) ? 0.7 : 1
                                }}
                            >
                                {generating ? 'Generando...' : '✨ Generar con IA'}
                            </button>
                        </div>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={4}
                            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={saving}
                        >
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => router.push('/admin/categories')}
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
