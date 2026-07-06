'use client';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function LandingAuthButton() {
    const { user, isLoading } = useAuth();
    
    if (isLoading) {
        return (
            <div style={{
                display: 'inline-block',
                background: '#333',
                color: 'transparent',
                padding: '15px 40px',
                borderRadius: '30px',
                fontSize: '18px',
                fontWeight: 'bold',
                marginTop: '20px',
                userSelect: 'none'
            }}>
                Cargando...
            </div>
        );
    }

    if (user) {
        return (
            <Link href="/feed" style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)',
                color: '#fff',
                padding: '15px 40px',
                borderRadius: '30px',
                fontSize: '18px',
                fontWeight: 'bold',
                textDecoration: 'none',
                marginTop: '20px',
                boxShadow: '0 4px 15px rgba(74, 0, 224, 0.4)'
            }}>
                Entrar en tu cuenta
            </Link>
        );
    }

    return (
        <Link href="/login" style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)',
            color: '#fff',
            padding: '15px 40px',
            borderRadius: '30px',
            fontSize: '18px',
            fontWeight: 'bold',
            textDecoration: 'none',
            marginTop: '20px',
            boxShadow: '0 4px 15px rgba(74, 0, 224, 0.4)'
        }}>
            Entrar
        </Link>
    );
}
