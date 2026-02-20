'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/context/AuthContext';
import TouchControls from './TouchControls';

interface TetrisGameProps {
    portalTarget?: HTMLElement | null;
}

export default function TetrisGame({ portalTarget }: TetrisGameProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [scale, setScale] = useState(1);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Robust fallback: use prop, or find by ID if mounted (client-side)
    const activePortalTarget = portalTarget || (mounted ? document.getElementById('tetris-portal-target') : null);

    // Game State
    const [gameState, setGameState] = useState<'initial' | 'playing' | 'ad' | 'interruption_ad'>('initial');
    const [survivalTime, setSurvivalTime] = useState(0);
    const [coinsEarned, setCoinsEarned] = useState(0);
    const [adTimer, setAdTimer] = useState(5);
    const [message, setMessage] = useState('');

    const lastActivityRef = useRef(Date.now());
    const [isAfk, setIsAfk] = useState(false);

    const { user, updateUser } = useAuth();

    // Scale logic
    useEffect(() => {
        const updateScale = () => {
            if (containerRef.current) {
                // Adjust scaling if needed
                setScale(1);
            }
        };
        window.addEventListener('resize', updateScale);
        updateScale();
        return () => window.removeEventListener('resize', updateScale);
    }, []);

    // Activity Helper
    const checkActivity = () => {
        lastActivityRef.current = Date.now();
        setIsAfk(false);
    };

    // Survival Timer (used as score proxy for now)
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (gameState === 'playing') {
            interval = setInterval(() => {
                const now = Date.now();
                if (now - lastActivityRef.current > 30000) { // 30s timeout
                    setIsAfk(true);
                    return;
                }
                setIsAfk(false);
                setSurvivalTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [gameState]);

    // End Game / Save Points logic
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
        } catch (e) { console.error(e); }
    };

    const finishSession = () => {
        setGameState('ad');
        setAdTimer(5);
        // Anti-Fraud: Max allowed per session
        const MAX_ROBCOINS_PER_SESSION = 50;

        // Calculate coins based on time (100 seconds = 5 ROBcoins approx)
        const gatheredCoins = survivalTime;
        let robCoins = Math.floor((gatheredCoins / 100) * 5);

        // Cap the earnings
        if (robCoins > MAX_ROBCOINS_PER_SESSION) {
            robCoins = MAX_ROBCOINS_PER_SESSION;
        }

        setCoinsEarned(robCoins);
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (gameState === 'ad') {
            interval = setInterval(() => {
                setAdTimer(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        if (coinsEarned > 0) savePoints(coinsEarned);
                        setMessage(`¡Has ganado ${coinsEarned} ROBcoins!`);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [gameState, coinsEarned]);


    // Iframe Injection
    const handleIframeLoad = () => {
        if (!iframeRef.current?.contentWindow) return;
        const win = iframeRef.current.contentWindow as any;
        const doc = win.document;

        win.focus();

        // Inject Styles to make it fit
        const style = doc.createElement('style');
        style.textContent = `
            body, html { width: 100%; height: 100%; margin: 0; padding: 0; overflow: hidden !important; background-color: black !important; }
            canvas { width: 100% !important; height: 100% !important; object-fit: contain; display: block !important; margin: 0 auto !important; }
            
            /* Hide default controls */
            input, button, label { display: none !important; }

            /* Fix for mobile - force scale down to fit viewport */
            @media (max-width: 800px) {
                canvas {
                    width: 100% !important;
                    height: 100% !important;
                    /* For Tetris, just ensuring it fits contain is usually enough, 
                       but if the internal canvas is huge, we might need transform.
                       Classic Tetris JS makes canvas 520x600. 
                       If container is 170px wide, object-fit: contain SHOULD handle it.
                       But let's be safe and allow standard fit first. 
                       Actually, the Mario fix was resizing the CONTAINER to be larger so the game renders larger, then shrinking.
                       For Tetris with a fixed canvas size, 'object-fit: contain' on the canvas is the best bet.
                       The previous Mario issue might have been the DIV wrapper.
                       Let's stick to simple object-fit for Tetris unless it proves broken.
                       BUT, I will ensure body/html range is correct.
                    */
                }
            }

            /* Hide scrollbar */
            ::-webkit-scrollbar { display: none; }
            body { -ms-overflow-style: none; scrollbar-width: none; }
        `;
        doc.head.appendChild(style);
    };

    const startGame = () => {
        setGameState('playing');
        setSurvivalTime(0);
        setCoinsEarned(0);
        setMessage('');

        // Focus iframe and click start
        setTimeout(() => {
            if (iframeRef.current?.contentWindow) {
                const doc = iframeRef.current.contentWindow.document;
                const btn = doc.getElementById('start-stop-btn');
                if (btn) btn.click();

                iframeRef.current.contentWindow.focus();
            }
        }, 100);
    };

    // Keyboard Simulation
    function simulateKey(key: string, isPressed: boolean) {
        if (!iframeRef.current?.contentWindow) return;
        checkActivity();

        const win = iframeRef.current.contentWindow;
        // Mapping for Tetris
        const keyCodeMap: Record<string, number> = {
            'ArrowUp': 38, 'ArrowDown': 40, 'ArrowLeft': 37, 'ArrowRight': 39,
            'Space': 32, ' ': 32, 'Shift': 16
        };
        const keyCode = keyCodeMap[key] || 0;

        const eventInit = {
            key: key,
            code: key,
            keyCode: keyCode,
            which: keyCode,
            bubbles: true,
            cancelable: true,
            view: win
        };

        const type = isPressed ? 'keydown' : 'keyup';
        const event = new KeyboardEvent(type, eventInit);
        Object.defineProperty(event, 'keyCode', { value: keyCode });
        Object.defineProperty(event, 'which', { value: keyCode });

        win.document.dispatchEvent(event);
        if (win.document.body) win.document.body.dispatchEvent(event);
    }

    const handleJoystick = (dir: { x: number, y: number }) => {
        const threshold = 0.3;

        if (dir.x > threshold) simulateKey('ArrowRight', true);
        else simulateKey('ArrowRight', false);

        if (dir.x < -threshold) simulateKey('ArrowLeft', true);
        else simulateKey('ArrowLeft', false);

        // Down -> Soft Drop
        if (dir.y < -threshold) simulateKey('ArrowDown', true);
        else simulateKey('ArrowDown', false);

        // Up -> Rotate
        if (dir.y > threshold) simulateKey('ArrowUp', true);
        else simulateKey('ArrowUp', false);
    };

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', background: 'black', overflow: 'hidden', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>

            {/* Overlay UI */}
            {(gameState === 'playing') && (
                <>
                    <div style={{ position: 'absolute', top: 5, left: 5, zIndex: 20, color: 'white', fontFamily: 'monospace' }}>
                        ⏱️ {Math.floor(survivalTime / 60)}m {survivalTime % 60}s
                    </div>
                    {activePortalTarget && createPortal(
                        <button onClick={finishSession}
                            style={{
                                position: 'absolute',
                                top: '15%',
                                left: '40%',
                                zIndex: 9999,
                                background: 'purple',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                padding: '8px 16px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                                cursor: 'pointer',
                                pointerEvents: 'auto'
                            }}>
                            Salir & Cobrar
                        </button>,
                        activePortalTarget
                    )}
                </>
            )}

            {/* Start Screen */}
            {gameState === 'initial' && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 30 }}>
                    <h2 style={{ color: '#9c27b0', fontSize: '2rem', marginBottom: 20, textShadow: '2px 2px 0 #fff' }}>TETRIS CLASSIC</h2>
                    <button onClick={startGame} style={{ padding: '10px 20px', fontSize: '1.2rem', background: '#9c27b0', color: 'white', border: 'none', borderRadius: 5 }}>START</button>
                </div>
            )}

            {/* End/Ad Screen */}
            {gameState === 'ad' && (
                <div style={{ position: 'absolute', inset: 0, background: 'black', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 40, color: 'white' }}>
                    <h3>GUARDANDO PUNTOS...</h3>
                    <div style={{ fontSize: '2rem', color: 'yellow' }}>{adTimer}</div>
                    <p>{message}</p>
                    {adTimer <= 0 && <button onClick={() => setGameState('initial')} style={{ marginTop: 10, padding: 10 }}>VOLVER</button>}
                </div>
            )}

            <iframe
                ref={iframeRef}
                onLoad={handleIframeLoad}
                src="/games/tetris/classic-tetris-js-master/index.html"
                style={{ width: '100%', height: '100%', border: 'none', overflow: 'hidden' }}
                scrolling="no"
                title="Tetris"
            />

            <TouchControls
                onDirectionChange={handleJoystick}
                onShoot={() => {
                    // Hard Drop (Space) - Button B
                    simulateKey(' ', true);
                    setTimeout(() => simulateKey(' ', false), 100);
                }}
                onAction={() => {
                    // Rotate (ArrowUp) - Button A
                    simulateKey('ArrowUp', true);
                    setTimeout(() => simulateKey('ArrowUp', false), 100);
                }}
                variant="nes"
                shootButtonText="🔻"
                actionButtonText="↻"
                bottomOffset="20px"
            />
        </div>
    );
}
