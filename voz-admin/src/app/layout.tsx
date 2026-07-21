'use client';
import Link from 'next/link';
import styles from './voz-admin.module.css';
import './98-nobitmap.css';
import './admin-overrides.css';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

function VozAdminContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [employee, setEmployee] = useState<{ username: string, role: number, workerNumber: string } | null>(null);
    const [isStartOpen, setIsStartOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState('');
    const [windowState, setWindowState] = useState<'normal' | 'maximized' | 'minimized'>('normal');
    const [errorCount, setErrorCount] = useState(0);

    // Global fetch interceptor to attach JWT token to all requests
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const originalFetch = window.fetch;
            window.fetch = async (...args) => {
                let [resource, config] = args;
                if (typeof resource === 'string' && resource.startsWith('/api/voz')) {
                    const storedEmployee = localStorage.getItem('vozEmployee');
                    if (storedEmployee) {
                        try {
                            const emp = JSON.parse(storedEmployee);
                            if (emp.token) {
                                config = config || {};
                                config.headers = {
                                    ...config.headers,
                                    'Authorization': `Bearer ${emp.token}`
                                };
                            }
                        } catch (e) {}
                    }
                }
                return originalFetch(resource, config);
            };
        }
    }, []);


    useEffect(() => {
        const storedEmployee = localStorage.getItem('vozEmployee');
        if (storedEmployee) {
            setEmployee(JSON.parse(storedEmployee));
        }
    }, [pathname]);

    useEffect(() => {
        if (!isLoading) {
            if (!user || user.role !== 'admin') {
                // If not admin, you shouldn't be here. 
                // In a separate project, maybe redirect to a login page or just show unauthorized
                console.warn('Unauthorized access to VOZ Admin');
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

    useEffect(() => {
        const fetchErrorCount = () => {
            fetch('/api/voz/admin/alerts')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setErrorCount(data.length);
                    }
                })
                .catch(err => console.error('Error fetching alerts count:', err));
        };
        fetchErrorCount();
        const interval = setInterval(fetchErrorCount, 30000); // Check every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const [isInactiveActive, setIsInactiveActive] = useState(false);

    // Initial check for inactivity if already present in DOM
    useEffect(() => {
        const handleInactivityEvent = (e: any) => {
            setIsInactiveActive(e.detail.active);
        };
        window.addEventListener('voz-inactivity-active', handleInactivityEvent);
        return () => window.removeEventListener('voz-inactivity-active', handleInactivityEvent);
    }, []);

    // Auto-refresh every 5 minutes (PAUSED IF INACTIVE)
    useEffect(() => {
        if (isInactiveActive) return;

        const refreshTimer = setInterval(() => {
            router.refresh();
        }, 300000); // 5 minutes
        return () => clearInterval(refreshTimer);
    }, [router, isInactiveActive]);

    // Roles: 1: Director, 2: Admin, 3: Moderator, 4: Ads, 5: Tech, 6: Dev
    const allNavItems = [
        { href: '/', label: '📊 Dashboard', roles: [1, 2, 5, 6] },
        { href: '/billing', label: '💰 Facturación Voz', roles: [1, 2] },
        { href: '/creators', label: '📂 Creadores Voz', roles: [1, 2, 3, 5, 6] },
        { href: '/users', label: '👥 Usuarios App', roles: [1, 3, 5, 6] },
        { href: '/moderation', label: '🛡️ Moderación Voz', roles: [1, 3, 5, 6] },
        { href: '/notifications', label: '✉️ Notificaciones App', roles: [1, 2, 5, 6] },
        { href: '/ads', label: '📢 Publicidad App', roles: [1, 4, 5, 6] },
        { href: '/stats', label: '📈 Ranking Viral', roles: [1, 5, 6] },
        { href: '/support', label: '📬 Buzón V.O.Z.', roles: [1, 2, 5, 6] },
        { href: '/withdrawals', label: '🏦 Gestión de Cobros', roles: [1, 2, 5, 6] },
        { href: '/hr', label: '👥 Recursos Humanos', roles: [1] },
        { href: '/logs', label: '📜 Logs del Director', roles: [1] },
        { href: '/errors', label: '🔔 Errores de Sistema', roles: [1, 2, 5, 6] },
        { href: '/servers', label: '🖥️ Servidores', roles: [1, 2, 5, 6] },
    ];

    const currentRole = employee ? Number(employee.role) : null;
    const navItems = currentRole !== null
        ? allNavItems.filter(item => {
            if (currentRole === 1 || currentRole === 6) return true;
            return item.roles.includes(currentRole);
          })
        : [];

    useEffect(() => {
        const currentItem = allNavItems.find(i => i.href === pathname);
        if (currentItem) {
            if (!employee) {
                if (pathname !== '/') {
                    router.push('/');
                }
            } else {
                const role = Number(employee.role);
                if (!currentItem.roles.includes(role) && role !== 1 && role !== 6) {
                    router.push('/');
                }
            }
        }
    }, [pathname, employee, router]);

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
                            {employee && <span style={{ marginLeft: 10, fontSize: '11px', opacity: 0.7 }}>([{employee.workerNumber}] {employee.username})</span>}
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
                        {!employee && pathname !== '/' ? (
                            <div style={{ padding: '20px', textAlign: 'center' }}>
                                <p>Redireccionando al Control de Acceso...</p>
                            </div>
                        ) : (
                            children
                        )}
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

                {activeItem && (
                    <button
                        className={styles.activeWindowTab}
                        onClick={() => setWindowState(windowState === 'minimized' ? 'normal' : 'minimized')}
                        style={windowState !== 'minimized' ? { borderStyle: 'inset', background: '#e0e0e0' } : {}}
                    >
                        {activeItem.label}
                    </button>
                )}

                <div className={styles.clock} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {errorCount > 0 && (
                        <Link href="/errors" title={`${errorCount} errores de sistema detectados`} style={{ display: 'flex', alignItems: 'center', marginRight: '5px' }}>
                            <svg 
                                viewBox="0 0 24 24" 
                                width="20" 
                                height="20" 
                                className={styles.flashingBell}
                                style={{ cursor: 'pointer' }}
                            >
                                <path 
                                    d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" 
                                    fill="#ff0000" 
                                    stroke="#000000" 
                                    strokeWidth="1.5"
                                />
                            </svg>
                        </Link>
                    )}
                    <button
                        onClick={() => {
                            if (employee) {
                                fetch('/api/voz/logs', {
                                    method: 'POST',
                                    body: JSON.stringify({
                                        employeeName: `[${employee.workerNumber}] ${employee.username}`,
                                        action: 'Cierre de Sesión',
                                        details: `Sesión finalizada manualmente.`
                                    }),
                                    headers: { 'Content-Type': 'application/json' }
                                }).finally(() => {
                                    localStorage.removeItem('vozEmployee');
                                    window.location.reload();
                                });
                            } else {
                                localStorage.removeItem('vozEmployee');
                                window.location.reload();
                            }
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

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es" suppressHydrationWarning>
            <head>
                <style dangerouslySetInnerHTML={{ __html: `
                    @font-face {
                        font-family: "Pixelated MS Sans Serif";
                        src: local("Segoe UI");
                        font-weight: normal;
                        font-style: normal;
                    }
                    @font-face {
                        font-family: "MS Sans Serif";
                        src: local("Segoe UI");
                        font-weight: normal;
                        font-style: normal;
                    }
                    html, body {
                        font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif !important;
                        font-size: 14px !important;
                    }
                    *, *::before, *::after {
                        font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif !important;
                    }
                    input, button, select, textarea, label, li, span, td, th, div, p, strong, h1, h2, h3, h4, h5, h6, a {
                        font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif !important;
                        font-size: revert;
                    }
                `}} />
            </head>
            <body>
                <AuthProvider>
                    <VozAdminContent>
                        {children}
                    </VozAdminContent>
                </AuthProvider>
            </body>
        </html>
    );
}
