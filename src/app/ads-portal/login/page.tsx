'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdsPortalLogin() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            if (email && password) {
                // Import dynamic client-side Supabase
                const { supabaseBrowser } = await import('@/lib/supabaseBrowser');
                
                const { data, error: authError } = await supabaseBrowser.auth.signInWithPassword({
                    email,
                    password
                });

                if (authError) {
                    throw authError;
                }

                // Check if user has Advertiser role
                const user = data.user;
                if (!user || user.user_metadata?.role !== 'Advertiser') {
                    // Sign out because they are not an advertiser
                    await supabaseBrowser.auth.signOut();
                    throw new Error('No tienes permisos de Anunciante para acceder a este portal.');
                }

                router.push('/ads-portal/dashboard');
            } else {
                setError('Por favor completa todos los campos.');
            }
        } catch (err: any) {
            setError(err.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb', fontFamily: 'system-ui' }}>
            <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h1 style={{ color: '#0052cc', margin: 0, fontSize: '28px' }}>Lyvo Ads</h1>
                    <p style={{ color: '#666', marginTop: '10px' }}>Portal de Anunciantes y Agencias</p>
                </div>
                
                {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px', borderRadius: '6px', marginBottom: '20px', textAlign: 'center' }}>{error}</div>}
                
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#374151', fontWeight: 500 }}>Email Profesional</label>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
                            placeholder="agencia@empresa.com"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#374151', fontWeight: 500 }}>Contraseña</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
                            placeholder="••••••••"
                        />
                    </div>
                    <button 
                        type="submit"
                        disabled={loading}
                        style={{
                            marginTop: '10px',
                            padding: '12px',
                            backgroundColor: '#0052cc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold',
                            fontSize: '16px'
                        }}
                    >
                        {loading ? 'Iniciando sesión...' : 'Acceder a mis Campañas'}
                    </button>
                </form>
            </div>
        </div>
    );
}
