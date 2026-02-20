'use client';

import { useState } from 'react';
import MarioGame from '@/components/game/MarioGame';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function MarioArcadePage() {
    const { user } = useAuth();
    const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null);

    return (
        <div className="container" style={{ padding: '40px 0' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '2.5rem', color: '#ff0000', textShadow: '2px 2px 0px #000' }}>
                SUPER MARIO
            </h1>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <Link href="/arcade" style={{ color: 'var(--cex-red)', textDecoration: 'underline' }}>
                    &larr; Volver a Zona Arcade principal
                </Link>
            </div>

            <div style={{ width: '100%', margin: '0 auto' }}>
                {!user ? (
                    <div style={{ padding: '20px', background: '#ffebee', color: '#d32f2f', borderRadius: '8px', textAlign: 'center', marginBottom: '20px' }}>
                        Debes <Link href="/login" style={{ textDecoration: 'underline', fontWeight: 'bold' }}>iniciar sesión</Link> para guardar tus puntos.
                    </div>
                ) : (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                        <div style={{ background: '#f8f9fa', padding: '10px 20px', borderRadius: '30px', border: '1px solid #ddd', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.2rem' }}>🪙 Mis ROBcoins:</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#e60000' }}>{user.points || 0}</span>
                        </div>
                    </div>
                )}

                {/* TV Container */}
                <div style={{ position: 'relative', maxWidth: '2000px', margin: '0 auto' }}>
                    {/* Retro TV Background Image */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/images/retro_tv.png"
                        alt="Retro TV"
                        style={{ width: '100%', height: 'auto', display: 'block' }}
                    />

                    {/* Game Screen Overlay Area - Adjusted for Retro TV */}
                    <div style={{
                        position: 'absolute',
                        top: '28%',
                        left: '22%',
                        width: '48%',
                        height: '37%',
                        background: '#000',
                        overflow: 'hidden',
                        borderRadius: '5%', // Slight curve for corners
                        boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8)', // Internal shadow for depth
                    }}>
                        <MarioGame portalTarget={portalElement} />
                    </div>
                    {/* Portal Target for Game UI */}
                    <div
                        ref={setPortalElement}
                        id="mario-portal-target"
                        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 200 }}
                    />
                </div>

                <div style={{ marginTop: '80px', padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <div className="relative z-10 mt-10 p-6 bg-gray-900/90 rounded-xl border border-red-500/50 max-w-2xl mx-auto shadow-2xl">
                        <h3 className="text-2xl font-bold text-red-500 mb-4 tracking-wider">REGLAS DEL JUEGO</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left text-sm text-gray-300 font-mono">
                            <div className="flex items-center gap-2"><span className="text-xl">🕹️</span> Usa el joystick / flechas para moverte.</div>
                            <div className="flex items-center gap-2"><span className="text-xl">🍄</span> Recoge setas para crecer.</div>
                            <div className="flex items-center gap-2"><span className="text-xl">💰</span> 100 Monedas = <span className="text-green-500 font-bold">5 ROBcoins</span>.</div>
                            <div className="flex items-center gap-2"><span className="text-xl">🏃</span> SHIFT / Botón para correr/disparar.</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
