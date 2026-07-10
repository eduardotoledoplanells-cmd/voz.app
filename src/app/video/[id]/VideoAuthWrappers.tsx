"use client";
import { useAuth } from '@/context/AuthContext';
import BottomNav from '@/app/components/BottomNav';

export const TopBarDownload = ({ accentColor }: { accentColor: string }) => {
    const { user, isLoading } = useAuth();
    if (isLoading || user) return null;
    
    return (
        <a href="/voz.apk" download style={{
            fontSize: '12px',
            fontWeight: '700',
            color: '#fff',
            background: `linear-gradient(135deg, ${accentColor}, #4A00E0)`,
            padding: '7px 14px',
            borderRadius: '100px',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
        }}>
            Descargar App
        </a>
    );
};

export const BottomDownload = ({ accentColor }: { accentColor: string }) => {
    const { user, isLoading } = useAuth();
    if (isLoading) return null;
    
    if (user) {
        return <BottomNav />;
    }
    
    return (
        <>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: '14px' }}>
                Para dar me gusta, comentar y participar en VOZ, descarga la app gratuita
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <a href="/voz.apk" download style={{
                    background: `linear-gradient(135deg, ${accentColor}, #4A00E0)`,
                    color: 'white',
                    borderRadius: '14px',
                    padding: '15px',
                    fontWeight: '700',
                    fontSize: '15px',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 16px rgba(142, 45, 226, 0.35)',
                }}>
                    🤖 Descargar APK (Android Beta)
                </a>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{
                        flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                        color: 'rgba(255,255,255,0.35)', borderRadius: '14px', padding: '13px',
                        fontWeight: '600', fontSize: '13px', cursor: 'not-allowed', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', gap: '6px', textAlign: 'center',
                    }}>
                        🤖 Google Play (Pronto)
                    </div>
                    <div style={{
                        flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                        color: 'rgba(255,255,255,0.35)', borderRadius: '14px', padding: '13px',
                        fontWeight: '600', fontSize: '13px', cursor: 'not-allowed', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', gap: '6px', textAlign: 'center',
                    }}>
                        🍏 App Store (Pronto)
                    </div>
                </div>
            </div>
        </>
    );
};
