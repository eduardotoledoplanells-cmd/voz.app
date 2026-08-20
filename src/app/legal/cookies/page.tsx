import React from 'react';
import Link from 'next/link';

export default function CookiePolicyPage() {
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0B0B12', color: '#F1F1F5', fontFamily: 'Inter, sans-serif', padding: '40px 20px 80px' }}>
            <div style={{ maxWidth: '980px', margin: '0 auto' }}>
                {/* Header Superior */}
                <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                    <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: '20px', background: 'rgba(142, 45, 226, 0.15)', border: '1px solid rgba(142, 45, 226, 0.4)', color: '#C084FC', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>
                        Directiva ePrivacy • LYVO Media
                    </div>
                    <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 10px', background: 'linear-gradient(135deg, #FFFFFF 0%, #A855F7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Política de Cookies
                    </h1>
                    <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>
                        Última actualización: {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                </div>

                <div style={{ backgroundColor: '#13131F', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '36px 32px', lineHeight: '1.75', fontSize: '15px', color: 'rgba(255, 255, 255, 0.85)' }}>
                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px', marginBottom: '16px' }}>
                            1. ¿Qué son las Cookies?
                        </h2>
                        <p>
                            Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo al navegar por la plataforma web de LYVO para recordar tus preferencias de sesión, idioma, configuración de reproducción y permitir transacciones bancarias seguras.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px', marginBottom: '16px' }}>
                            2. Cookies Técnicas y de Seguridad Utilizadas
                        </h2>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '14px' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#FFFFFF' }}>
                                    <th style={{ padding: '12px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>Cookie</th>
                                    <th style={{ padding: '12px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>Finalidad</th>
                                    <th style={{ padding: '12px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>Duración</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ padding: '10px 12px', border: '1px solid rgba(255,255,255,0.08)' }}><code>sb-access-token</code></td>
                                    <td style={{ padding: '10px 12px', border: '1px solid rgba(255,255,255,0.08)' }}>Mantener autenticada la sesión de usuario de forma segura</td>
                                    <td style={{ padding: '10px 12px', border: '1px solid rgba(255,255,255,0.08)' }}>Sesión / 30 días</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '10px 12px', border: '1px solid rgba(255,255,255,0.08)' }}><code>__stripe_mid</code> / <code>__stripe_sid</code></td>
                                    <td style={{ padding: '10px 12px', border: '1px solid rgba(255,255,255,0.08)' }}>Prevención de fraude y seguridad bancaria en recargas de monedas y Stripe Connect</td>
                                    <td style={{ padding: '10px 12px', border: '1px solid rgba(255,255,255,0.08)' }}>1 año / 30 min</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '10px 12px', border: '1px solid rgba(255,255,255,0.08)' }}><code>lyvo_theme</code></td>
                                    <td style={{ padding: '10px 12px', border: '1px solid rgba(255,255,255,0.08)' }}>Preferencias de visualización y volumen de vídeo</td>
                                    <td style={{ padding: '10px 12px', border: '1px solid rgba(255,255,255,0.08)' }}>1 año</td>
                                </tr>
                            </tbody>
                        </table>
                    </section>

                    <section style={{ marginBottom: '10px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px', marginBottom: '16px' }}>
                            3. Gestión de Preferencias
                        </h2>
                        <p>
                            Puedes bloquear o eliminar las cookies instaladas en tu equipo mediante la configuración de las opciones de tu navegador web. Ten en cuenta que si deshabilitas las cookies técnicas necesarias, la sesión de usuario y la pasarela de pagos no podrán funcionar.
                        </p>
                    </section>
                </div>

                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                    <Link href="/legal/terms" style={{ color: '#A855F7', textDecoration: 'none', marginRight: '20px', fontSize: '14px' }}>
                        Términos y Condiciones
                    </Link>
                    <Link href="/" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '14px' }}>
                        Volver a LYVO
                    </Link>
                </div>
            </div>
        </div>
    );
}
