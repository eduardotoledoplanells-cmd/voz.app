'use client';

import { useState } from 'react';
import styles from './marketing.module.css';

export default function MarketingPage() {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        setStatus(null);

        try {
            const res = await fetch('/api/email/marketing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject, message })
            });

            const data = await res.json();

            if (res.ok) {
                setStatus({
                    type: 'success',
                    message: data.message || 'Campaña enviada correctamente'
                });
                setSubject('');
                setMessage('');
            } else {
                throw new Error(data.message || 'Error al enviar la campaña');
            }
        } catch (error) {
            setStatus({
                type: 'error',
                message: error instanceof Error ? error.message : 'Error desconocido'
            });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Email Marketing</h1>
                <p style={{ color: '#666', marginTop: '8px' }}>Envía novedades y ofertas a tus suscriptores.</p>
            </div>

            <div className={styles.card}>
                {status && (
                    <div className={status.type === 'success' ? styles.successMessage : styles.errorMessage}>
                        {status.type === 'success' ? '✅' : '⚠️'} {status.message}
                    </div>
                )}

                <div className={styles.statsRow}>
                    <div className={styles.statItem}>
                        <span className={styles.statValue}>Todos</span>
                        <span className={styles.statLabel}>Destinatarios (Consentimiento activo)</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Asunto del Correo</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Ej: ¡Ofertas exclusivas de verano!"
                            required
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Mensaje (HTML permitido)</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="<p>Hola aventurero,</p><p>Echa un vistazo a nuestras nuevas consolas...</p>"
                            required
                            className={styles.textarea}
                        />
                        <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '6px' }}>
                            Tip: Puedes usar etiquetas HTML básicas para formatear tu correo.
                        </p>
                    </div>

                    {message && (
                        <div className={styles.preview}>
                            <div className={styles.previewTitle}>Vista Previa del Contenido</div>
                            <div dangerouslySetInnerHTML={{ __html: message }} style={{ lineHeight: '1.6' }} />
                        </div>
                    )}

                    <div className={styles.buttonGroup}>
                        <button
                            type="submit"
                            disabled={sending || !subject || !message}
                            className={`${styles.btn} ${styles.btnPrimary}`}
                        >
                            {sending ? 'Enviando...' : '🚀 Enviar Campaña'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
