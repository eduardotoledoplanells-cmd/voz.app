'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { Home, Compass, Upload, User, LogOut, Shield, ChevronDown } from 'lucide-react';

export default function Header() {
    const { user, logout } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);

    return (
        <header style={{
            backgroundColor: '#000',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            height: '70px',
            display: 'flex',
            alignItems: 'center'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '1200px',
                margin: '0 auto',
                padding: '0 20px',
                height: '100%'
            }}>
                {/* Logo */}
                <Link href="/feed" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo/logo-white.png" alt="VOZ" style={{ height: '48px', objectFit: 'contain' }} />
                </Link>

                {/* Navigation Links */}
                <nav style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
                    <Link href="/feed" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: 'white',
                        textDecoration: 'none',
                        fontSize: '0.95rem',
                        fontWeight: 'bold',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <Home size={18} color="#8E2DE2" />
                        <span>Inicio</span>
                    </Link>
                    <Link href="/discover" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: 'white',
                        textDecoration: 'none',
                        fontSize: '0.95rem',
                        fontWeight: 'bold',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <Compass size={18} color="#8E2DE2" />
                        <span>Descubrir</span>
                    </Link>
                    <Link href="/upload" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: 'white',
                        textDecoration: 'none',
                        fontSize: '0.95rem',
                        fontWeight: 'bold',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <Upload size={18} color="#8E2DE2" />
                        <span>Subir Vídeo</span>
                    </Link>
                </nav>

                {/* User Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {user ? (
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '0.9rem',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'; }}
                            >
                                <User size={16} color="#8E2DE2" />
                                <span>{user.name ? user.name.split(' ')[0] : 'Perfil'}</span>
                                <ChevronDown size={14} color="#888" />
                            </button>
                            
                            {showUserMenu && (
                                <div style={{
                                    position: 'absolute',
                                    top: '120%',
                                    right: 0,
                                    width: '180px',
                                    backgroundColor: '#111',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    zIndex: 1000
                                }}>
                                    <Link 
                                        href="/profile" 
                                        onClick={() => setShowUserMenu(false)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            padding: '12px 16px',
                                            color: '#ccc',
                                            textDecoration: 'none',
                                            fontSize: '0.9rem',
                                            transition: 'all 0.2s',
                                            textAlign: 'left'
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'white'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#ccc'; }}
                                    >
                                        <User size={16} />
                                        <span>Mi Perfil</span>
                                    </Link>
                                    
                                    {user.role === 'admin' && (
                                        <Link 
                                            href="/admin" 
                                            onClick={() => setShowUserMenu(false)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                padding: '12px 16px',
                                                color: '#ccc',
                                                textDecoration: 'none',
                                                fontSize: '0.9rem',
                                                transition: 'all 0.2s',
                                                textAlign: 'left'
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'white'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#ccc'; }}
                                        >
                                            <Shield size={16} />
                                            <span>Panel Admin</span>
                                        </Link>
                                    )}
                                    
                                    <button 
                                        onClick={() => { logout(); setShowUserMenu(false); }} 
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            padding: '12px 16px',
                                            color: '#FF3B30',
                                            background: 'none',
                                            border: 'none',
                                            width: '100%',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            transition: 'all 0.2s',
                                            textAlign: 'left'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 59, 48, 0.1)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <LogOut size={16} />
                                        <span>Cerrar Sesión</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <Link href="/login" style={{ textDecoration: 'none' }}>
                                <button style={{
                                    backgroundColor: 'transparent',
                                    border: '1px solid #8E2DE2',
                                    color: '#8E2DE2',
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(142, 45, 226, 0.1)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                >
                                    Iniciar Sesión
                                </button>
                            </Link>
                            <Link href="/register" style={{ textDecoration: 'none' }}>
                                <button style={{
                                    backgroundColor: '#8E2DE2',
                                    border: 'none',
                                    color: 'white',
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    boxShadow: '0 4px 12px rgba(142, 45, 226, 0.3)',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#9b41ec'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#8E2DE2'; }}
                                >
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
