"use client";
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Plus, Bell, User, MessageSquare } from 'lucide-react';
import ActivityModal from './ActivityModal';

export default function BottomNav() {
    const pathname = usePathname();
    const [showActivity, setShowActivity] = useState(false);

    // Don't show on landing page
    if (pathname === '/') return null;

    const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

    const navItemStyle = (active: boolean): React.CSSProperties => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        color: active ? '#ffffff' : '#555',
        textDecoration: 'none',
        minWidth: '50px',
        padding: '4px 8px',
        position: 'relative',
        transition: 'color 0.2s',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
    });

    const labelStyle = (active: boolean): React.CSSProperties => ({
        fontSize: '10px',
        fontWeight: active ? '700' : '500',
        letterSpacing: '0.2px',
        color: active ? '#ffffff' : '#555',
        marginTop: '1px',
    });

    const activeDot: React.CSSProperties = {
        position: 'absolute',
        top: '2px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '4px',
        height: '4px',
        borderRadius: '50%',
        backgroundColor: '#8E2DE2',
    };

    return (
        <>
            <style>{`
                .bottom-nav-wrapper {
                    position: fixed;
                    bottom: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 100%;
                    max-width: 450px;
                    background-color: rgba(0,0,0,0.94);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border-top: 1px solid rgba(255,255,255,0.08);
                    border-left: 1px solid rgba(255,255,255,0.08);
                    border-right: 1px solid rgba(255,255,255,0.08);
                    display: flex;
                    justify-content: space-around;
                    align-items: center;
                    height: 65px;
                    padding-bottom: env(safe-area-inset-bottom, 0px);
                    z-index: 1000;
                    border-radius: 12px 12px 0 0;
                }

            `}</style>
            <div className="bottom-nav-wrapper">
                {/* Home */}
                <Link href="/feed" style={navItemStyle(isActive('/feed'))}>
                    {isActive('/feed') && <span style={activeDot} />}
                    <Home size={22} strokeWidth={isActive('/feed') ? 2.5 : 1.8} />
                    <span style={labelStyle(isActive('/feed'))}>Inicio</span>
                </Link>

                {/* Discover */}
                <Link href="/discover" style={navItemStyle(isActive('/discover'))}>
                    {isActive('/discover') && <span style={activeDot} />}
                    <Search size={22} strokeWidth={isActive('/discover') ? 2.5 : 1.8} />
                    <span style={labelStyle(isActive('/discover'))}>Buscar</span>
                </Link>

                {/* Messages */}
                <Link href="/messages" style={navItemStyle(isActive('/messages'))}>
                    {isActive('/messages') && <span style={activeDot} />}
                    <MessageSquare size={22} strokeWidth={isActive('/messages') ? 2.5 : 1.8} />
                    <span style={labelStyle(isActive('/messages'))}>Mensajes</span>
                </Link>

                {/* Activity / Bell */}
                <button onClick={() => setShowActivity(true)} style={navItemStyle(false) as any}>
                    <Bell size={22} strokeWidth={1.8} />
                    <span style={labelStyle(false)}>Actividad</span>
                </button>

                {/* Profile */}
                <Link href="/profile" style={navItemStyle(isActive('/profile'))}>
                    {isActive('/profile') && <span style={activeDot} />}
                    <User size={22} strokeWidth={isActive('/profile') ? 2.5 : 1.8} />
                    <span style={labelStyle(isActive('/profile'))}>Perfil</span>
                </Link>
            </div>

            <ActivityModal isOpen={showActivity} onClose={() => setShowActivity(false)} />
        </>
    );
}