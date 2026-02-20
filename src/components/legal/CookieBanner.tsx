'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './CookieBanner.module.css';

export default function CookieBanner() {
    const [showBanner, setShowBanner] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        // Check if user has already made a choice
        const consent = localStorage.getItem('cookie_consent');
        if (!consent) {
            setShowBanner(true);
        }
    }, []);

    const acceptAll = () => {
        localStorage.setItem('cookie_consent', 'all');
        setShowBanner(false);
    };

    const rejectAll = () => {
        localStorage.setItem('cookie_consent', 'necessary');
        setShowBanner(false);
    };

    const savePreferences = () => {
        localStorage.setItem('cookie_consent', 'necessary');
        setShowBanner(false);
        setShowSettings(false);
    };

    if (!showBanner) return null;

    return (
        <>
            <div className={styles.overlay} />
            <div className={styles.banner}>
                {!showSettings ? (
                    <>
                        <div className={styles.content}>
                            <h3 className={styles.title}>🍪 Uso de Cookies</h3>
                            <p className={styles.text}>
                                Utilizamos cookies propias y de terceros para mejorar nuestros servicios y mostrarle publicidad
                                relacionada con sus preferencias mediante el análisis de sus hábitos de navegación.
                            </p>
                            <p className={styles.text}>
                                Puede obtener más información en nuestra{' '}
                                <Link href="/legal/cookies" className={styles.link}>
                                    Política de Cookies
                                </Link>
                                .
                            </p>
                        </div>
                        <div className={styles.buttons}>
                            <button onClick={rejectAll} className={styles.buttonReject}>
                                Rechazar
                            </button>
                            <button onClick={() => setShowSettings(true)} className={styles.buttonSettings}>
                                Configurar
                            </button>
                            <button onClick={acceptAll} className={styles.buttonAccept}>
                                Aceptar Todas
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className={styles.content}>
                            <h3 className={styles.title}>⚙️ Configuración de Cookies</h3>

                            <div className={styles.cookieOption}>
                                <div className={styles.cookieHeader}>
                                    <label className={styles.cookieLabel}>
                                        <input type="checkbox" checked disabled />
                                        <span>Cookies Necesarias</span>
                                    </label>
                                    <span className={styles.required}>Siempre activas</span>
                                </div>
                                <p className={styles.cookieDescription}>
                                    Estas cookies son esenciales para el funcionamiento del sitio web y no pueden ser desactivadas.
                                    Se utilizan para autenticación, carrito de compra y seguridad.
                                </p>
                            </div>

                            <div className={styles.cookieOption}>
                                <div className={styles.cookieHeader}>
                                    <label className={styles.cookieLabel}>
                                        <input type="checkbox" disabled />
                                        <span>Cookies de Terceros (Stripe)</span>
                                    </label>
                                    <span className={styles.required}>Necesarias para pagos</span>
                                </div>
                                <p className={styles.cookieDescription}>
                                    Utilizadas por Stripe para procesar pagos de forma segura. Son necesarias para completar compras.
                                </p>
                            </div>
                        </div>
                        <div className={styles.buttons}>
                            <button onClick={() => setShowSettings(false)} className={styles.buttonReject}>
                                Volver
                            </button>
                            <button onClick={savePreferences} className={styles.buttonAccept}>
                                Guardar Preferencias
                            </button>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
