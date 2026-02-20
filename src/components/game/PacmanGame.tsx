'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import TouchControls from './TouchControls';

export default function PacmanGame() {
    const containerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [scale, setScale] = useState(1);

    // Game State
    const [gameState, setGameState] = useState<'initial' | 'playing' | 'ad' | 'interruption_ad'>('initial');
    const [survivalTime, setSurvivalTime] = useState(0);
    const [coinsEarned, setCoinsEarned] = useState(0);
    const [adTimer, setAdTimer] = useState(5);
    const [message, setMessage] = useState('');

    const timeRef = useRef(0);
    const lastActivityRef = useRef(Date.now());
    const [isAfk, setIsAfk] = useState(false);

    const { user, updateUser } = useAuth();

    // Scale logic
    useEffect(() => {
        const updateScale = () => {
            if (containerRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                // Pacman canvas usually fits well, but we scale to container
                setScale(1);
            }
        };
        window.addEventListener('resize', updateScale);
        updateScale();
        return () => window.removeEventListener('resize', updateScale);
    }, []);

    // Activity Helper
    const checkActivity = () => {
        const now = Date.now();
        if (now - lastActivityRef.current > 12000) {
            setSurvivalTime(0);
            setIsAfk(false);
        } else {
            setIsAfk(false);
        }
        lastActivityRef.current = now;
    };

    // Survival & Ghost Coin Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (gameState === 'playing') {
            interval = setInterval(() => {
                const now = Date.now();
                if (now - lastActivityRef.current > 10000) {
                    setIsAfk(true);
                    return;
                }

                setIsAfk(false);
                setSurvivalTime(prev => prev + 1);

                // Hookear score para detectar fantasmas
                // Lo hacemos aquí para asegurar que 'game' existe y persistir el hook
                if (iframeRef.current?.contentWindow) {
                    const win = iframeRef.current.contentWindow as any;
                    if (win.game && win.game.score && !win.game.score.add.isHooked) {
                        const originalAdd = win.game.score.add;
                        win.game.score.add = function (points: number) {
                            originalAdd.call(this, points);
                            // 100 Puntos = Fantasma comido (GHOST_POINTS)
                            if (points === 100) {
                                setCoinsEarned(c => c + 1);
                            }
                        };
                        win.game.score.add.isHooked = true;
                    }
                }

            }, 1000);
        }
        return () => clearInterval(interval);
    }, [gameState]);

    // Ad Logic (Simplified for Ghost Reward)
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (gameState === 'interruption_ad' || gameState === 'ad') {
            interval = setInterval(() => {
                setAdTimer(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        if (gameState === 'interruption_ad') {
                            setGameState('playing');
                            setTimeout(() => {
                                if (iframeRef.current?.contentWindow) {
                                    iframeRef.current.contentWindow.focus();
                                }
                            }, 100);
                        } else {
                            // End session
                            if (coinsEarned > 0) savePoints(coinsEarned);
                            setMessage(`¡Has ganado ${coinsEarned} ROBcoins!`);
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [gameState, coinsEarned]);

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
    };

    // Inject CSS to clean up UI when iframe loads
    const handleIframeLoad = () => {
        if (!iframeRef.current?.contentWindow) return;
        const win = iframeRef.current.contentWindow as any;
        const doc = win.document;

        // Force focus logic
        win.focus();

        // Inject Styles
        const style = doc.createElement('style');
        style.textContent = `
            body { background-color: black !important; margin: 0; padding: 0; overflow: hidden; }
            .container, .main, .content { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; }
            
            /* Ocultar TODO lo que no sea el canvas o su contenedor directo */
            #adsense, .description, #menu-buttons, #game-buttons, #highscore-content, #info-content, #instructions-content, .controlSound, .score, .level, .lives, #canvas-overlay-container { 
                display: none !important; 
            }
            
            /* Asegurar que el contenedor del canvas ocupe todo */
            #canvas-container {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 100% !important;
                height: 100% !important;
                margin: 0 !important;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            
            canvas {
                /* Mantener aspect ratio pero maximizar */
                width: 100% !important;
                height: 100% !important;
                object-fit: contain;
            }
        `;
        doc.head.appendChild(style);
    };

    const startGame = () => {
        setGameState('playing');
        setSurvivalTime(0);
        setCoinsEarned(0);
        setMessage('');

        // Iniciar juego directamente
        setTimeout(() => {
            const win = iframeRef.current?.contentWindow as any;
            if (win && win.game) {
                win.focus();
                win.confirm = () => true;
                if (win.game.timer) win.game.timer.reset();
                win.game.init(0);
                win.game.forceStartAnimationLoop();

                // Aplicar hook inmediatamente también
                if (win.game.score && !win.game.score.add.isHooked) {
                    const originalAdd = win.game.score.add;
                    win.game.score.add = function (points: number) {
                        originalAdd.call(this, points);
                        if (points === 100) setCoinsEarned(c => c + 1);
                    };
                    win.game.score.add.isHooked = true;
                }
            }
        }, 500);
    };

    // Keyboard Simulation
    function simulateKey(key: string, isPressed: boolean) {
        if (!iframeRef.current?.contentWindow) return;

        if (isPressed) {
            checkActivity();
            iframeRef.current.focus();
            iframeRef.current.contentWindow.focus();
        }

        const win = iframeRef.current.contentWindow;
        // Mapeo directo a códigos de tecla esperados
        const keyCodeMap: Record<string, number> = {
            'ArrowUp': 38, 'ArrowDown': 40, 'ArrowLeft': 37, 'ArrowRight': 39,
            'n': 78, 'N': 78
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

        // Enviar evento 'keydown' (y keyup si aplica)
        const type = isPressed ? 'keydown' : 'keyup';
        const event = new KeyboardEvent(type, eventInit);

        // Hack para propiedades legacy
        Object.defineProperty(event, 'keyCode', { value: keyCode });
        Object.defineProperty(event, 'which', { value: keyCode });

        win.document.dispatchEvent(event);
        if (win.document.body) win.document.body.dispatchEvent(event);
    }

    // Joystick Logic Refined for 4-Way Movement
    const handleJoystick = (dir: { x: number, y: number }) => {
        const threshold = 0.3; // Deadzone

        if (Math.abs(dir.x) > Math.abs(dir.y)) {
            // Horizontal
            if (dir.x > threshold) {
                simulateKey('ArrowRight', true);
            } else if (dir.x < -threshold) {
                simulateKey('ArrowLeft', true);
            }
        } else {
            // Vertical
            if (dir.y > threshold) {
                simulateKey('ArrowDown', true);
            } else if (dir.y < -threshold) {
                simulateKey('ArrowUp', true);
            }
        }
    };

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', background: 'black', overflow: 'hidden', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>

            {/* UI Overlays (Coins, Timer, Buttons) - Copied from Doom but simplified */}
            {(gameState === 'playing' || gameState === 'interruption_ad') && (
                <>
                    <div style={{ position: 'absolute', top: 5, left: 5, zIndex: 20, color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontFamily: 'monospace' }}>
                        ⏱️ {Math.floor(survivalTime / 60)}m {survivalTime % 60}s
                        {isAfk && <span style={{ color: 'red', marginLeft: 5 }}>⚠️ INACTIVO</span>}
                    </div>
                    <div style={{ position: 'absolute', top: 5, right: 5, zIndex: 20, color: '#00ff00', fontSize: '12px', fontFamily: 'monospace' }}>
                        💰 {coinsEarned}
                    </div>

                    {gameState === 'playing' && (
                        <>
                            {/* Reset & Cash Out Buttons */}
                            <button onClick={() => {
                                const win = iframeRef.current?.contentWindow as any;
                                if (win && win.game) {
                                    win.confirm = () => true;
                                    win.game.init(0);
                                    win.game.forceStartAnimationLoop();
                                }
                                setGameState('playing'); // Reinicio DIRECTO
                                setSurvivalTime(0);
                                setCoinsEarned(0);
                            }}
                                style={{ position: 'fixed', top: '90px', left: '135px', zIndex: 9999, background: 'rgba(0,0,0,0.6)', color: 'white', border: '1px solid white', borderRadius: '20px', padding: '6px 12px', backdropFilter: 'blur(4px)', display: 'flex', gap: '5px' }}>
                                <span>🔄 REINICIAR</span>
                            </button>
                            <button onClick={finishSession}
                                style={{ position: 'fixed', top: '130px', left: '135px', zIndex: 9999, background: 'linear-gradient(45deg, #e60000, #ff4d4d)', color: 'white', border: '2px solid white', borderRadius: '20px', padding: '8px 16px', display: 'flex', gap: '5px' }}>
                                <span>💰 COBRAR</span>
                            </button>
                        </>
                    )}
                </>
            )}

            {/* Initial Overlay */}
            {gameState === 'initial' && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 30, color: 'white' }}>
                    <h2 style={{ fontSize: '2rem', color: '#ffd700', marginBottom: 20 }}>PAC-MAN</h2>
                    <button onClick={startGame} style={{ padding: '12px 30px', fontSize: '1.2rem', background: '#ffd700', color: 'black', border: 'none', borderRadius: 5, fontWeight: 'bold' }}>
                        JUGAR AHORA
                    </button>
                </div>
            )}

            {/* Ad Overlay */}
            {(gameState === 'interruption_ad' || gameState === 'ad') && (
                <div style={{ position: 'absolute', inset: 0, background: 'black', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 40, color: 'white' }}>
                    {gameState === 'interruption_ad' ? <h3>PAUSA PUBLICITARIA</h3> : <h3>GUARDANDO...</h3>}
                    <div style={{ fontSize: '3rem', color: '#ffd700', margin: '20px 0' }}>{adTimer}</div>
                    {message && <p>{message}</p>}
                    {gameState === 'ad' && adTimer <= 0 && (
                        <button onClick={() => setGameState('initial')} style={{ padding: '10px', background: 'red', color: 'white', border: 'none', borderRadius: 5 }}>VOLVER AL MENÚ</button>
                    )}
                </div>
            )}

            {/* Game Iframe */}
            <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center' }}>
                <iframe
                    ref={iframeRef}
                    onLoad={handleIframeLoad} // Inyectar CSS al cargar
                    src="/pacman/pacman-canvas-master/index.htm"
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    title="Pacman"
                />
            </div>

            {/* Controls */}
            <TouchControls
                onDirectionChange={handleJoystick}
                onShoot={() => {
                    // Parchear confirm antes de simular 'N' (New Game)
                    const win = iframeRef.current?.contentWindow as any;
                    if (win) win.confirm = () => true;

                    simulateKey('n', true);
                    setTimeout(() => simulateKey('n', false), 100);

                    // Reiniciar contadores para evitar trampas
                    setSurvivalTime(0);
                    setCoinsEarned(0);
                }}
                onAction={() => { }} // No action button needed
                showActionButton={false}
                variant="nes"
                shootButtonText="S"
                shootButtonIcon={<span>▶️</span>}
                bottomOffset="20px"
            />
        </div>
    );
}
