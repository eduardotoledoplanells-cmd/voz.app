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
            const supabase = createClient();
            
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                // Avoid leaking if user exists or not
                setError('Credenciales inválidas o cuenta inexistente.');
                return;
            }

            // Auth successful, the middleware will catch and redirect if 2FA is needed.
            router.push('/');
            router.refresh(); // Refresh the router so middleware runs again
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
                        Acceso Restringido. SuperAdmins de Lyvo.
                    </p>
                    
                    {error && (
                        <div style={{ color: 'red', marginBottom: '10px', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin}>
                        <div className="field-row-stacked" style={{ width: '200px', margin: '0 auto 10px auto' }}>
                            <label htmlFor="email">Usuario / Email</label>
                            <input 
                                id="email" 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="field-row-stacked" style={{ width: '200px', margin: '0 auto 15px auto' }}>
                            <label htmlFor="password">Contraseña</label>
                            <input 
                                id="password" 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {/* Captcha Placeholder */}
                        <div style={{ width: '200px', margin: '0 auto 15px auto', textAlign: 'center' }}>
                            <div style={{ border: '1px solid gray', padding: '10px', background: 'white' }}>
                                <i>[ Turnstile Captcha ]</i>
                                <br />
                                <small>Preparado para Cloudflare</small>
                            </div>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <button type="submit" disabled={loading}>
                                {loading ? 'Verificando...' : 'Entrar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
