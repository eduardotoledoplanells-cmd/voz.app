'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import styles from '../login/auth.module.css';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [marketingConsent, setMarketingConsent] = useState(false);
    const [honeypot, setHoneypot] = useState('');

    // Math Challenge State
    const [mathQuestion, setMathQuestion] = useState('');
    const [mathAnswer, setMathAnswer] = useState('');
    const [mathSolution, setMathSolution] = useState(0);
    const [registered, setRegistered] = useState(false); // Success state

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    // const { login } = useAuth(); // Removed auto-login

    // Generate Math Challenge on Load
    useState(() => {
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        setMathQuestion(`${num1} + ${num2}`);
        setMathSolution(num1 + num2);
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Client-side Math Check (First Shield)
        if (parseInt(mathAnswer) !== mathSolution) {
            setError('La respuesta a la pregunta de seguridad es incorrecta.');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    marketingConsent,
                    honeypot,
                    mathChallenge: {
                        answer: mathAnswer,
                        solution: mathSolution
                    }
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Error al registrarse');
            }

            // Success: Show verification message
            setRegistered(true);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (registered) {
        return (
            <div className={styles.container}>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <h1 className={styles.title} style={{ color: '#10b981' }}>¡Registro Exitoso!</h1>
                    <p style={{ marginTop: '20px', fontSize: '1.1rem', lineHeight: '1.6' }}>
                        Hemos enviado un correo de verificación a <strong>{email}</strong>.
                    </p>
                    <p style={{ marginBottom: '30px', color: '#6b7280' }}>
                        Por favor, revisa tu bandeja de entrada (y spam) y haz clic en el enlace para activar tu cuenta.
                    </p>
                    <Link href="/login" className={styles.button} style={{ display: 'inline-block', textDecoration: 'none' }}>
                        Ir a Iniciar Sesión
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Crear Cuenta</h1>

            {error && <div className={styles.error}>{error}</div>}

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                    <label className={styles.label}>Nombre Completo</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className={styles.input}
                        placeholder="Ej. Juan Pérez"
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className={styles.input}
                        placeholder="tu@email.com"
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Contraseña</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className={styles.input}
                        placeholder="********"
                        minLength={6}
                    />
                </div>

                {/* Math Challenge Shield */}
                <div className={styles.formGroup} style={{ background: '#f3f4f6', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🛡️ Pregunta de Seguridad
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#374151' }}>
                            {mathQuestion} = ?
                        </span>
                        <input
                            type="number"
                            value={mathAnswer}
                            onChange={(e) => setMathAnswer(e.target.value)}
                            required
                            className={styles.input}
                            style={{ width: '80px', textAlign: 'center' }}
                            placeholder="Resp."
                        />
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '5px' }}>
                        Resuelve la suma para verificar que eres humano.
                    </p>
                </div>

                <div className={styles.formGroup} style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                    <input
                        type="checkbox"
                        id="marketingConsent"
                        checked={marketingConsent}
                        onChange={(e) => setMarketingConsent(e.target.checked)}
                        style={{ width: 'auto', margin: 0 }}
                    />
                    <label htmlFor="marketingConsent" style={{ margin: 0, fontWeight: 'normal', fontSize: '0.9rem' }}>
                        Acepto recibir ofertas y novedades por correo electrónico
                    </label>
                </div>

                {/* Honeypot field - hidden from humans, filled by bots */}
                <div style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }}>
                    <label>Website</label>
                    <input
                        type="text"
                        name="website"
                        value={honeypot}
                        onChange={(e) => setHoneypot(e.target.value)}
                        tabIndex={-1}
                        autoComplete="off"
                    />
                </div>

                <button type="submit" className={styles.button} disabled={loading}>
                    {loading ? 'Registrando...' : 'Registrarse'}
                </button>
            </form>

            <div className={styles.footer}>
                ¿Ya tienes cuenta? <Link href="/login" className={styles.link}>Inicia sesión</Link>
            </div>
        </div>
    );
}
