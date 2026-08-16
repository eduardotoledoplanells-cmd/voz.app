'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client'; // Note: I need to create this browser client!

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Mock Turnstile reference
    const captchaRef = useRef<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        // Security: In production, verify captcha token before proceeding
        // const captchaToken = captchaRef.current;
        // if (!captchaToken) {
        //     setError("Por favor, verifica que eres humano.");
        //     setLoading(false);
        //     return;
        // }

        try {
            const res = await fetch('/api/voz/employees/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: email.trim(), password })
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.error || 'Credenciales inválidas o cuenta inexistente.');
                return;
            }

            if (data.employee) {
                localStorage.setItem('vozEmployee', JSON.stringify(data.employee));
            }
            if (data.token) {
                localStorage.setItem('voz_admin_token', data.token);
            }

            router.push('/');
            router.refresh();
        } catch (err: any) {
            setError('Ocurrió un error inesperado. Inténtalo más tarde.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh', 
            backgroundColor: '#008080' // Windows 98 background color
        }}>
            <div className="window" style={{ width: '350px' }}>
                <div className="title-bar">
                    <div className="title-bar-text">Inicio de Sesión Seguro</div>
                    <div className="title-bar-controls">
                        <button aria-label="Close"></button>
                    </div>
                </div>
                <div className="window-body">
                    <p style={{ textAlign: 'center', marginBottom: '15px' }}>
                        Acceso Restringido. Panel de Administración de LYVO.
                    </p>
                    
                    {error && (
                        <div style={{ color: 'red', marginBottom: '10px', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin}>
                        <div className="field-row-stacked" style={{ width: '220px', margin: '0 auto 10px auto' }}>
                            <label htmlFor="username">Usuario (ej. admin o Director)</label>
                            <input 
                                id="username" 
                                type="text" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Introduce tu usuario"
                                required
                            />
                        </div>

                        <div className="field-row-stacked" style={{ width: '220px', margin: '0 auto 15px auto' }}>
                            <label htmlFor="password">Contraseña</label>
                            <input 
                                id="password" 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div style={{ textAlign: 'center', marginTop: '15px' }}>
                            <button type="submit" disabled={loading} style={{ padding: '6px 20px', fontWeight: 'bold' }}>
                                {loading ? 'Verificando...' : '🔑 Entrar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
