'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from '../login/auth.module.css';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const router = useRouter();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('Verificando tu cuenta...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Token de verificación no encontrado.');
            return;
        }

        const verifyToken = async () => {
            try {
                const res = await fetch('/api/auth/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token })
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.message || 'Error en la verificación');
                }

                setStatus('success');
                setMessage('¡Cuenta verificada con éxito!');

                // Optional: Redirect after a few seconds
                setTimeout(() => {
                    router.push('/login?verified=true');
                }, 3000);

            } catch (err: any) {
                setStatus('error');
                setMessage(err.message);
            }
        };

        verifyToken();
    }, [token, router]);

    return (
        <div className={styles.container} style={{ textAlign: 'center' }}>
            {status === 'verifying' && (
                <>
                    <h1 className={styles.title}>Verificando...</h1>
                    <div className="spinner" style={{ margin: '20px auto', width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #3498db', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    <p>{message}</p>
                </>
            )}

            {status === 'success' && (
                <>
                    <h1 className={styles.title} style={{ color: '#10b981' }}>¡Verificado!</h1>
                    <div style={{ fontSize: '4rem', margin: '20px 0' }}>✅</div>
                    <p style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Tu cuenta ha sido activada correctamente.</p>
                    <p className={styles.text}>Redirigiendo al inicio de sesión...</p>
                    <Link href="/login" className={styles.button} style={{ marginTop: '20px', display: 'inline-block', textDecoration: 'none' }}>
                        Iniciar Sesión Ahora
                    </Link>
                </>
            )}

            {status === 'error' && (
                <>
                    <h1 className={styles.title} style={{ color: '#ef4444' }}>Error</h1>
                    <div style={{ fontSize: '4rem', margin: '20px 0' }}>❌</div>
                    <p style={{ fontSize: '1.2rem', marginBottom: '20px' }}>{message}</p>
                    <Link href="/register" className={styles.button} style={{ marginTop: '20px', display: 'inline-block', textDecoration: 'none' }}>
                        Volver al Registro
                    </Link>
                </>
            )}

            <style jsx global>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div style={{ padding: '50px', textAlign: 'center' }}>Cargando...</div>}>
            <VerifyEmailContent />
        </Suspense>
    );
}
