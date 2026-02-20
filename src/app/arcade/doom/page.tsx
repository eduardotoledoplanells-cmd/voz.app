'use client';

import DoomGame from '@/components/game/DoomGame';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from './doom.module.css';

export default function DoomArcadePage() {
    const { user } = useAuth();

    return (
        <div className="container" style={{ padding: '40px 0' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '2.5rem', color: 'var(--cex-red)' }}>
                DOOM (Versión HTML)
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
                        <DoomGame />
                    </div>
                </div>

                <div style={{ marginTop: '40px', padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <h3>¿Cómo jugar?</h3>
                    <ul style={{ listStyle: 'inside', lineHeight: '1.6' }}>
                        <li>Usa las <strong>Flechas</strong> para moverte.</li>
                        <li><strong>CTRL</strong> para disparar.</li>
                        <li><strong>ESPACIO</strong> para abrir puertas.</li>
                        <li>Sobrevive <strong>3 minutos</strong> para ganar 1 ROBcoin.</li>
                        <li>1000 ROBcoins = 1€ de descuento.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
