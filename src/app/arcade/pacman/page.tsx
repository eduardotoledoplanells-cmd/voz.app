'use client';

import PacmanGame from '@/components/game/PacmanGame';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from './pacman.module.css';

export default function PacmanArcadePage() {
    const { user } = useAuth();

    return (
        <div className="container" style={{ padding: '40px 0' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '2.5rem', color: '#ffcc00', textShadow: '2px 2px 0px #000' }}>
                PAC-MAN
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

                {/* Arcade Machine Container */}
                <div className={styles.arcadeMachine}>
                    {/* Machine Background Image */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/images/arcade_machine.jpg"
                        alt="Arcade Machine"
                        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                    />

                    {/* Game Screen Overlay Area */}
                    <div style={{
                        position: 'absolute',
                        top: '33%',
                        left: '32.5%',
                        width: '35%',
                        height: '16.5%',
                        overflow: 'hidden',
                        borderRadius: '5%',
                        boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8)',
                        background: '#000'
                    }}>
                        <PacmanGame />
                    </div>
                </div>

                <div style={{ marginTop: '40px', padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <div className="relative z-10 mt-10 p-6 bg-gray-900/90 rounded-xl border border-yellow-500/50 max-w-2xl mx-auto shadow-2xl">
                        <h3 className="text-2xl font-bold text-yellow-500 mb-4 tracking-wider">REGLAS DEL JUEGO</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left text-sm text-gray-300 font-mono">
                            <div className="flex items-center gap-2"><span className="text-xl">🕹️</span> Usa el joystick para moverte.</div>
                            <div className="flex items-center gap-2"><span className="text-xl">👻</span> Come fantasmas: <span className="text-green-400 font-bold">+1 ROBcoin</span>.</div>
                            <div className="flex items-center gap-2"><span className="text-xl">💊</span> Bolas grandes = Poder.</div>
                            <div className="flex items-center gap-2"><span className="text-xl">⚠️</span> Inactividad = Reinicio.</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
