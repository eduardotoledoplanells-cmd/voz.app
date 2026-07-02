'use client';

import { useState } from 'react';
import styles from '../landing.module.css';

export default function WaitlistSection({ ctaMode = false }: { ctaMode?: boolean }) {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [msg, setMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setStatus('loading');
        try {
            const res = await fetch('/api/voz/waitlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (res.ok) {
                setStatus('success');
                setMsg(data.message || '¡Apuntado! Te avisaremos en cuanto lancemos.');
                setEmail('');
            } else {
                setStatus('error');
                setMsg(data.error || 'Ha ocurrido un error. Inténtalo de nuevo.');
            }
        } catch {
            setStatus('error');
            setMsg('Error de conexión. Inténtalo de nuevo.');
        }
    };

    if (ctaMode) {
        return (
            <div className={styles.ctaFormWrap}>
                <form className={styles.ctaWaitlistForm} onSubmit={handleSubmit}>
                    <input
                        type="email"
                        className={styles.ctaInput}
                        placeholder="tu@email.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                    <button type="submit" className={styles.ctaBtn} disabled={status === 'loading'}>
                        {status === 'loading' ? '...' : 'Apuntarme'}
                    </button>
                </form>
                {msg && (
                    <div className={`${styles.waitlistMsg} ${status === 'success' ? styles.success : styles.error}`}
                         style={{ marginTop: 14 }}>
                        {msg}
                    </div>
                )}
                <p className={styles.ctaPrivacyNote}>
                    Sin spam. Nunca compartiremos tu email. Puedes cancelar cuando quieras.
                </p>
            </div>
        );
    }

    return (
        <div>
            <form className={styles.waitlistForm} onSubmit={handleSubmit}>
                <input
                    type="email"
                    className={styles.waitlistInput}
                    placeholder="Introduce tu email para unirte a la lista de espera"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                />
                <button type="submit" className={styles.waitlistBtn} disabled={status === 'loading'}>
                    {status === 'loading' ? 'Enviando...' : '🔔 Avisarme'}
                </button>
            </form>
            {msg && (
                <div className={`${styles.waitlistMsg} ${status === 'success' ? styles.success : styles.error}`}
                     style={{ marginTop: 12 }}>
                    {msg}
                </div>
            )}
        </div>
    );
}
