'use client';

import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { Review } from '@/types';
import styles from './Reviews.module.css';

export default function Reviews({ productId }: { productId: string }) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const { user } = useAuth();
    const [newComment, setNewComment] = useState('');
    const [newRating, setNewRating] = useState(5);
    const [userName, setUserName] = useState('');

    const aiReviews = [
        { rating: 5, text: "¡Excelente producto! Llegó muy rápido y en perfectas condiciones. Totalmente recomendado." },
        { rating: 4, text: "Buena relación calidad-precio. Funciona bien, aunque la caja estaba un poco dañada." },
        { rating: 5, text: "Me encanta, es justo lo que buscaba. El servicio de atención al cliente fue muy amable." },
        { rating: 3, text: "El producto está bien, pero el envío tardó más de lo esperado." },
        { rating: 5, text: "Increíble hallazgo. Llevaba tiempo buscando este juego retro." },
        { rating: 3, text: "Funciona correctamente, pero tiene algunos arañazos que no se mencionaban en la descripción." },
        { rating: 5, text: "Todo perfecto. Volveré a comprar seguro." },
        { rating: 4, text: "Muy contento con la compra. El estado es mejor de lo que esperaba para ser de segunda mano." },
        { rating: 5, text: "¡Genial! Funciona a las mil maravillas." }
    ];

    const aiNames = [
        "Alejandro M.", "Laura G.", "Carlos R.", "Sofía P.", "David L.", "Elena T.", "Javier S.", "Ana B.", "Pablo K."
    ];

    const generateAIReview = () => {
        const randomReview = aiReviews[Math.floor(Math.random() * aiReviews.length)];
        const randomName = aiNames[Math.floor(Math.random() * aiNames.length)];

        setNewRating(randomReview.rating);
        setNewComment(randomReview.text);
        setUserName(randomName);
    };



    useEffect(() => {
        // Load reviews from API
        fetch(`/api/reviews?productId=${productId}`)
            .then(res => res.json())
            .then(data => setReviews(data))
            .catch(err => console.error(err));
    }, [productId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const review = {
            productId,
            userName: user.role === 'admin' ? (userName || 'Admin') : user.name, // Allow admin to set custom name for AI reviews
            rating: newRating,
            comment: newComment,
            date: new Date().toISOString()
        };

        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(review)
            });

            if (res.ok) {
                const savedReview = await res.json();
                setReviews([...reviews, savedReview]);
                setNewComment('');
                setNewRating(5);
                setUserName('');
            }
        } catch (error) {
            console.error('Error saving review:', error);
        }
    };

    return (
        <div className={styles.reviewsSection}>
            <h2 className={styles.title}>Opiniones de Clientes</h2>

            <div className={styles.reviewsList}>
                {reviews.length === 0 ? (
                    <p className={styles.noReviews}>No hay opiniones todavía. ¡Sé el primero en opinar!</p>
                ) : (
                    reviews.map(review => (
                        <div key={review.id} className={styles.reviewCard}>
                            <div className={styles.reviewHeader}>
                                <span className={styles.userName}>{review.userName}</span>
                                <span className={styles.date}>{new Date(review.date).toLocaleDateString()}</span>
                            </div>
                            <div className={styles.rating}>
                                {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                            </div>
                            <p className={styles.comment}>{review.comment}</p>
                        </div>
                    ))
                )}
            </div>

            <div className={styles.addReview}>
                <h3>Escribir una opinión</h3>

                {user?.role === 'admin' && (
                    <div className={styles.loginToggle}>
                        <button
                            type="button"
                            onClick={generateAIReview}
                            className={styles.adminBtn}
                        >
                            🪄 Generar Opinión con IA (Solo Admin)
                        </button>
                    </div>
                )}

                {user ? (
                    <form onSubmit={handleSubmit} className={styles.form}>
                        {user.role === 'admin' && (
                            <div className={styles.formGroup}>
                                <label>Nombre (Simulado/Admin):</label>
                                <input
                                    type="text"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    placeholder="Nombre del usuario simulado"
                                    className={styles.input}
                                />
                            </div>
                        )}

                        <div className={styles.formGroup}>
                            <label>Calificación:</label>
                            <div className={styles.starRating}>
                                {[1, 2, 3, 4, 5].map(star => (
                                    <span
                                        key={star}
                                        onClick={() => setNewRating(star)}
                                        className={`${styles.star} ${star <= newRating ? styles.active : ''}`}
                                    >
                                        ★
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Comentario:</label>
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                required
                                className={styles.textarea}
                                rows={4}
                                placeholder="Comparte tu experiencia con este producto..."
                            />
                        </div>
                        <button type="submit" className={styles.submitButton}>
                            Publicar Opinión
                        </button>
                    </form>
                ) : (
                    <div className={styles.loginPrompt}>
                        <p>Debes estar registrado para dejar un comentario.</p>
                        {/* Link to login handled by header usually, or add a Link here */}
                    </div>
                )}
            </div>
        </div>
    );
}
