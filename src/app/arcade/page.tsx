'use client';

import Link from 'next/link';

export default function ArcadeMenuPage() {
    return (
        <div className="container" style={{ padding: '40px 0', minHeight: '80vh', fontFamily: '"Courier New", Courier, monospace' }}>

            <style jsx global>{`
                @keyframes neonGlow {
                    0% { text-shadow: 0 0 10px #ff00de, 0 0 20px #ff00de, 0 0 30px #ff00de; }
                    50% { text-shadow: 0 0 20px #ff00de, 0 0 30px #ff00de, 0 0 40px #ff00de; }
                    100% { text-shadow: 0 0 10px #ff00de, 0 0 20px #ff00de, 0 0 30px #ff00de; }
                }
                .arcade-title {
                    font-size: 4rem;
                    text-align: center;
                    color: #fff;
                    margin-bottom: 50px;
                    animation: neonGlow 1.5s infinite alternate;
                    letter-spacing: 5px;
                    text-transform: uppercase;
                }
                .game-card {
                    transition: transform 0.3s, box-shadow 0.3s;
                    border: 4px solid #333;
                    background: #111;
                }
                .game-card:hover {
                    transform: scale(1.05);
                    border-color: #00ff00;
                    box-shadow: 0 0 20px #00ff00;
                    cursor: pointer;
                }
            `}</style>

            <h1 className="arcade-title">ZONA ARCADE</h1>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '40px',
                padding: '0 20px'
            }}>
                {/* Retro Runner Card */}
                <Link href="/arcade/retro-runner" style={{ textDecoration: 'none' }}>
                    <div className="game-card" style={{ borderRadius: '15px', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ height: '250px', overflow: 'hidden', borderBottom: '2px solid #333' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/images/retro_runner_thumb.png"
                                alt="Retro Runner"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                        <div style={{ padding: '20px', color: '#00ff00', textAlign: 'center' }}>
                            <h2 style={{ fontSize: '1.8rem', marginBottom: '10px', textTransform: 'uppercase' }}>Retro Runner</h2>
                            <p style={{ fontSize: '0.9rem', color: '#aaa' }}>¡Salta, esquiva y gana ROBcoins!</p>
                            <div style={{ marginTop: '15px', display: 'inline-block', padding: '5px 15px', border: '1px solid #00ff00', borderRadius: '5px' }}>
                                INSERT COIN
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Wolfenstein 3D Card */}
                <Link href="/arcade/wolf3d" style={{ textDecoration: 'none' }}>
                    <div className="game-card" style={{ borderRadius: '15px', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ height: '250px', overflow: 'hidden', borderBottom: '2px solid #333' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/images/wolf3d_thumb.jpg"
                                alt="Wolfenstein 3D"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                        <div style={{ padding: '20px', color: '#ffff00', textAlign: 'center' }}>
                            <h2 style={{ fontSize: '1.8rem', marginBottom: '10px', textTransform: 'uppercase' }}>Wolfenstein 3D</h2>
                            <p style={{ fontSize: '0.9rem', color: '#aaa' }}>El clásico shooter en primera persona.</p>
                            <div style={{ marginTop: '15px', display: 'inline-block', padding: '5px 15px', border: '1px solid #ffff00', borderRadius: '5px', color: '#ffff00' }}>
                                INSERT COIN
                            </div>
                        </div>
                    </div>
                </Link>

                {/* DOOM Card */}
                <Link href="/arcade/doom" style={{ textDecoration: 'none' }}>
                    <div className="game-card" style={{ borderRadius: '15px', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ height: '250px', overflow: 'hidden', borderBottom: '2px solid #333' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/doom/doom-cover.png"
                                alt="DOOM"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                        <div style={{ padding: '20px', color: '#ff0000', textAlign: 'center' }}>
                            <h2 style={{ fontSize: '1.8rem', marginBottom: '10px', textTransform: 'uppercase' }}>DOOM</h2>
                            <p style={{ fontSize: '0.9rem', color: '#aaa' }}>El rey de los shooters (Versión HTML).</p>
                            <div style={{ marginTop: '15px', display: 'inline-block', padding: '5px 15px', border: '1px solid #ff0000', borderRadius: '5px', color: '#ff0000' }}>
                                INSERT COIN
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Space Invaders Card */}
                <Link href="/arcade/space-invaders" style={{ textDecoration: 'none' }}>
                    <div className="game-card" style={{ borderRadius: '15px', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ height: '250px', overflow: 'hidden', borderBottom: '2px solid #333' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/images/space_invaders_thumb.png"
                                alt="Space Invaders"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                        <div style={{ padding: '20px', color: '#00ff00', textAlign: 'center' }}>
                            <h2 style={{ fontSize: '1.8rem', marginBottom: '10px', textTransform: 'uppercase' }}>Space Invaders</h2>
                            <p style={{ fontSize: '0.9rem', color: '#aaa' }}>Defiende la Tierra de los invasores.</p>
                            <div style={{ marginTop: '15px', display: 'inline-block', padding: '5px 15px', border: '1px solid #00ff00', borderRadius: '5px', color: '#00ff00' }}>
                                INSERT COIN
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Pac-Man Card */}
                <Link href="/arcade/pacman" style={{ textDecoration: 'none' }}>
                    <div className="game-card" style={{ borderRadius: '15px', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ height: '250px', overflow: 'hidden', borderBottom: '2px solid #333' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/space-invaders/html5-space-invaders-master/miniaturapacman.jpg"
                                alt="PAC-MAN"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                        <div style={{ padding: '20px', color: '#ffd700', textAlign: 'center' }}>
                            <h2 style={{ fontSize: '1.8rem', marginBottom: '10px', textTransform: 'uppercase' }}>PAC-MAN</h2>
                            <p style={{ fontSize: '0.9rem', color: '#aaa' }}>El clásico come-cocos.</p>
                            <div style={{ marginTop: '15px', display: 'inline-block', padding: '5px 15px', border: '1px solid #ffd700', borderRadius: '5px', color: '#ffd700' }}>
                                INSERT COIN
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Mario Card */}
                <Link href="/arcade/mario" style={{ textDecoration: 'none' }}>
                    <div className="game-card" style={{ borderRadius: '15px', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ height: '250px', overflow: 'hidden', borderBottom: '2px solid #333', background: '#5c94fc' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/space-invaders/html5-space-invaders-master/minimario.webp"
                                alt="Super Mario"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                        <div style={{ padding: '20px', color: '#ff0000', textAlign: 'center' }}>
                            <h2 style={{ fontSize: '1.8rem', marginBottom: '10px', textTransform: 'uppercase' }}>Super Mario</h2>
                            <p style={{ fontSize: '0.9rem', color: '#aaa' }}>¡Salva a la princesa!</p>
                            <div style={{ marginTop: '15px', display: 'inline-block', padding: '5px 15px', border: '1px solid #ff0000', borderRadius: '5px', color: '#ff0000' }}>
                                INSERT COIN
                            </div>
                        </div>
                    </div>
                </Link>

            </div>
        </div>
    );
}
