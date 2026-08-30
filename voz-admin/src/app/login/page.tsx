'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [requiresCode, setRequiresCode] = useState(false);
    const [requiresSetup, setRequiresSetup] = useState(false);
    const [tempSecret, setTempSecret] = useState('');
    const [qrUri, setQrUri] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const res = await fetch('/api/voz/employees/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    username: email.trim(), 
                    password,
                    code: requiresCode || requiresSetup ? code : undefined,
                    tempSecret: requiresSetup ? tempSecret : undefined
                })
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Credenciales inválidas.');
                setLoading(false);
                return;
            }

            if (data.requiresCode) {
                setRequiresCode(true);
                setRequiresSetup(false);
                setError(null);
                setLoading(false);
                return;
            }

            if (data.requiresSetup) {
                setRequiresSetup(true);
                setRequiresCode(false);
                setTempSecret(data.tempSecret);
                setQrUri(data.qrUri);
                setError(null);
                setLoading(false);
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

    const handleCancelMfa = () => {
        setRequiresCode(false);
        setRequiresSetup(false);
        setCode('');
        setTempSecret('');
        setQrUri('');
        setError(null);
    };

    return (
        <div style={{
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh', 
            backgroundColor: '#008080'
        }}>
            <div className="window" style={{ width: '360px' }}>
                <div className="title-bar">
                    <div className="title-bar-text">Inicio de Sesión Seguro</div>
                    <div className="title-bar-controls">
                        <button aria-label="Close" onClick={handleCancelMfa}></button>
                    </div>
                </div>
                <div className="window-body">
                    <p style={{ textAlign: 'center', marginBottom: '15px' }}>
                        Acceso Restringido. Panel de Administración de LYVO.
                    </p>
                    
                    {error && (
                        <div style={{ color: 'red', marginBottom: '10px', textAlign: 'center', fontWeight: 'bold' }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin}>
                        {!requiresCode && !requiresSetup && (
                            <>
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
                            </>
                        )}

                        {requiresSetup && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', margin: '10px 0', background: '#f0f0f0', padding: '10px', border: '1px solid #808080' }}>
                                <strong style={{ color: 'darkblue', fontSize: '13px' }}>Configuración de Doble Factor (2FA)</strong>
                                <span style={{ fontSize: '11px', textAlign: 'center', color: '#555', lineHeight: '1.3' }}>
                                    Escanea este código QR con la aplicación Google Authenticator:
                                </span>
                                {qrUri && <QRCodeSVG value={qrUri} size={130} />}
                                <div style={{ fontSize: '9px', color: '#666', wordBreak: 'break-all', textAlign: 'center' }}>
                                    Clave secreta: <code>{tempSecret}</code>
                                </div>
                                <div className="field-row-stacked" style={{ width: '220px', marginTop: '8px' }}>
                                    <label htmlFor="totpCode">Código verificador de 6 dígitos:</label>
                                    <input 
                                        id="totpCode" 
                                        type="text" 
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        placeholder="000000"
                                        maxLength={6}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>
                        )}

                        {requiresCode && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', margin: '15px 0', background: '#e0e0e0', padding: '10px', border: '1px solid #808080' }}>
                                <strong style={{ color: 'darkblue', fontSize: '13px' }}>Autenticación de 2 Factores (2FA)</strong>
                                <div className="field-row-stacked" style={{ width: '220px' }}>
                                    <label htmlFor="totpCode">Código Google Authenticator (OTP):</label>
                                    <input 
                                        id="totpCode" 
                                        type="text" 
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        placeholder="000000"
                                        maxLength={6}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px' }}>
                            {(requiresCode || requiresSetup) && (
                                <button type="button" onClick={handleCancelMfa} style={{ padding: '6px 15px' }}>
                                    ⬅️ Volver
                                </button>
                            )}
                            <button type="submit" disabled={loading} style={{ padding: '6px 20px', fontWeight: 'bold' }}>
                                {loading ? 'Procesando...' : (requiresCode || requiresSetup) ? '✔️ Verificar' : '🔑 Entrar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
