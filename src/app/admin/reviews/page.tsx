'use client';

import { useState, useEffect } from 'react';
import styles from '../admin.module.css';
import { Review } from '@/types';

export default function ReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAllReviews();
    }, []);

    const fetchAllReviews = async () => {
        try {
            // Fetch all reviews (including unapproved) - we'll need a new endpoint for this
            const res = await fetch('/api/reviews/all');
            const data = await res.json();
            setReviews(data);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (reviewId: string) => {
        try {
            const res = await fetch('/api/reviews/moderate', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: reviewId, approved: true })
            });

            if (res.ok) {
                setReviews(reviews.map(r =>
                    r.id === reviewId ? { ...r, approved: true } : r
                ));
            }
        } catch (error) {
            console.error('Error approving review:', error);
        }
    };

    const handleReject = async (reviewId: string) => {
        try {
            const res = await fetch('/api/reviews/moderate', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: reviewId })
            });

            if (res.ok) {
                setReviews(reviews.filter(r => r.id !== reviewId));
            }
        } catch (error) {
            console.error('Error rejecting review:', error);
        }
    };

    const pendingReviews = reviews.filter(r => !r.approved);
    const approvedReviews = reviews.filter(r => r.approved);

    if (loading) {
        return <div>Cargando comentarios...</div>;
    }

    return (
        <div>
            <div className={styles.header}>
                <h1 className={styles.title}>Moderación de Comentarios</h1>
            </div>

            <div className={styles.card} style={{ marginBottom: '20px' }}>
                <h2 style={{ marginBottom: '15px', color: '#ff9800' }}>
                    Pendientes de Aprobación ({pendingReviews.length})
                </h2>
                {pendingReviews.length === 0 ? (
                    <p style={{ color: '#666' }}>No hay comentarios pendientes</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {pendingReviews.map(review => (
                            <div key={review.id} style={{ padding: '15px', background: '#fff5f5', border: '1px solid #ffcdd2', borderRadius: '4px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <div>
                                        <strong>{review.userName}</strong>
                                        <span style={{ marginLeft: '10px', color: '#666' }}>
                                            {'⭐'.repeat(review.rating)}
                                        </span>
                                    </div>
                                    <span style={{ color: '#666', fontSize: '0.9rem' }}>
                                        {new Date(review.date).toLocaleDateString()}
                                    </span>
                                </div>
                                <p style={{ marginBottom: '15px' }}>{review.comment}</p>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => handleApprove(review.id)}
                                        style={{ padding: '8px 16px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        ✓ Aprobar
                                    </button>
                                    <button
                                        onClick={() => handleReject(review.id)}
                                        style={{ padding: '8px 16px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        ✗ Rechazar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className={styles.card}>
                <h2 style={{ marginBottom: '15px', color: '#4caf50' }}>
                    Comentarios Aprobados ({approvedReviews.length})
                </h2>
                {approvedReviews.length === 0 ? (
                    <p style={{ color: '#666' }}>No hay comentarios aprobados</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {approvedReviews.map(review => (
                            <div key={review.id} style={{ padding: '15px', background: '#f1f8f4', border: '1px solid #c8e6c9', borderRadius: '4px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <div>
                                        <strong>{review.userName}</strong>
                                        <span style={{ marginLeft: '10px', color: '#666' }}>
                                            {'⭐'.repeat(review.rating)}
                                        </span>
                                    </div>
                                    <span style={{ color: '#666', fontSize: '0.9rem' }}>
                                        {new Date(review.date).toLocaleDateString()}
                                    </span>
                                </div>
                                <p>{review.comment}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
