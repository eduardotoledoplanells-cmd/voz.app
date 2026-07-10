'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { Home, Compass, Upload, User, LogOut, Shield, ChevronDown, Bell } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Header() {
    const { user, logout } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const pathname = usePathname();

    // Landing page has its own header embedded
    if (pathname === '/') return null;

    return (
        /* desktop-header class hides this on mobile via globals.css */
        <header className="desktop-header" style={{
            backgroundColor: 'rgba(0, 0, 0, 0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            height: '70px',
            alignItems: 'center',
            width: '100%'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '1200px',
                margin: '0 auto',
                padding: '0 24px',
                height: '100%'
            }}>
                {/* Logo */}
                <Link href="/feed" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo/logo-white.png" alt="VOZ" style={{ height: '44px', objectFit: 'contain' }} />
                </Link>

                {/* Navigation Links */}
                <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {[
                        { href: '/feed', icon: <Home size={17} />, label: 'Inicio' },
                        { href: '/discover', icon: <Compass size={17} />, label: 'Descubrir' },
                        { href: '/upload', icon: <Upload size={17} />, label: 'Subir' },
                    ].map(({ href, icon, label }) => {
                        const isActive = pathname === href || pathname.startsWith(href + '/');
                        return (
                            <Link key={href} href={href} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '7px',
                                color: isActive ? 'white' : '#888',
                                textDecoration: 'none',
                                fontSize: '0.9rem',
                                fontWeight: isActive ? '700' : '500',
                                padding: '8px 14px',
                                borderRadius: '10px',
                                backgroundColor: isActive ? 'rgba(142,45,226,0.15)' : 'transparent',
                                borderBottom: isActive ? '2px solid #8E2DE2' : '2px solid transparent',
                                transition: 'all 0.2s'
                            }}>
                                <span style={{ color: isActive ? '#8E2DE2' : '#666' }}>{icon}</span>
                                <span>{label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {user ? (
                        <>
                            {/* Notifications */}
                            <button style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                color: '#888',
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#888'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                            >
                                <Bell size={18} />
                            </button>

                            {/* User menu */}
                            <div style={{ position: 'relative' }}>
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    style={{
                                        backgroundColor: 'rgba(142, 45, 226, 0.12)',
                                        border: '1px solid rgba(142, 45, 226, 0.3)',
                                        color: 'white',
                                        padding: '8px 14px',
                                        borderRadius: '20px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '0.88rem',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{
                                        width: '26px', height: '26px', borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #8E2DE2, #4A00E0)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '12px', fontWeight: 'bold', color: 'white'
                                    }}>
                                        {(user.name || user.handle || '?')[0].toUpperCase()}
                                    </div>
                                    <span>{user.name ? user.name.split(' ')[0] : (user.handle || 'Perfil')}</span>
                                    <ChevronDown size={14} color="#888" />
                                </button>

                                {showUserMenu && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 'calc(100% + 8px)',
                                        right: 0,
                                        width: '190px',
                                        backgroundColor: '#111',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '14px',
                                        boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                                        overflow: 'hidden',
                                        zIndex: 1000
                                    }}>
                                        <Link href="/profile" onClick={() => setShowUserMenu(false)} style={{
                                            display: 'flex', alignItems: 'center', gap: '10px',
                                            padding: '13px 16px', color: '#ccc', textDecoration: 'none',
                                            fontSize: '0.88rem', transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'white'; }}
                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#ccc'; }}
                                        >
                                            <User size={15} /> Mi Perfil
                                        </Link>

                                        {user.role === 'admin' && (
                                            <Link href="/admin" onClick={() => setShowUserMenu(false)} style={{
                                                display: 'flex', alignItems: 'center', gap: '10px',
                                                padding: '13px 16px', color: '#ccc', textDecoration: 'none',
                                                fontSize: '0.88rem', transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'white'; }}
                                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#ccc'; }}
                                            >
                                                <Shield size={15} /> Panel Admin
                                            </Link>
                                        )}

                                        <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

                                        <button onClick={() => { logout(); setShowUserMenu(false); }} style={{
                                            display: 'flex', alignItems: 'center', gap: '10px',
                                            padding: '13px 16px', color: '#FF3B30', background: 'none',
                                            border: 'none', width: '100%', cursor: 'pointer', fontSize: '0.88rem',
                                            transition: 'all 0.2s', textAlign: 'left'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 59, 48, 0.1)'}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <LogOut size={15} /> Cerrar Sesión
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <Link href="/login" style={{ textDecoration: 'none' }}>
                                <button style={{
                                    backgroundColor: 'transparent', border: '1.5px solid #8E2DE2',
                                    color: '#8E2DE2', padding: '9px 18px', borderRadius: '20px',
                                    fontWeight: '600', cursor: 'pointer', fontSize: '0.88rem', transition: 'all 0.2s'
                                }}>
                                    Iniciar Sesión
                                </button>
                            </Link>
                            <Link href="/register" style={{ textDecoration: 'none' }}>
                                <button style={{
                                    background: 'linear-gradient(135deg, #8E2DE2, #4A00E0)',
                                    border: 'none', color: 'white', padding: '9px 18px', borderRadius: '20px',
                                    fontWeight: '600', cursor: 'pointer', fontSize: '0.88rem',
                                    boxShadow: '0 4px 12px rgba(142,45,226,0.35)', transition: 'all 0.2s'
                                }}>
                                    Registrarse
                                </button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
