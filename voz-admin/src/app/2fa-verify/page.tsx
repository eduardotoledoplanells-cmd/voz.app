'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';

export default function TwoFactorVerifyPage() {
    const [factorId, setFactorId] = useState<string | null>(null);
    const [verifyCode, setVerifyCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const getFactor = async () => {
            const supabase = createClient();
            const { data, error } = await supabase.auth.mfa.listFactors();
            if (error) {
                setError('No se pudo verificar el estado del 2FA.');
                return;
            }

            if (data && data.totp.length > 0) {
                setFactorId(data.totp[0].id);
            } else {
                router.push('/2fa-setup');
            }
        };

        getFactor();
    }, [router]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!factorId) return;

        setLoading(true);
        setError(null);
        
        try {
            const supabase = createClient();
            const challenge = await supabase.auth.mfa.challenge({ factorId });
            
            if (challenge.error) {
                setError('Error en el desafío del 2FA.');
                return;
            }

            const verify = await supabase.auth.mfa.verify({
                factorId,
                challengeId: challenge.data.id,
                code: verifyCode
            });

            if (verify.error) {
                setError('El código es incorrecto. Comprueba Authy/Google Authenticator.');
                return;
            }

            // 2FA Activated and verified successfully
            router.push('/');
            router.refresh();
        } catch (err) {
            setError('Error inesperado.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    return (
        <div style={{
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh', 
            backgroundColor: '#008080'
        }}>
            <div className="window" style={{ width: '350px' }}>
                <div className="title-bar">
                    <div className="title-bar-text">Verificación en Dos Pasos (2FA)</div>
                </div>
                <div className="window-body">
                    <p style={{ textAlign: 'center', marginBottom: '15px' }}>
                        Abre tu aplicación de autenticación (Authy, Google Authenticator) y escribe el código de 6 dígitos.
                    </p>
                    
                    {error && (
                        <div style={{ color: 'red', marginBottom: '10px', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleVerify}>
                        <div className="field-row-stacked" style={{ width: '200px', margin: '0 auto 15px auto' }}>
                            <label htmlFor="code">Código TOTP</label>
                            <input 
                                id="code" 
                                type="text" 
                                maxLength={6}
                                value={verifyCode}
                                onChange={(e) => setVerifyCode(e.target.value)}
                                required
                            />
                        </div>

                        <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                            <button type="submit" disabled={loading || !factorId}>
                                {loading ? 'Comprobando...' : 'Entrar'}
                            </button>
                            <button type="button" onClick={handleLogout} disabled={loading}>
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
