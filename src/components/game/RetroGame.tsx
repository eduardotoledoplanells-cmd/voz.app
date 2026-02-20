'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import TouchControls from './TouchControls';

export default function RetroGame({ isEmbedded = false }: { isEmbedded?: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover' | 'ad'>('start');
    // Ref to track game state synchronously for the loop
    const gameStateRef = useRef<'start' | 'playing' | 'gameover' | 'ad'>('start');

    const [score, setScore] = useState(0);
    const [coins, setCoins] = useState(0);
    const [level, setLevel] = useState(1);
    const { user, updateUser } = useAuth();
    const [message, setMessage] = useState('');
    const [adTimer, setAdTimer] = useState(5);

    // Game Constants
    const GRAVITY = 0.6;
    const JUMP_FORCE = -12.1;
    const BASE_SPEED = 4;

    // Game State Refs
    const playerRef = useRef({ x: 50, y: 200, width: 35, height: 35, dy: 0, grounded: false });
    const obstaclesRef = useRef<{ x: number; y: number; width: number; height: number; type: 'cactus' | 'bird' }[]>([]);
    const coinsRef = useRef<{ x: number; y: number; width: number; height: number; collected: boolean }[]>([]);

    // Seagull & Droppings
    const seagullRef = useRef<{ x: number; y: number; width: number; height: number; active: boolean; nextDroppingTime: number }>({
        x: -100, y: 50, width: 60, height: 40, active: false, nextDroppingTime: 0
    });
    const droppingsRef = useRef<{ x: number; y: number; width: number; height: number; }[]>([]);

    const frameRef = useRef(0);
    const scoreRef = useRef(0);
    const animationIdRef = useRef<number>(0);
    const speedRef = useRef(BASE_SPEED);
    const levelRef = useRef(1);

    // Audio Ref
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const startWithAd = () => {
        // Play audio immediately on user click to unlock autoplay policies
        if (audioRef.current) {
            audioRef.current.volume = 0; // Start silent
            audioRef.current.play().catch(e => console.log('Audio start error:', e));
        }

        setGameState('ad');
        gameStateRef.current = 'ad';
        setAdTimer(5);
        setMessage('Cargando juego...');
    };

    const resumeGameAfterAd = () => {
        setGameState('playing');
        gameStateRef.current = 'playing';
        gameLoop();
    };

    const startGame = () => {
        setGameState('playing');
        gameStateRef.current = 'playing';

        // Check if audio needs to volume up (it should be playing from startWithAd)
        if (audioRef.current) {
            if (audioRef.current.paused) {
                audioRef.current.play().catch(e => console.log('Audio resume error:', e));
            }
            audioRef.current.volume = 0.5;
        }

        setScore(0);
        setCoins(0);
        setLevel(1);
        playerRef.current = { x: 50, y: 200, width: 35, height: 35, dy: 0, grounded: false };
        obstaclesRef.current = [];
        coinsRef.current = [];
        droppingsRef.current = [];
        seagullRef.current = { x: -100, y: 50, width: 60, height: 40, active: false, nextDroppingTime: 0 };
        scoreRef.current = 0;
        frameRef.current = 0;
        speedRef.current = BASE_SPEED;
        levelRef.current = 1;
        setMessage('');
        gameLoop();
    };

    const playerImageRef = useRef<HTMLImageElement | null>(null);
    const bgImageRef = useRef<HTMLImageElement | null>(null);
    const obstacleImageRef = useRef<HTMLImageElement | null>(null);
    const seagullImageRef = useRef<HTMLImageElement | null>(null);
    const bgXRef = useRef(0);

    useEffect(() => {
        const img = new Image();
        img.src = '/tomato.svg';
        playerImageRef.current = img;

        const bgImg = new Image();
        bgImg.src = '/game_background.jpg';
        bgImageRef.current = bgImg;

        const obsImg = new Image();
        obsImg.src = '/rock_obstacle.png';
        obstacleImageRef.current = obsImg;

        const seagullImg = new Image();
        seagullImg.src = '/img/gaviota.png';
        seagullImageRef.current = seagullImg;

        // Initialize Audio
        const audio = new Audio('/runner_music.mp3');
        audio.loop = true;
        audio.volume = 0.5;
        audio.preload = 'auto'; // Important for immediate availability
        audio.load();
        audioRef.current = audio;

        return () => {
            audio.pause();
            audioRef.current = null;
        };
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (gameState === 'ad') {
            interval = setInterval(() => {
                setAdTimer((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        // Using logic branch to determine next state
                        if (scoreRef.current === 0) {
                            startGame();
                        } else {
                            resumeGameAfterAd();
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [gameState]);

    // Handle Audio Playback based on State - Volume management mainly
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (gameState === 'playing') {
            audio.volume = 0.5;
            if (audio.paused) audio.play().catch(e => console.log('Audio play error:', e));
        } else if (gameState === 'ad') {
            // Already handled in click, but ensure logic matches
        } else {
            audio.pause();
            if (gameState === 'gameover') {
                audio.currentTime = 0;
            }
        }
    }, [gameState]);

    const handleJump = () => {
        if (gameState === 'playing' && playerRef.current.grounded) {
            playerRef.current.dy = JUMP_FORCE;
            playerRef.current.grounded = false;
        }
    };

    const savePoints = async (pointsEarned: number) => {
        if (!user) return;
        try {
            const res = await fetch('/api/users/points', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, points: pointsEarned })
            });
            if (res.ok) {
                const data = await res.json();
                const updatedUser = { ...user, points: data.totalPoints };
                updateUser(updatedUser);
                setMessage(`¡Has ganado ${pointsEarned} puntos! Total: ${data.totalPoints}`);
            }
        } catch (e) {
            console.error(e);
            setMessage('Error guardando puntos.');
        }
    };

    const gameOver = () => {
        setGameState('gameover');
        gameStateRef.current = 'gameover';
        cancelAnimationFrame(animationIdRef.current);

        const gameScore = scoreRef.current;

        if (gameScore > 0) {
            savePoints(gameScore);
        } else {
            setMessage('No has ganado puntos esta vez.');
        }
        scoreRef.current = 0;
    };

    const gameLoop = () => {
        if (gameStateRef.current === 'ad') return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Background
        if (bgImageRef.current && bgImageRef.current.complete && bgImageRef.current.naturalWidth > 0) {
            bgXRef.current -= speedRef.current * 0.5;
            if (bgXRef.current <= -canvas.width) {
                bgXRef.current = 0;
            }
            ctx.drawImage(bgImageRef.current, bgXRef.current, 0, canvas.width, canvas.height);
            ctx.drawImage(bgImageRef.current, bgXRef.current + canvas.width, 0, canvas.width, canvas.height);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#87ceeb';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        const player = playerRef.current;
        player.dy += GRAVITY;
        player.y += player.dy;

        if (player.y + player.height > canvas.height - 20) {
            player.y = canvas.height - 20 - player.height;
            player.dy = 0;
            player.grounded = true;
        } else {
            player.grounded = false;
        }

        const spawnRate = Math.max(60, Math.floor(120 - (levelRef.current * 10)));
        if (frameRef.current % spawnRate === 0) {
            obstaclesRef.current.push({ x: canvas.width, y: canvas.height - 76, width: 56, height: 56, type: 'cactus' });
        }

        if (frameRef.current % 200 === 0) {
            coinsRef.current.push({ x: canvas.width, y: canvas.height - 100 - Math.random() * 50, width: 20, height: 20, collected: false });
        }

        // --- SEAGULL LOGIC ---
        // Spawn chance every 300 frames (approx 5 seconds)
        if (!seagullRef.current.active && frameRef.current % 300 === 0 && Math.random() > 0.5) {
            seagullRef.current = {
                x: canvas.width,
                y: 50 + Math.random() * 100, // Varying height at top
                width: 60,
                height: 40,
                active: true,
                nextDroppingTime: frameRef.current + Math.random() * 60 + 30 // Drop in 30-90 frames
            };
        }

        if (seagullRef.current.active) {
            // Move seagull
            seagullRef.current.x -= (speedRef.current * 1.5); // Faster than obstacles

            // Draw Seagull
            if (seagullImageRef.current && seagullImageRef.current.complete && seagullImageRef.current.naturalWidth > 0) {
                ctx.drawImage(seagullImageRef.current, seagullRef.current.x, seagullRef.current.y, seagullRef.current.width, seagullRef.current.height);
            } else {
                ctx.fillStyle = 'white';
                ctx.fillRect(seagullRef.current.x, seagullRef.current.y, seagullRef.current.width, seagullRef.current.height);
            }

            // Drop projectile?
            if (frameRef.current >= seagullRef.current.nextDroppingTime) {
                droppingsRef.current.push({
                    x: seagullRef.current.x + seagullRef.current.width / 2,
                    y: seagullRef.current.y + seagullRef.current.height,
                    width: 10,
                    height: 10
                });
                // Schedule next drop or stop dropping
                seagullRef.current.nextDroppingTime = frameRef.current + 1000; // Drop only once per pass for gameplay balance usually
            }

            // Use width + some buffer to despawn
            if (seagullRef.current.x < -100) {
                seagullRef.current.active = false;
            }
        }

        // Projectiles (Droppings) Logic
        droppingsRef.current.forEach((drop, index) => {
            drop.y += 3; // Fall speed

            // Draw dropping (poop)
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(drop.x, drop.y, 5, 0, Math.PI * 2);
            ctx.fill();

            // Collision with player
            if (
                player.x < drop.x + drop.width &&
                player.x + player.width > drop.x &&
                player.y < drop.y + drop.height &&
                player.y + player.height > drop.y
            ) {
                gameOver();
                return;
            }

            // Remove if off screen
            if (drop.y > canvas.height) {
                droppingsRef.current.splice(index, 1);
            }
        });


        // Obstacles Logic
        obstaclesRef.current.forEach((obs, index) => {
            obs.x -= speedRef.current;
            if (obstacleImageRef.current && obstacleImageRef.current.complete && obstacleImageRef.current.naturalWidth > 0) {
                ctx.drawImage(obstacleImageRef.current, obs.x, obs.y, obs.width, obs.height);
            } else {
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
            }

            if (
                player.x < obs.x + obs.width &&
                player.x + player.width > obs.x &&
                player.y < obs.y + obs.height &&
                player.y + player.height > obs.y
            ) {
                gameOver();
                return;
            }

            if (obs.x + obs.width < 0) {
                obstaclesRef.current.splice(index, 1);
            }
        });

        if (gameStateRef.current === 'gameover') return;

        coinsRef.current.forEach((coin, index) => {
            if (coin.collected) return;
            coin.x -= speedRef.current;
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(coin.x + 10, coin.y + 10, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#daa520';
            ctx.stroke();

            if (
                player.x < coin.x + coin.width &&
                player.x + player.width > coin.x &&
                player.y < coin.y + coin.height &&
                player.y + player.height > coin.y
            ) {
                coin.collected = true;
                setCoins(prev => prev + 1);
            }

            if (coin.x + coin.width < 0) {
                coinsRef.current.splice(index, 1);
            }
        });

        if (playerImageRef.current && playerImageRef.current.complete && playerImageRef.current.naturalWidth > 0) {
            ctx.drawImage(playerImageRef.current, player.x, player.y, player.width, player.height);
        } else {
            ctx.fillStyle = '#ff6347';
            ctx.fillRect(player.x, player.y, player.width, player.height);
        }

        ctx.fillStyle = '#654321';
        ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
        ctx.fillStyle = '#228b22';
        ctx.fillRect(0, canvas.height - 25, canvas.width, 5);

        scoreRef.current += 1;
        setScore(Math.floor(scoreRef.current / 10));

        const currentVisibleScore = Math.floor(scoreRef.current / 10);
        const newLevel = Math.floor(currentVisibleScore / 100) + 1;

        if (newLevel > levelRef.current) {
            levelRef.current = newLevel;
            speedRef.current = BASE_SPEED + (newLevel - 1) * 0.5;
            setLevel(newLevel);
            cancelAnimationFrame(animationIdRef.current);
            setGameState('ad');
            gameStateRef.current = 'ad';
            setAdTimer(5);
            return;
        }

        frameRef.current++;
        animationIdRef.current = requestAnimationFrame(gameLoop);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                handleJump();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState]);

    return (
        <div style={{
            textAlign: 'center',
            padding: isEmbedded ? 0 : '20px',
            background: isEmbedded ? 'transparent' : '#f0f0f0',
            borderRadius: isEmbedded ? 0 : '8px',
            width: '100%',
            height: '100%'
        }}>
            {!isEmbedded && (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h2 style={{ margin: 0 }}>Retro Runner</h2>
                        <div style={{ background: '#333', color: '#fff', padding: '5px 10px', borderRadius: '4px' }}>
                            Nivel {level}
                        </div>
                    </div>

                    <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', maxWidth: '600px', margin: '0 auto 10px' }}>
                        <span>Puntos: {score}</span>
                        <span>ROBcoins: {coins}</span>
                    </div>
                </>
            )}

            <div style={{ position: 'relative', width: '100%', height: '100%', margin: '0 auto' }}>
                <canvas
                    ref={canvasRef}
                    width={600}
                    height={450}
                    style={{ background: '#87ceeb', border: 'none', borderRadius: '4px', width: '100%', height: '100%', objectFit: 'fill' }}
                    onClick={handleJump}
                />

                {gameState === 'start' && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', color: 'white',
                        padding: '10px'
                    }}>
                        <h3 style={{ textAlign: 'center', fontSize: '1.2rem' }}>Presiona Espacio o toca para saltar</h3>
                        <button
                            onClick={startWithAd}
                            style={{ padding: '8px 20px', fontSize: '1rem', marginTop: '10px', cursor: 'pointer', background: '#e60000', color: 'white', border: 'none' }}
                        >
                            JUGAR
                        </button>
                    </div>
                )}

                {gameState === 'ad' && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'black', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', color: 'white', zIndex: 10,
                        padding: '10px'
                    }}>
                        <div style={{ fontSize: '1.2rem', marginBottom: '15px', color: '#ffd700' }}>PUBLICIDAD (ROBcoin)</div>
                        <div style={{ width: '80%', height: '4px', background: '#333', marginBottom: '15px' }}>
                            <div style={{ width: `${((5 - adTimer) / 5) * 100}%`, height: '100%', background: '#e60000', transition: 'width 1s linear' }}></div>
                        </div>
                        <p style={{ fontSize: '0.9rem' }}>El juego comienza en {adTimer}s...</p>
                        <div style={{ marginTop: '20px', fontSize: '0.7rem', opacity: 0.7 }}>Gracias a nuestros patrocinadores</div>
                    </div>
                )}

                {gameState === 'gameover' && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', color: 'white',
                        padding: '10px'
                    }}>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>¡Game Over!</h3>
                        <p style={{ fontSize: '0.9rem', textAlign: 'center', margin: '0 0 10px 0' }}>{message || 'Guardando puntos...'}</p>
                        <button
                            onClick={startWithAd}
                            style={{ padding: '8px 20px', fontSize: '1rem', marginTop: '5px', cursor: 'pointer', background: '#e60000', color: 'white', border: 'none' }}
                        >
                            JUGAR DE NUEVO
                        </button>
                    </div>
                )}
            </div>

            {/* Touch Controls for Mobile - Solo botón de saltar */}
            <TouchControls
                onDirectionChange={() => {
                    // No se usa en Retro Runner
                }}
                onShoot={handleJump}
                onAction={() => {
                    // No se usa
                }}
                showActionButton={false}
                showJoystick={false}
                shootButtonText="SALTAR"
                shootButtonIcon={<span style={{ fontSize: '2rem' }}>⬆️</span>}
            />

            <p style={{ marginTop: '10px', fontSize: '0.9rem', color: '#666' }}>Recoge monedas para ganar ROBcoins.</p>
        </div>
    );
}
