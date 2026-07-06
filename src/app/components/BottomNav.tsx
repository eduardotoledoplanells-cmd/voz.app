"use client";
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ActivityModal from './ActivityModal';

export default function BottomNav() {
    const pathname = usePathname();
    const [showActivity, setShowActivity] = useState(false);
    
    // Si estamos en la landing, no mostramos la barra (opcional)
    if (pathname === '/') return null;

    return (
        <>
            <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                width: '100%',
                height: '65px',
                backgroundColor: '#000',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                paddingBottom: '5px',
                zIndex: 1000
            }}>
                <Link href="/feed" style={{ color: pathname === '/feed' ? '#fff' : 'gray', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '22px', marginBottom: '4px' }}>🏠</span>
                    <span style={{ fontSize: '10px' }}>Inicio</span>
                </Link>
                <Link href="/discover" style={{ color: pathname === '/discover' ? '#fff' : 'gray', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '22px', marginBottom: '4px' }}>🔍</span>
                    <span style={{ fontSize: '10px' }}>Descubrir</span>
                </Link>
                <Link href="/upload" style={{ color: '#fff', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '50px', height: '35px', background: 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontWeight: 'bold', fontSize: '24px', overflow: 'hidden' }}>+</div>
                </Link>
                <button 
                    onClick={() => setShowActivity(true)} 
                    style={{ background: 'none', border: 'none', color: pathname === '/activity' ? '#fff' : 'gray', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
                >
                    <span style={{ fontSize: '22px', marginBottom: '4px' }}>🔔</span>
                    <span style={{ fontSize: '10px' }}>Actividad</span>
                </button>
                <Link href="/profile" style={{ color: pathname.startsWith('/profile') ? '#fff' : 'gray', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '22px', marginBottom: '4px' }}>👤</span>
                    <span style={{ fontSize: '10px' }}>Perfil</span>
                </Link>
            </div>
            
            <ActivityModal isOpen={showActivity} onClose={() => setShowActivity(false)} />
        </>
    );
}