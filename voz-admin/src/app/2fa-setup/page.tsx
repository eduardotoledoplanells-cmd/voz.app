'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { createClient } from '@/lib/supabase-client';

export default function TwoFactorSetupPage() {
    const [qrCodeStr, setQrCodeStr] = useState<string | null>(null);
    const [factorId, setFactorId] = useState<string | null>(null);
    const [verifyCode, setVerifyCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const setupMFA = async () => {
            const supabase = createClient();
            
            // Clear any existing factors if the user refreshes the page
            const { data: factorsData } = await supabase.auth.mfa.listFactors();
            if (factorsData && factorsData.all) {
                for (const factor of factorsData.all) {
                    await supabase.auth.mfa.unenroll({ factorId: factor.id });
                }
            }

            const { data, error } = await supabase.auth.mfa.enroll({
                factorType: 'totp'
            });

            if (error || !data) {
                setError(`Error al iniciar la configuración del 2FA: ${error?.message || 'Data is null'}`);
                return;
            }

            setFactorId(data.id);
            setQrCodeStr(data.totp?.uri || '');
        };

        setupMFA();
    }, []);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!factorId) return;

        setLoading(true);
        setError(null);
        
        try {
            const supabase = createClient();
            const challenge = await supabase.auth.mfa.challenge({ factorId });
            
            if (challenge.error) {
                setError('Error de desafío de 2FA.');
                return;
            }

            const verify = await supabase.auth.mfa.verify({
                factorId,
                challengeId: challenge.data.id,
                code: verifyCode
            });

            if (verify.error) {
                setError('El código es incorrecto. Inténtalo de nuevo.');
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

    return (
        <div style={{
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh', 
            backgroundColor: '#008080'
        }}>
            <div className="window" style={{ width: '400px' }}>
                <div className="title-bar">
                    <div className="title-bar-text">Configurar Autenticación 2FA</div>
                </div>
                <div className="window-body">
                    <p style={{ textAlign: 'center', marginBottom: '15px' }}>
                        Por seguridad, debes configurar la autenticación de dos factores (TOTP) en tu primer acceso.
                        Escanea este código QR con Google Authenticator o Authy.
                    </p>
                    
                    {error && (
                        <div style={{ color: 'red', marginBottom: '10px', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                        {qrCodeStr ? (
                            <QRCodeSVG value={qrCodeStr} size={200} />
                        ) : (
                            <div style={{ width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid gray' }}>
                                Generando QR...
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleVerify}>
                        <div className="field-row-stacked" style={{ width: '200px', margin: '0 auto 15px auto' }}>
                            <label htmlFor="code">Código de 6 dígitos</label>
                            <input 
                                id="code" 
                                type="text" 
                                maxLength={6}
                                value={verifyCode}
                                onChange={(e) => setVerifyCode(e.target.value)}
                                required
                            />
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <button type="submit" disabled={loading || !factorId}>
                                {loading ? 'Verificando...' : 'Activar y Entrar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
