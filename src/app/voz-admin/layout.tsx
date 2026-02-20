'use client';
import Link from 'next/link';
import styles from './voz-admin.module.css';
import '98.css';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function VozAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [employee, setEmployee] = useState<{ username: string, role: number } | null>(null);
    const [isStartOpen, setIsStartOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState('');
    const [windowState, setWindowState] = useState<'normal' | 'maximized' | 'minimized'>('normal');

    useEffect(() => {
        const storedEmployee = localStorage.getItem('vozEmployee');
        if (storedEmployee) {
            setEmployee(JSON.parse(storedEmployee));
        }
    }, [pathname]);

    useEffect(() => {
        if (!isLoading) {
            if (!user || user.role !== 'admin') {
                router.push('/');
            }
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        setWindowState('normal');
    }, [pathname]);

    useEffect(() => {
        const timer = setInterval(() => {
            const date = new Date();
            setCurrentTime(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // 1: Director, 2: Admin, 3: Moderator, 4: Ads, 5: Tech, 6: Dev
    const allNavItems = [
        { href: '/voz-admin', label: '📊 Dashboard', roles: [1, 2, 3, 4, 5, 6] },
        { href: '/voz-admin/users', label: '👥 Usuarios App', roles: [1, 2, 3, 6] },
        { href: '/voz-admin/moderation', label: '🛡️ Moderación Voz', roles: [1, 2, 3, 6] },
        { href: '/voz-admin/ads', label: '📢 Publicidad App', roles: [1, 2, 4, 6] },
        { href: '/voz-admin/stats', label: '📈 Ranking Viral', roles: [1, 2, 5, 6] },
        { href: '/voz-admin/logs', label: '📜 Logs del Director', roles: [1, 5, 6] },
        { href: '/', label: '🚪 Salir al Web', roles: [1, 2, 3, 4, 5, 6] },
    ];

    const currentRole = employee?.role || 1; // Default to Role 1 (Director) to show all items by default
    const navItems = allNavItems.filter(item => {
        if (currentRole === 1 || currentRole === 6) return true; // Director & Dev see all
        return item.roles.includes(currentRole);
    });

    // Security check: if user is on a restricted path, redirect to dashboard
    useEffect(() => {
        const currentItem = allNavItems.find(i => i.href === pathname);
        if (currentItem && employee) {
            if (!currentItem.roles.includes(employee.role) && employee.role !== 1 && employee.role !== 6) {
                router.push('/voz-admin');
            }
        }
    }, [pathname, employee]);

    if (isLoading || !user || user.role !== 'admin') {
        return <div style={{ backgroundColor: '#008080', height: '100vh' }} />;
    }

    const getWindowTitle = () => {
        const item = allNavItems.find(i => i.href === pathname);
        return item ? item.label : 'VOZ Control Center';
    }

    const activeItem = allNavItems.find(i => i.href === pathname);

    return (
        <div className={styles.desktop}>
            <div className={styles.screenArea}>
                <div className={`${styles.windowWrapper} ${windowState === 'maximized' ? styles.maximized : ''} ${windowState === 'minimized' ? styles.minimized : ''} window`}>
                    <div className="title-bar">
                        <div className="title-bar-text">
                            {getWindowTitle()}
                            {employee && <span style={{ marginLeft: 10, fontSize: '0.7em', opacity: 0.7 }}>({employee.username})</span>}
                        </div>
                        <div className="title-bar-controls">
                            <button aria-label="Minimize" onClick={() => setWindowState('minimized')}></button>
                            <button
                                aria-label={windowState === 'maximized' ? 'Restore' : 'Maximize'}
                                onClick={() => setWindowState(windowState === 'maximized' ? 'normal' : 'maximized')}
                            ></button>
                            <button aria-label="Close" onClick={() => router.push('/')}></button>
                        </div>
                    </div>
                    <div className={`window-body ${styles.windowBody}`}>
                        {children}
                    </div>
                </div>
            </div>

            <div className={styles.taskbar}>
                <button
                    className={styles.startButton}
                    onClick={() => setIsStartOpen(!isStartOpen)}
                    style={isStartOpen ? { borderStyle: 'inset', background: '#e0e0e0' } : {}}
                >
                    <img src="https://win98icons.alexmeub.com/icons/png/windows-0.png" alt="" style={{ marginRight: 4, height: 16 }} />
                    Inicio
                </button>
                <div style={{ borderLeft: '2px solid #808080', borderRight: '2px solid #fff', height: '22px', margin: '0 5px' }} />

                {isStartOpen && (
                    <div className={styles.startMenu}>
                        <div className={styles.startMenuItem} style={{ background: 'navy', color: 'white', fontWeight: 'bold' }}>
                            VOZ OS 98
                        </div>
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={styles.startMenuItem}
                                onClick={() => setIsStartOpen(false)}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>
                )}

                {/* Taskbar Button for active window */}
                {activeItem && (
                    <button
                        className={styles.activeWindowTab}
                        onClick={() => setWindowState(windowState === 'minimized' ? 'normal' : 'minimized')}
                        style={windowState !== 'minimized' ? { borderStyle: 'inset', background: '#e0e0e0' } : {}}
                    >
                        {activeItem.label}
                    </button>
                )}

                <div className={styles.clock} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                        onClick={() => {
                            localStorage.removeItem('vozEmployee');
                            window.location.reload();
                        }}
                        style={{ padding: '1px 5px', fontSize: '0.7rem' }}
                    >
                        Salir
                    </button>
                    {currentTime}
                </div>
            </div>
        </div>
    );
}
