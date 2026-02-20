'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import TouchControls from './TouchControls';

export default function DoomGame() {
    const containerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const activeKeysRef = useRef<Set<string>>(new Set());

    // Game State
    // 'initial': Pantalla de título
    // 'playing': Jugando normal
    // 'ad': Pantalla de "Cobra y Salir" (Game Over)
    // 'interruption_ad': Pausa publicitaria obligatoria
    const [gameState, setGameState] = useState<'initial' | 'playing' | 'ad' | 'interruption_ad'>('initial');
    const [survivalTime, setSurvivalTime] = useState(0);
    const [coinsEarned, setCoinsEarned] = useState(0);
    const [adTimer, setAdTimer] = useState(5);
    const [message, setMessage] = useState('');

    // Timer Ref for coin calculation
    const timeRef = useRef(0);

    // Activity Monitor Ref
    const lastActivityRef = useRef(Date.now());
    const [isAfk, setIsAfk] = useState(false);

    const { user, updateUser } = useAuth();

    // Helper to register activity and reset timer if returning from AFK
    const checkActivity = () => {
        const now = Date.now();
        // Si ha pasado más de 12 segundos desde la última actividad (10s de límite + 2s margen), 
        // significa que el usuario estaba AFK y acaba de volver.
        if (now - lastActivityRef.current > 12000) {
            setSurvivalTime(0); // CASTIGO: Resetear tiempo a cero
            setIsAfk(false);
        } else {
            // Actividad normal continuada
            setIsAfk(false);
        }
        lastActivityRef.current = now;
    };

    // Communicate with iframe to track activity
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data && event.data.type === 'DOOM_ACTIVITY') {
                checkActivity();
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    // Survival Coin Logic & Ad Breaks
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (gameState === 'playing') {
            interval = setInterval(() => {
                const now = Date.now();
                // Check if inactive for more than 10 seconds (AFK)
                if (now - lastActivityRef.current > 10000) {
                    setIsAfk(true);
                    return; // Pause timer
                }

                setIsAfk(false);
                setSurvivalTime(prev => {
                    const newTime = prev + 1;
                    timeRef.current = newTime;

                    // Every 3 minutes (180 seconds)
                    if (newTime > 0 && newTime % 180 === 0) {
                        setCoinsEarned(c => c + 1);

                        // Trigger Ad Break
                        setGameState('interruption_ad');
                        setAdTimer(15); // 15 seconds ad
                    }
                    return newTime;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [gameState]);

    // Interruption Ad Logic (Auto Resume)
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (gameState === 'interruption_ad') {
            interval = setInterval(() => {
                setAdTimer(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        // Auto Resume
                        setGameState('playing');
                        // Refocus game
                        setTimeout(() => {
                            if (iframeRef.current && iframeRef.current.contentWindow) {
                                iframeRef.current.contentWindow.focus();
                            }
                        }, 100);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [gameState]);

    // Save Points
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
                updateUser({ ...user, points: data.totalPoints });
            }
        } catch (e) {
            console.error('Error saving points:', e);
        }
    };

    // Manual Cash Out Logic
    const finishSession = () => {
        setGameState('ad'); // 'ad' here means the "End Session" screen
        setAdTimer(5);
    };

    // End Session Timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (gameState === 'ad') {
            interval = setInterval(() => {
                setAdTimer(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        if (coinsEarned > 0) {
                            savePoints(coinsEarned);
                            setMessage(`¡Has ganado ${coinsEarned} ROBcoins por sobrevivir ${survivalTime}s!`);
                        } else {
                            setMessage('No has ganado ROBcoins esta vez.');
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [gameState, coinsEarned, survivalTime]);

    // Force Iframe Content Scaling
    const handleIframeLoad = () => {
        if (!iframeRef.current?.contentWindow) return;
        const win = iframeRef.current.contentWindow;
        const doc = win.document;

        // Inject CSS to force full stretch
        const style = doc.createElement('style');
        style.textContent = `
            html, body {
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 0;
                overflow: hidden !important;
                background: black;
            }
            #canvas, canvas, .dosbox-container { 
                width: 100% !important; 
                height: 100% !important; 
                object-fit: fill !important;
                display: block !important;
                position: absolute;
                top: 0;
                left: 0;
            }
        `;
        doc.head.appendChild(style);

        // Initial Focus
        win.focus();
    };

    const startGame = () => {
        setGameState('playing');
        setSurvivalTime(0);
        setCoinsEarned(0);
        setMessage('');

        // Aggressively attempt to focus the game canvas
        setTimeout(() => {
            if (iframeRef.current && iframeRef.current.contentWindow) {
                const iframeWindow = iframeRef.current.contentWindow;
                iframeWindow.focus();
                try {
                    const canvas = iframeWindow.document.getElementById('canvas');
                    if (canvas) {
                        canvas.focus();
                        canvas.click();
                    }
                } catch (e) {
                    console.log("Could not focus inner canvas:", e);
                }
            }
        }, 100);
    };

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
            {(gameState === 'playing' || gameState === 'interruption_ad') && (
                <>
                    {/* Time - Top Left */}
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
                        <span>⏱️ {Math.floor(survivalTime / 60)}m {survivalTime % 60}s</span>
                        {isAfk && <span style={{ color: 'red', fontWeight: 'bold', animation: 'blink 1s infinite', marginLeft: '5px' }}>⚠️ INACTIVO</span>}
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

                    {/* Cobrar Button - Fixed Top Right to not obstruct game */}
                    {gameState === 'playing' && (
                        <button
                            onClick={finishSession}
                            style={{
                                position: 'fixed',
                                top: '130px', // Un pelín abajo
                                left: '135px', // Ajuste fino (mitad del movimiento anterior)
                                zIndex: 9999,
                                background: 'linear-gradient(45deg, #e60000, #ff4d4d)',
                                color: 'white',
                                border: '2px solid white',
                                borderRadius: '20px',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                fontFamily: 'monospace',
                                padding: '8px 16px',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                            }}
                        >
                            <span>💰 COBRAR</span>
                        </button>
                    )}

                    {/* Reset Button - Fixed Above Cash Out */}
                    {gameState === 'playing' && (
                        <button
                            onClick={() => {
                                if (iframeRef.current) {
                                    iframeRef.current.src = iframeRef.current.src;
                                }
                                setGameState('initial');
                            }}
                            style={{
                                position: 'fixed',
                                top: '90px', // Encima del de cobrar (130-40)
                                left: '135px', // Mismo left que cobrar
                                zIndex: 9999,
                                background: 'rgba(0,0,0,0.6)',
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.5)',
                                borderRadius: '20px',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                padding: '6px 12px',
                                backdropFilter: 'blur(4px)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                            }}
                        >
                            <span>🔄 REINICIAR</span>
                        </button>
                    )}
                </>
            )}

            {/* Interruption Ad Overlay */}
            {gameState === 'interruption_ad' && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'black', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', color: 'white', zIndex: 40
                }}>
                    <h3 style={{ color: '#ffd700', fontSize: '2rem', marginBottom: '20px' }}>PAUSA PUBLICITARIA</h3>
                    <p>Has ganado 1 ROBcoin. El juego continuará en breve.</p>
                    <div style={{ fontSize: '4rem', fontWeight: 'bold', margin: '20px 0', color: '#e60000' }}>
                        {adTimer}
                    </div>
                    <p style={{ color: '#aaa' }}>Vídeo promocional simulado...</p>
                </div>
            )}

            {/* Initial Start Overlay */}
            {gameState === 'initial' && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', color: 'white', zIndex: 30,
                    padding: '10px', textAlign: 'center'
                }}>
                    <h2 style={{ fontSize: '1.5rem', color: '#e60000', marginBottom: '20px', textShadow: '0 0 10px red' }}>DOOM</h2>

                    <button
                        onClick={startGame}
                        style={{
                            padding: '12px 30px', fontSize: '1.2rem', cursor: 'pointer',
                            background: '#e60000', color: 'white', border: '2px solid white',
                            borderRadius: '5px', fontWeight: 'bold', textTransform: 'uppercase',
                            boxShadow: '0 0 15px #e60000',
                            animation: 'pulse 1.5s infinite'
                        }}
                    >
                        JUGAR AHORA
                    </button>

                    <p style={{ marginTop: '20px', fontSize: '0.8rem', opacity: 0.7 }}>
                        Toca para iniciar
                    </p>
                    <style>{`
                        @keyframes pulse {
                            0% { transform: scale(1); }
                            50% { transform: scale(1.05); }
                            100% { transform: scale(1); }
                        }
                    `}</style>
                </div>
            )}

            {/* End Session Ad / Summary Overlay */}
            {gameState === 'ad' && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'black', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', color: 'white', zIndex: 30
                }}>
                    {adTimer > 0 ? (
                        <>
                            <div style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#ffd700' }}>GUARDANDO PROGRESO...</div>
                            <div style={{ width: '50%', height: '4px', background: '#333' }}>
                                <div style={{ width: `${((5 - adTimer) / 5) * 100}%`, height: '100%', background: '#e60000' }}></div>
                            </div>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '1.2rem', marginBottom: '20px' }}>{message}</p>
                            <button
                                onClick={() => setGameState('initial')}
                                style={{
                                    padding: '10px 30px', background: '#e60000', color: 'white',
                                    border: 'none', borderRadius: '5px', fontSize: '1.2rem', cursor: 'pointer'
                                }}
                            >
                                VOLVER AL MENÚ
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div style={{
                width: '100%',
                height: '100%',
                flexShrink: 0
            }}>
                <iframe
                    ref={iframeRef}
                    onLoad={handleIframeLoad}
                    scrolling="no"
                    src="/doom/doom.html"
                    style={{ width: '100%', height: '100%', border: 'none', display: 'block', overflow: 'hidden' }}
                    title="DOOM"
                />
            </div>

            {/* Touch Controls for Mobile */}
            <TouchControls
                onDirectionChange={(direction) => {
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
                    if (gameState === 'initial') {
                        startGame();
                    } else {
                        // Enviar Control (Disparo) y Enter (Menús)
                        simulateKey('Control', true);
                        simulateKey('Enter', true);
                        setTimeout(() => {
                            simulateKey('Control', false);
                            simulateKey('Enter', false);
                        }, 150);
                    }
                }}
                onAction={() => {
                    if (gameState === 'initial') {
                        startGame();
                    } else {
                        simulateKey(' ', true);
                        setTimeout(() => simulateKey(' ', false), 150);
                    }
                }}
                showActionButton={true}
            />
        </div>
    );

    function simulateKey(key: string, isPressed: boolean) {
        if (!iframeRef.current?.contentWindow) return;

        // Registrar actividad explícita
        if (isPressed) {
            checkActivity();
        }

        // CRÍTICO: Asegurar que el iframe tiene el foco para recibir input
        // Especialmente importante en móvil al tocar botones externos
        if (isPressed) {
            iframeRef.current.focus();
            iframeRef.current.contentWindow.focus();
        }

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

            // Crear evento con keyCode explícito
            const eventInit = {
                key: key,
                code: code,
                keyCode: keyCode,
                which: keyCode,
                bubbles: true,
                cancelable: true,
                ctrlKey: false, // Importante: false para que no sea un atajo
                shiftKey: false,
                altKey: false,
                metaKey: false,
                view: iframeRef.current.contentWindow
            };

            const event = new KeyboardEvent(eventType, eventInit);

            // Hack para asegurar keyCode en navegadores antiguos/móviles
            Object.defineProperty(event, 'keyCode', { value: keyCode });
            Object.defineProperty(event, 'which', { value: keyCode });

            const win = iframeRef.current.contentWindow;
            win.document.dispatchEvent(event);
            win.dispatchEvent(event);
            if (win.document.body) win.document.body.dispatchEvent(event);
            if (win.document.documentElement) win.document.documentElement.dispatchEvent(event);

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
            'Control': 17
        };
        return codes[key] || 0;
    }
}
