'use client';

import { useState, useEffect } from 'react';
import styles from './offers.module.css';

interface CustomOffer {
    id: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    description: string;
    images: string[];
    status: string;
    createdAt: string;
    adminNotes: string;
}

export default function OffersPage() {
    const [offers, setOffers] = useState<CustomOffer[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        fetchOffers();
    }, []);

    const fetchOffers = async () => {
        try {
            const response = await fetch('/api/custom-offer');
            const data = await response.json();
            setOffers(data.offers || []);
        } catch (error) {
            console.error('Error fetching offers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const response = await fetch(`/api/custom-offer/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setOffers(offers.filter(offer => offer.id !== id));
                setDeleteConfirm(null);
            } else {
                alert('Error al eliminar la oferta');
            }
        } catch (error) {
            console.error('Error deleting offer:', error);
            alert('Error al eliminar la oferta');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <h1>Ofertas Recibidas</h1>
                <div className={styles.loading}>Cargando ofertas...</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Ofertas Recibidas</h1>
                <div className={styles.counter}>
                    {offers.length} {offers.length === 1 ? 'oferta' : 'ofertas'}
                </div>
            </div>

            {offers.length === 0 ? (
                <div className={styles.empty}>
                    <p>No hay ofertas recibidas</p>
                </div>
            ) : (
                <div className={styles.offersGrid}>
                    {offers.map((offer) => (
                        <div key={offer.id} className={styles.offerCard}>
                            <div className={styles.offerHeader}>
                                <h3>{offer.customerName}</h3>
                                <span className={styles.date}>
                                    {formatDate(offer.createdAt)}
                                </span>
                            </div>

                            <div className={styles.offerInfo}>
                                <div className={styles.infoRow}>
                                    <strong>Email:</strong>
                                    <a href={`mailto:${offer.customerEmail}`}>
                                        {offer.customerEmail}
                                    </a>
                                </div>
                                <div className={styles.infoRow}>
                                    <strong>Teléfono:</strong>
                                    <a href={`tel:${offer.customerPhone}`}>
                                        {offer.customerPhone}
                                    </a>
                                </div>
                                <div className={styles.infoRow}>
                                    <strong>Descripción:</strong>
                                    <p>{offer.description}</p>
                                </div>
                            </div>

                            <div className={styles.imagesSection}>
                                <strong>Imágenes ({offer.images.length}):</strong>
                                <div className={styles.imageGrid}>
                                    {offer.images.map((image, index) => (
                                        <div
                                            key={index}
                                            className={styles.imageThumbnail}
                                            onClick={() => setSelectedImage(image)}
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={image} alt={`Imagen ${index + 1}`} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.actions}>
                                {deleteConfirm === offer.id ? (
                                    <div className={styles.confirmDelete}>
                                        <p>¿Eliminar esta oferta?</p>
                                        <button
                                            onClick={() => handleDelete(offer.id)}
                                            className={styles.confirmButton}
                                        >
                                            Sí, eliminar
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirm(null)}
                                            className={styles.cancelButton}
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setDeleteConfirm(offer.id)}
                                        className={styles.deleteButton}
                                    >
                                        🗑️ Eliminar Oferta
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedImage && (
                <div className={styles.lightbox} onClick={() => setSelectedImage(null)}>
                    <div className={styles.lightboxContent}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={selectedImage} alt="Vista ampliada" />
                        <button
                            className={styles.closeButton}
                            onClick={() => setSelectedImage(null)}
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
