'use client';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import styles from '../landing.module.css';

interface Props {
    isNavbar?: boolean;
}

export default function LandingAuthButton({ isNavbar = false }: Props) {
    const { user, isLoading } = useAuth();
    
    if (isLoading) {
        return isNavbar ? (
            <div className={styles.navBtnPrimary} style={{ color: 'transparent', userSelect: 'none' }}>...</div>
        ) : (
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

    const text = user ? 'Entrar en tu cuenta' : 'Iniciar sesión o registro';
    const href = user ? '/feed' : '/login';

    if (isNavbar) {
        return (
            <Link href={href} className={styles.navBtnPrimary}>
                {text}
            </Link>
        );
    }

    return (
        <Link href={href} style={{
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
            {text}
        </Link>
    );
}
