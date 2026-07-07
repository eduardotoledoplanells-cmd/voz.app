'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, Mail, Info, ShieldCheck, HelpCircle } from 'lucide-react';

export default function Footer() {
    const [showAboutModal, setShowAboutModal] = useState(false);
    const [showFaqModal, setShowFaqModal] = useState(false);

    return (
        <>
            <footer style={{
                backgroundColor: '#000',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '40px 20px 20px 20px',
                color: '#888',
                fontSize: '0.9rem'
            }}>
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    maxWidth: '1200px',
                    margin: '0 auto',
                    gap: '30px',
                    marginBottom: '40px'
                }}>
                    {/* Brand Column */}
                    <div style={{ flex: '1 1 300px', minWidth: '250px' }}>
                        <Link href="/feed" style={{ display: 'inline-block', marginBottom: '15px' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/logo/logo-white.png" alt="VOZ" style={{ height: '38px', objectFit: 'contain' }} />
                        </Link>
                        <p style={{ lineHeight: '1.6', color: '#666' }}>
                            VOZ es la app de audio y vídeo social donde tu voz importa. Conecta con tu comunidad, comparte tus historias y monetiza tu contenido de forma segura y privada.
                        </p>
                    </div>

                    {/* Links Column 1 */}
                    <div style={{ flex: '1 1 150px', minWidth: '120px' }}>
                        <h3 style={{ color: 'white', fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Navegación</h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <li><Link href="/feed" style={{ color: '#888', textDecoration: 'none' }} onMouseEnter={(e) => e.currentTarget.style.color = 'white'} onMouseLeave={(e) => e.currentTarget.style.color = '#888'}>Inicio / Feed</Link></li>
                            <li><Link href="/discover" style={{ color: '#888', textDecoration: 'none' }} onMouseEnter={(e) => e.currentTarget.style.color = 'white'} onMouseLeave={(e) => e.currentTarget.style.color = '#888'}>Descubrir</Link></li>
                            <li><Link href="/favorites" style={{ color: '#888', textDecoration: 'none' }} onMouseEnter={(e) => e.currentTarget.style.color = 'white'} onMouseLeave={(e) => e.currentTarget.style.color = '#888'}>Favoritos</Link></li>
                        </ul>
                    </div>

                    {/* Links Column 2 */}
                    <div style={{ flex: '1 1 150px', minWidth: '120px' }}>
                        <h3 style={{ color: 'white', fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Legal</h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <li><Link href="/legal/terms" style={{ color: '#888', textDecoration: 'none' }} onMouseEnter={(e) => e.currentTarget.style.color = 'white'} onMouseLeave={(e) => e.currentTarget.style.color = '#888'}>Términos y condiciones</Link></li>
                            <li><Link href="/legal/privacy" style={{ color: '#888', textDecoration: 'none' }} onMouseEnter={(e) => e.currentTarget.style.color = 'white'} onMouseLeave={(e) => e.currentTarget.style.color = '#888'}>Política de privacidad</Link></li>
                            <li><Link href="/legal/cookies" style={{ color: '#888', textDecoration: 'none' }} onMouseEnter={(e) => e.currentTarget.style.color = 'white'} onMouseLeave={(e) => e.currentTarget.style.color = '#888'}>Política de cookies</Link></li>
                        </ul>
                    </div>

                    {/* Links Column 3 */}
                    <div style={{ flex: '1 1 200px', minWidth: '180px' }}>
                        <h3 style={{ color: 'white', fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Comunidad</h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <li>
                                <a href="#" onClick={(e) => { e.preventDefault(); setShowAboutModal(true); }} style={{ color: '#888', textDecoration: 'none' }} onMouseEnter={(e) => e.currentTarget.style.color = 'white'} onMouseLeave={(e) => e.currentTarget.style.color = '#888'}>
                                    Quiénes somos
                                </a>
                            </li>
                            <li>
                                <a href="#" onClick={(e) => { e.preventDefault(); setShowFaqModal(true); }} style={{ color: '#888', textDecoration: 'none' }} onMouseEnter={(e) => e.currentTarget.style.color = 'white'} onMouseLeave={(e) => e.currentTarget.style.color = '#888'}>
                                    Preguntas frecuentes (FAQ)
                                </a>
                            </li>
                            <li style={{ color: '#666', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px' }}>
                                <Mail size={14} /> Soporte: voz@appvoz.com
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom line */}
                <div style={{
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    paddingTop: '20px',
                    textAlign: 'center',
                    fontSize: '0.8rem',
                    color: '#444',
                    maxWidth: '1200px',
                    margin: '0 auto'
                }}>
                    &copy; {new Date().getFullYear()} VOZ. Todos los derechos reservados.
                </div>
            </footer>

            {/* About Modal */}
            {showAboutModal && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 20000,
                    padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: '#111',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '20px',
                        padding: '30px',
                        maxWidth: '500px',
                        width: '100%',
                        position: 'relative',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
                        color: 'white'
                    }}>
                        <button
                            onClick={() => setShowAboutModal(false)}
                            style={{
                                position: 'absolute',
                                top: '15px',
                                right: '15px',
                                background: 'rgba(255,255,255,0.05)',
                                border: 'none',
                                color: '#aaa',
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                            }}
                        >
                            <X size={18} />
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                            <Info size={24} color="#8E2DE2" />
                            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 'bold' }}>Quiénes Somos</h2>
                        </div>
                        <p style={{ lineHeight: '1.6', color: '#ccc', fontSize: '0.95rem', marginBottom: '15px' }}>
                            VOZ es una plataforma social de audio y vídeo de última generación diseñada para dar voz a los creadores independientes de todo el mundo. Creemos en la libertad creativa y en una comunidad auténtica y libre de algoritmos manipuladores.
                        </p>
                        <p style={{ lineHeight: '1.6', color: '#ccc', fontSize: '0.95rem', marginBottom: '15px' }}>
                            Nuestra misión es empoderar a los creadores facilitando herramientas premium de interacción y una economía directa (a través de donaciones y regalos) que fluye sin intermediarios tradicionales, directamente a las carteras de los usuarios.
                        </p>
                        <p style={{ lineHeight: '1.6', color: '#ccc', fontSize: '0.95rem', margin: 0 }}>
                            Con VOZ, compartes tus momentos, interactúas con notas de voz de alta fidelidad, transmites tus directos centralizados y construyes un verdadero valor con tu comunidad.
                        </p>
                    </div>
                </div>
            )}

            {/* FAQ Modal */}
            {showFaqModal && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 20000,
                    padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: '#111',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '20px',
                        padding: '30px',
                        maxWidth: '550px',
                        width: '100%',
                        position: 'relative',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
                        color: 'white',
                        maxHeight: '85vh',
                        overflowY: 'auto'
                    }}>
                        <button
                            onClick={() => setShowFaqModal(false)}
                            style={{
                                position: 'absolute',
                                top: '15px',
                                right: '15px',
                                background: 'rgba(255,255,255,0.05)',
                                border: 'none',
                                color: '#aaa',
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                            }}
                        >
                            <X size={18} />
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                            <HelpCircle size={24} color="#8E2DE2" />
                            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 'bold' }}>Preguntas Frecuentes</h2>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
                            <div>
                                <h4 style={{ color: 'white', margin: '0 0 5px 0', fontSize: '0.95rem', fontWeight: 'bold' }}>¿Qué es VOZ?</h4>
                                <p style={{ color: '#aaa', margin: 0, fontSize: '0.88rem', lineHeight: '1.5' }}>Es una comunidad social basada en audio y vídeo corto donde los usuarios interactúan y apoyan directamente a sus creadores favoritos.</p>
                            </div>
                            <div>
                                <h4 style={{ color: 'white', margin: '0 0 5px 0', fontSize: '0.95rem', fontWeight: 'bold' }}>¿Cómo funciona la economía de Monedas?</h4>
                                <p style={{ color: '#aaa', margin: 0, fontSize: '0.88rem', lineHeight: '1.5' }}>Los usuarios pueden recargar Monedas de forma segura en la web y usarlas para enviar regalos en las publicaciones o durante las transmisiones en directo.</p>
                            </div>
                            <div>
                                <h4 style={{ color: 'white', margin: '0 0 5px 0', fontSize: '0.95rem', fontWeight: 'bold' }}>¿Cómo monetizan los creadores?</h4>
                                <p style={{ color: '#aaa', margin: 0, fontSize: '0.88rem', lineHeight: '1.5' }}>Al recibir un regalo o donación, el 65% limpio del valor en monedas se añade al saldo acumulado (Cartera) del creador, el cual puede retirar a su cuenta bancaria tras verificar su identidad.</p>
                            </div>
                            <div>
                                <h4 style={{ color: 'white', margin: '0 0 5px 0', fontSize: '0.95rem', fontWeight: 'bold' }}>¿Cómo conecto mis transmisiones en vivo?</h4>
                                <p style={{ color: '#aaa', margin: 0, fontSize: '0.88rem', lineHeight: '1.5' }}>En la sección de ajustes de tu perfil, puedes asociar tu canal de Twitch, Kick o YouTube para que tus seguidores en VOZ vean tu directo al instante.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
