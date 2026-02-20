'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import TouchControls from './TouchControls';

export default function Wolf3DGame() {
    const containerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [scale, setScale] = useState(1);
    const activeKeysRef = useRef<Set<string>>(new Set());
    const [gameStarted, setGameStarted] = useState(false);

    // Game Logic State
    const [gameState, setGameState] = useState<'playing' | 'ad'>('playing');
    const [kills, setKills] = useState(0); // Total kills in current session
    const [pendingKills, setPendingKills] = useState(0); // Kills towards next coin
    const [coinsEarned, setCoinsEarned] = useState(0); // ROBcoins earned in session
    const [adTimer, setAdTimer] = useState(5);
    const [message, setMessage] = useState('');

    const { user, updateUser } = useAuth();

    // Auto-start game by pressing Enter after load
    useEffect(() => {
        const simulateKey = (key: string, isDown: boolean) => {
            if (iframeRef.current && iframeRef.current.contentWindow) {
                const eventType = isDown ? 'keydown' : 'keyup';
                const event = new KeyboardEvent(eventType, {
                    key: key,
                    code: key === 'Enter' ? 'Enter' : '', // Adjust code if necessary
                    bubbles: true,
                    cancelable: true,
                });
                iframeRef.current.contentWindow.dispatchEvent(event);
            }
        };

        const timer = setTimeout(() => {
            simulateKey('Enter', true);
            setTimeout(() => {
                simulateKey('Enter', false);
                setGameStarted(true);
            }, 200);
        }, 2000); // Wait 2 seconds for game to load

        return () => clearTimeout(timer);
    }, []);

    // Refs for mutable state in event listeners if needed, though state updates are fine here
    // since we use functional updates.

    const savePoints = async (points: number) => {
        if (!user || points <= 0) return;
        try {
            const res = await fetch('/api/users/points', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, points: points })
            });
            if (res.ok) {
                const data = await res.json();
                const updatedUser = { ...user, points: data.totalPoints };
                updateUser(updatedUser);
            }
        } catch (e) {
            console.error('Error saving points:', e);
        }
    };

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data && event.data.type === 'WOLF3D_KILL') {
                setKills(prev => prev + 1);
                setPendingKills(prev => {
                    const newVal = prev + 1;
                    if (newVal >= 8) {
                        setCoinsEarned(c => c + 1);
                        return 0;
                    }
                    return newVal;
                });
            } else if (event.data && event.data.type === 'WOLF3D_GAMEOVER') {
                setGameState('ad');
                setAdTimer(5);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (gameState === 'ad') {
            interval = setInterval(() => {
                setAdTimer(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        // Save points when ad finishes
                        if (coinsEarned > 0) {
                            savePoints(coinsEarned);
                            setMessage(`¡Has ganado ${coinsEarned} ROBcoins!`);
                        } else {
                            setMessage('No has ganado ROBcoins esta vez.');
                        }

                        // We stay in 'ad' state showing the message, or provide a button to restart.
                        // The iframe game itself might need a reload or user interaction to restart properly
                        // without reloading the page.
                        // Ideally we reload the iframe to restart the game clean.
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [gameState, coinsEarned]); // coinsEarned is stable at this point

    const restartGame = () => {
        // Simple reload of the iframe to restart
        const iframe = containerRef.current?.querySelector('iframe');
        if (iframe) {
            iframe.src = iframe.src;
        }
        setGameState('playing');
        setKills(0);
        setPendingKills(0);
        setCoinsEarned(0);
        setMessage('');
    };


    useEffect(() => {
        const updateScale = () => {
            if (containerRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                const scaleX = clientWidth / 640;
                const scaleY = clientHeight / 400;
                setScale(Math.min(scaleX, scaleY));
            }
        };

        window.addEventListener('resize', updateScale);
        updateScale();

        const interval = setInterval(updateScale, 500);

        return () => {
            window.removeEventListener('resize', updateScale);
            clearInterval(interval);
        };
    }, []);

    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                height: '100%',
                background: 'black',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
            }}
        >
            {/* Status Overlay */}
            {gameState === 'playing' && (
                <>
                    {/* Kills - Top Left */}
                    <div style={{
                        position: 'absolute',
                        top: '5px',
                        left: '5px',
                        zIndex: 20,
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '10px',
                        pointerEvents: 'none',
                        textShadow: '1px 1px 1px black',
                        fontFamily: 'monospace'
                    }}>
                        <span>🎯 Kills: {kills}</span>
                    </div>

                    {/* Coins - Top Right */}
                    <div style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        zIndex: 20,
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '10px',
                        pointerEvents: 'none',
                        textShadow: '1px 1px 1px black',
                        fontFamily: 'monospace'
                    }}>
                        <span style={{ color: '#00ff00' }}>💰 {coinsEarned}</span>
                    </div>
                </>
            )}

            {/* Ad / Game Over Overlay */}
            {gameState === 'ad' && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'black', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', color: 'white', zIndex: 30
                }}>
                    {adTimer > 0 ? (
                        <>
                            <div style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#ffd700' }}>PUBLICIDAD (ROBcoin)</div>
                            <div style={{ width: '80%', height: '4px', background: '#333', marginBottom: '20px' }}>
                                <div style={{ width: `${((5 - adTimer) / 5) * 100}%`, height: '100%', background: '#e60000', transition: 'width 1s linear' }}></div>
                            </div>
                            <p>Guardando progreso en {adTimer} segundos...</p>
                            <div style={{ marginTop: '20px', fontSize: '0.8rem', opacity: 0.7 }}>Gracias a nuestros patrocinadores</div>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center' }}>
                            <h3 style={{ fontSize: '2rem', color: '#e60000', marginBottom: '20px' }}>¡GAME OVER!</h3>
                            <p style={{ fontSize: '1.2rem', marginBottom: '20px' }}>{message}</p>
                            <button
                                onClick={restartGame}
                                style={{
                                    padding: '10px 30px',
                                    fontSize: '1.2rem',
                                    cursor: 'pointer',
                                    background: '#e60000',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    textTransform: 'uppercase',
                                    fontWeight: 'bold'
                                }}
                            >
                                Jugar de nuevo
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div style={{
                width: '640px',
                height: '400px',
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
                flexShrink: 0
            }}>
                <iframe
                    ref={iframeRef}
                    src="/wolf3d/wolf3d-master/index.html"
                    style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                    title="Wolfenstein 3D"
                />
            </div>

            {/* Touch Controls for Mobile */}
            <TouchControls
                onDirectionChange={(direction) => {
                    // Simular teclas de dirección basado en el joystick
                    const threshold = 0.15; // Más sensible

                    // Horizontal
                    if (direction.x > threshold) {
                        simulateKey('ArrowRight', true);
                        simulateKey('ArrowLeft', false);
                    } else if (direction.x < -threshold) {
                        simulateKey('ArrowLeft', true);
                        simulateKey('ArrowRight', false);
                    } else {
                        simulateKey('ArrowLeft', false);
                        simulateKey('ArrowRight', false);
                    }

                    // Vertical
                    if (direction.y > threshold) {
                        simulateKey('ArrowDown', true);
                        simulateKey('ArrowUp', false);
                    } else if (direction.y < -threshold) {
                        simulateKey('ArrowUp', true);
                        simulateKey('ArrowDown', false);
                    } else {
                        simulateKey('ArrowUp', false);
                        simulateKey('ArrowDown', false);
                    }
                }}
                onShoot={() => {
                    simulateKey('Control', true);
                    setTimeout(() => simulateKey('Control', false), 150);
                }}
                onAction={() => {
                    simulateKey(' ', true);
                    setTimeout(() => simulateKey(' ', false), 100);
                }}
                showActionButton={true}
            />
        </div>
    );

    // Función para simular eventos de teclado en el iframe
    function simulateKey(key: string, isPressed: boolean) {
        if (!iframeRef.current?.contentWindow) return;

        try {
            const eventType = isPressed ? 'keydown' : 'keyup';
            let code = key;
            let keyCode = 0;

            if (key === ' ') {
                code = 'Space';
                keyCode = 32;
            } else if (key === 'ArrowUp') {
                code = 'ArrowUp';
                keyCode = 38;
            } else if (key === 'ArrowDown') {
                code = 'ArrowDown';
                keyCode = 40;
            } else if (key === 'ArrowLeft') {
                code = 'ArrowLeft';
                keyCode = 37;
            } else if (key === 'ArrowRight') {
                code = 'ArrowRight';
                keyCode = 39;
            } else if (key === 'Control') {
                code = 'ControlLeft';
                keyCode = 17;
            } else if (key === 'Enter') {
                code = 'Enter';
                keyCode = 13;
            }

            const eventInit = {
                key: key,
                code: code,
                keyCode: keyCode,
                which: keyCode,
                bubbles: true,
                cancelable: true,
                ctrlKey: false, // Forzamos false para probar si detecta solo keyCode
                shiftKey: false,
                altKey: false,
                metaKey: false,
                view: iframeRef.current.contentWindow
            };

            const event = new KeyboardEvent(eventType, eventInit);

            // Hack para navegadores antiguos o quirks: definir keyCode manualmente si es read-only
            Object.defineProperty(event, 'keyCode', { value: keyCode });
            Object.defineProperty(event, 'which', { value: keyCode });

            // Disparar en el documento y ventana del iframe
            const win = iframeRef.current.contentWindow;
            win.document.dispatchEvent(event);
            win.dispatchEvent(event);
            // Algunos juegos escuchan en body o html
            if (win.document.body) win.document.body.dispatchEvent(event);
            if (win.document.documentElement) win.document.documentElement.dispatchEvent(event);

            // Track active keys
            if (isPressed) {
                activeKeysRef.current.add(key);
            } else {
                activeKeysRef.current.delete(key);
            }
        } catch (e) {
            console.log('Could not simulate key:', e);
        }
    }

    function getKeyCode(key: string): number {
        const codes: Record<string, number> = {
            'ArrowLeft': 37,
            'ArrowUp': 38,
            'ArrowRight': 39,
            'ArrowDown': 40,
            ' ': 32,
            'Control': 17,
            'Enter': 13
        };
        return codes[key] || 0;
    }
}
