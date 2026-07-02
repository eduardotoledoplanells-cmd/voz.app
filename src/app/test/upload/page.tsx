import React from 'react';
import R2VideoUpload from '@/components/R2VideoUpload';

export const metadata = {
    title: 'Prueba de Almacenamiento R2 - VOZ',
    description: 'Página de verificación de subida de vídeos a Cloudflare R2 utilizando AWS S3 SDK.',
};

export default function R2TestPage() {
    return (
        <main style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: '#070714',
            color: 'white',
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            padding: '2rem',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Decorative Elements */}
            <div style={{
                position: 'absolute',
                top: '-20%',
                left: '-10%',
                width: '60%',
                height: '60%',
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, rgba(0,0,0,0) 70%)',
                borderRadius: '50%',
                filter: 'blur(100px)',
                zIndex: 0
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-20%',
                right: '-10%',
                width: '60%',
                height: '60%',
                background: 'radial-gradient(circle, rgba(219, 39, 119, 0.1) 0%, rgba(0,0,0,0) 70%)',
                borderRadius: '50%',
                filter: 'blur(100px)',
                zIndex: 0
            }} />

            <div style={{ zIndex: 1, width: '100%', maxWidth: '800px', textAlign: 'center' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{
                        fontSize: '2.5rem',
                        fontWeight: '900',
                        marginBottom: '0.75rem',
                        letterSpacing: '-0.03em',
                        background: 'linear-gradient(to right, #ffffff 40%, #a78bfa 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Cloudflare R2 Integration Hub
                    </h1>
                    <p style={{
                        fontSize: '1.125rem',
                        color: 'rgba(255, 255, 255, 0.65)',
                        maxWidth: '600px',
                        margin: '0 auto',
                        lineHeight: '1.6'
                    }}>
                        Verifica el correcto funcionamiento del almacenamiento en R2. Selecciona un vídeo, introduce el token Bearer del usuario para simular la seguridad del backend y súbelo.
                    </p>
                </div>

                {/* Main Upload Box Component */}
                <R2VideoUpload />

                {/* Instructions Section */}
                <div style={{
                    marginTop: '2.5rem',
                    padding: '1.5rem',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    textAlign: 'left',
                    fontSize: '0.85rem',
                    color: '#94a3b8',
                    lineHeight: '1.6'
                }}>
                    <h3 style={{ color: '#e2e8f0', fontWeight: '700', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                        💡 Guía rápida de pruebas:
                    </h3>
                    <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
                        <li style={{ marginBottom: '0.5rem' }}>
                            Asegúrate de que las variables `CLOUDFLARE_R2_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, y `CLOUDFLARE_R2_SECRET_ACCESS_KEY` están definidas en tu archivo `.env.local` del servidor.
                        </li>
                        <li style={{ marginBottom: '0.5rem' }}>
                            Para simular un usuario logueado en la aplicación, obtén el token de sesión (JWT) de Supabase desde la aplicación móvil o la consola web de desarrollo, y pégalo arriba.
                        </li>
                        <li>
                            Si la subida finaliza con éxito, verás la clave del bucket, el tamaño procesado y una vista previa interactiva del vídeo consumida desde tu CDN o dominio de R2.
                        </li>
                    </ul>
                </div>
            </div>
        </main>
    );
}
