'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PromoSlider() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % 2); // Only 2 slides for now (Arcade + Rules)
        }, 6000);
        return () => clearInterval(timer);
    }, []);

    const slides = [
        // Slide 1: ROBcoin Arcade (Cyberpunk/CRT Style)
        <div key="arcade" style={{
            width: '100%',
            height: '350px',
            background: 'linear-gradient(45deg, #1a0b2e 0%, #2d1b4e 100%)',
            position: 'relative',
            borderRadius: '12px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}>
            {/* Background Effects */}
            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(76, 29, 149, 0.4) 0%, transparent 70%)',
                zIndex: 1
            }} />
            <div style={{
                position: 'absolute', inset: 0,
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.2) 3px)', // CRT Scanlines
                zIndex: 2,
                pointerEvents: 'none'
            }} />

            {/* Content with Neon Glow */}
            <div style={{ position: 'relative', zIndex: 3, textAlign: 'center', color: 'white', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                    fontSize: '4rem',
                    fontWeight: '900',
                    color: '#fff',
                    textShadow: '0 0 10px #d946ef, 0 0 20px #d946ef, 0 0 40px #d946ef', // Neon Pink
                    lineHeight: 1,
                    marginBottom: '10px',
                    fontFamily: 'monospace' // Fallback mainly
                }}>
                    ARCADE
                </div>
                <div style={{
                    fontSize: '1.5rem',
                    color: '#22d3ee', // Cyan
                    textShadow: '0 0 10px #22d3ee',
                    marginBottom: '30px',
                    fontWeight: 'bold',
                    letterSpacing: '2px'
                }}>
                    JUEGA • GANA • CANJEA
                </div>

                <Link href="/arcade" style={{
                    display: 'inline-block',
                    padding: '15px 40px',
                    background: 'transparent',
                    color: '#fff',
                    textDecoration: 'none',
                    fontSize: '1.2rem',
                    borderRadius: '50px',
                    fontWeight: 'bold',
                    border: '2px solid #fff',
                    boxShadow: '0 0 10px #fff, inset 0 0 10px #fff',
                    textShadow: '0 0 5px #fff',
                    transition: 'all 0.3s'
                }}>
                    GAME START 👾
                </Link>
            </div>
        </div>,

        // Slide 2: Rules (User Custom Background)
        <div key="rules" style={{
            width: '100%',
            height: '350px',
            background: 'black', // Fallback
            borderRadius: '12px',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}>
            {/* Background Image with Dark Overlay */}
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'url(/images/robcoin_rewards_bg.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.6, // Darken for readability
                zIndex: 1
            }} />

            {/* Dark Gradient Overlay for text contrast */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.8))',
                zIndex: 2
            }} />

            <h2 style={{
                fontSize: '2rem',
                marginBottom: '30px',
                color: '#fbbf24', // Amber-400
                textTransform: 'uppercase',
                letterSpacing: '4px',
                fontWeight: 'bold',
                position: 'relative',
                zIndex: 2,
                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}>
                RevoluxBit Rewards
            </h2>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '30px',
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '30px 50px',
                borderRadius: '20px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
                position: 'relative',
                zIndex: 2
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', fontWeight: '800', lineHeight: 1, color: '#fcd34d' }}>1000</div>
                    <div style={{ fontSize: '1.2rem', color: '#fcd34d', fontWeight: '500' }}>ROBcoins</div>
                </div>
                <div style={{ fontSize: '3rem', fontWeight: '100', color: 'rgba(255,255,255,0.5)' }}>=</div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', fontWeight: '800', color: '#4ade80', lineHeight: 1, textShadow: '0 2px 10px rgba(74, 222, 128, 0.3)' }}>1 €</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '500', color: '#fff' }}>DESCUENTO</div>
                </div>
            </div>

            <p style={{ marginTop: '20px', fontSize: '1rem', opacity: 0.8, fontStyle: 'italic', position: 'relative', zIndex: 2 }}>
                &quot;Juega, acumula y ahorra en tu próxima consola&quot;
            </p>
        </div>
    ];

    return (
        <div style={{ margin: '40px 0', position: 'relative' }}>
            <div style={{ borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                {slides[index]}
            </div>

            <div style={{ position: 'absolute', bottom: '20px', left: 0, width: '100%', display: 'flex', justifyContent: 'center', gap: '10px', zIndex: 10 }}>
                {[0, 1].map((i) => (
                    <div
                        key={i}
                        onClick={() => setIndex(i)}
                        style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: i === index ? 'white' : 'rgba(255,255,255,0.5)',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                            transition: 'all 0.3s'
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
