'use client';

import { useState } from 'react';
import styles from './CustomOfferForm.module.css';

interface CustomOfferFormProps {
    onSuccess?: () => void;
}

export default function CustomOfferForm({ onSuccess }: CustomOfferFormProps) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        description: ''
    });
    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);

        // Validar número de imágenes
        if (images.length + files.length > 10) {
            setError('Máximo 10 imágenes permitidas');
            return;
        }

        // Validar tamaño de archivos
        const maxSize = 5 * 1024 * 1024; // 5MB
        const invalidFiles = files.filter(file => file.size > maxSize);
        if (invalidFiles.length > 0) {
            setError('Cada imagen debe ser menor a 5MB');
            return;
        }

        // Validar tipo de archivo
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const invalidTypes = files.filter(file => !validTypes.includes(file.type));
        if (invalidTypes.length > 0) {
            setError('Solo se permiten imágenes JPG, PNG o WEBP');
            return;
        }

        setError('');

        // Agregar nuevas imágenes
        const newImages = [...images, ...files];
        setImages(newImages);

        // Crear previews
        const newPreviews = [...previews];
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                newPreviews.push(reader.result as string);
                setPreviews([...newPreviews]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
        setPreviews(previews.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validaciones
        if (!formData.name || !formData.email || !formData.phone || !formData.description) {
            setError('Por favor completa todos los campos');
            setLoading(false);
            return;
        }

        if (images.length === 0) {
            setError('Por favor sube al menos una imagen');
            setLoading(false);
            return;
        }

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('email', formData.email);
            formDataToSend.append('phone', formData.phone);
            formDataToSend.append('description', formData.description);

            images.forEach((image) => {
                formDataToSend.append('images', image);
            });

            const response = await fetch('/api/custom-offer', {
                method: 'POST',
                body: formDataToSend
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Error al enviar la solicitud');
            }

            setSuccess(true);
            setFormData({ name: '', email: '', phone: '', description: '' });
            setImages([]);
            setPreviews([]);

            if (onSuccess) {
                setTimeout(() => {
                    onSuccess();
                }, 2000);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al enviar la solicitud');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className={styles.successMessage}>
                <div className={styles.successIcon}>✓</div>
                <h2>¡Solicitud Enviada!</h2>
                <p>Hemos recibido tu solicitud de oferta. Te contactaremos pronto.</p>
            </div>
        );
    }

    return (
        <div className={styles.formContainer}>
            <h2>Solicitar Oferta Personalizada</h2>
            <p className={styles.subtitle}>
                ¿Tienes algo que vender que no está en nuestro catálogo? Envíanos hasta 10 fotos y te haremos una oferta.
            </p>

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                    <label htmlFor="name">Nombre *</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="email">Email *</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="phone">Teléfono *</label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="description">Descripción del Producto *</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={4}
                        placeholder="Describe el producto que quieres vender (marca, modelo, estado, etc.) y haznos una oferta"
                        required
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Imágenes * (Máximo 10, 5MB cada una)</label>
                    <div className={styles.uploadArea}>
                        <input
                            type="file"
                            id="images"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            multiple
                            onChange={handleImageChange}
                            className={styles.fileInput}
                            disabled={images.length >= 10}
                        />
                        <label htmlFor="images" className={styles.uploadLabel}>
                            <span className={styles.uploadIcon}>📷</span>
                            <span>Haz clic o arrastra imágenes aquí</span>
                            <span className={styles.uploadHint}>
                                {images.length}/10 imágenes
                            </span>
                        </label>
                    </div>

                    {previews.length > 0 && (
                        <div className={styles.previewGrid}>
                            {previews.map((preview, index) => (
                                <div key={index} className={styles.previewItem}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={preview} alt={`Preview ${index + 1}`} />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className={styles.removeButton}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={loading}
                >
                    {loading ? 'Enviando...' : 'Enviar Solicitud'}
                </button>
            </form>
        </div>
    );
}
