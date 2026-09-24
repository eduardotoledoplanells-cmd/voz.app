'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const COOKIE_CONSENT_KEY = 'lyvo_cookie_consent';
const COOKIE_POLICY_VERSION = '1.0';
const SIX_MONTHS_DAYS = 180;

export interface CookiePreferences {
    essential: boolean;     // Siempre true (sb-access-token, auth, sesión)
    security: boolean;      // Stripe antifraude (__stripe_mid, __stripe_sid)
    preferences: boolean;   // Tema, volumen, idioma (lyvo_theme)
    timestamp: number;
    version: string;
}

export default function CookieConsentBanner() {
    const [mounted, setMounted] = useState(false);
    const [visible, setVisible] = useState(false);
    const [showConfig, setShowConfig] = useState(false);
    const [allowSecurity, setAllowSecurity] = useState(true);
    const [allowPreferences, setAllowPreferences] = useState(true);

    const getStoredConsent = (): CookiePreferences | null => {
        try {
            // Intentar localStorage primero
            const local = localStorage.getItem(COOKIE_CONSENT_KEY);
            if (local) {
                const parsed: CookiePreferences = JSON.parse(local);
                // Comprobar expiración (6 meses) y versión de política
                const isExpired = Date.now() - parsed.timestamp > SIX_MONTHS_DAYS * 24 * 60 * 60 * 1000;
                if (!isExpired && parsed.version === COOKIE_POLICY_VERSION) {
                    return parsed;
                }
            }

            // Fallback: leer cookie del navegador
            const match = document.cookie.match(new RegExp('(^| )' + COOKIE_CONSENT_KEY + '=([^;]+)'));
            if (match) {
                const parsed: CookiePreferences = JSON.parse(decodeURIComponent(match[2]));
                const isExpired = Date.now() - parsed.timestamp > SIX_MONTHS_DAYS * 24 * 60 * 60 * 1000;
                if (!isExpired && parsed.version === COOKIE_POLICY_VERSION) {
                    return parsed;
                }
            }
        } catch (e) {
            console.error('Error leyendo consentimiento de cookies:', e);
        }
        return null;
    };

    const saveConsent = (prefs: CookiePreferences) => {
        try {
            const dataStr = JSON.stringify(prefs);
            // 1. Guardar en localStorage
            localStorage.setItem(COOKIE_CONSENT_KEY, dataStr);

            // 2. Guardar en cookie del navegador (expira en 180 días, SameSite Lax)
            const maxAge = SIX_MONTHS_DAYS * 24 * 60 * 60;
            document.cookie = `${COOKIE_CONSENT_KEY}=${encodeURIComponent(dataStr)}; path=/; max-age=${maxAge}; SameSite=Lax`;

            // 3. Notificar a la aplicación para habilitar o deshabilitar trackers/scripts
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('lyvo_cookie_consent_changed', { detail: prefs }));
            }
        } catch (e) {
            console.error('Error guardando consentimiento de cookies:', e);
        }

        setVisible(false);
        setShowConfig(false);
    };

    useEffect(() => {
        setMounted(true);
        const consent = getStoredConsent();
        if (!consent) {
            // Si nunca ha respondido o expiró, mostrar banner tras breve transición suave
            const timer = setTimeout(() => setVisible(true), 600);
            return () => clearTimeout(timer);
        } else {
            setAllowSecurity(consent.security);
            setAllowPreferences(consent.preferences);
        }
    }, []);

    // Escuchar evento global para re-abrir el configurador desde cualquier enlace del footer
    useEffect(() => {
        const handleOpen = () => {
            const current = getStoredConsent();
            if (current) {
                setAllowSecurity(current.security);
                setAllowPreferences(current.preferences);
            }
            setShowConfig(true);
            setVisible(true);
        };

        window.addEventListener('open-cookie-settings', handleOpen);
        return () => window.removeEventListener('open-cookie-settings', handleOpen);
    }, []);

    if (!mounted || !visible) return null;

    const handleAcceptAll = () => {
        saveConsent({
            essential: true,
            security: true,
            preferences: true,
            timestamp: Date.now(),
            version: COOKIE_POLICY_VERSION
        });
    };

    const handleRejectAll = () => {
        saveConsent({
            essential: true,
            security: false,
            preferences: false,
            timestamp: Date.now(),
            version: COOKIE_POLICY_VERSION
        });
    };

    const handleSaveCustom = () => {
        saveConsent({
            essential: true,
            security: allowSecurity,
            preferences: allowPreferences,
            timestamp: Date.now(),
            version: COOKIE_POLICY_VERSION
        });
    };

    return (
        <aside
            role="dialog"
            aria-label="Consentimiento de cookies"
            aria-modal="true"
            style={{
                position: 'fixed',
                bottom: '20px',
                left: '20px',
                right: '20px',
                maxWidth: '680px',
                margin: '0 auto',
                backgroundColor: 'rgba(19, 19, 31, 0.96)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(142, 45, 226, 0.35)',
                borderRadius: '16px',
                padding: '24px',
                color: '#FFFFFF',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7), 0 0 20px rgba(142, 45, 226, 0.2)',
                zIndex: 999999,
                fontFamily: 'Inter, -apple-system, sans-serif',
                animation: 'lyvoFadeUp 0.35s ease-out'
            }}
        >
            <style>{`
                @keyframes lyvoFadeUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .lyvo-cookie-btn {
                    flex: 1;
                    min-width: 140px;
                    padding: 12px 18px;
                    font-size: 14px;
                    font-weight: 600;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-align: center;
                    border: none;
                }
                .lyvo-cookie-btn-primary {
                    background: linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%);
                    color: #FFFFFF;
                }
                .lyvo-cookie-btn-primary:hover {
                    opacity: 0.92;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 14px rgba(142, 45, 226, 0.4);
                }
                .lyvo-cookie-btn-secondary {
                    background: rgba(255, 255, 255, 0.08);
                    color: #FFFFFF;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                .lyvo-cookie-btn-secondary:hover {
                    background: rgba(255, 255, 255, 0.14);
                    border-color: rgba(255, 255, 255, 0.35);
                }
                .lyvo-cookie-btn-link {
                    background: transparent;
                    color: #C084FC;
                    text-decoration: underline;
                    border: none;
                    cursor: pointer;
                    font-size: 13px;
                    padding: 6px 8px;
                }
                .lyvo-cookie-switch {
                    position: relative;
                    display: inline-block;
                    width: 44px;
                    height: 24px;
                }
                .lyvo-cookie-switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .lyvo-cookie-slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background-color: rgba(255, 255, 255, 0.2);
                    transition: .3s;
                    border-radius: 24px;
                }
                .lyvo-cookie-slider:before {
                    position: absolute;
                    content: "";
                    height: 18px;
                    width: 18px;
                    left: 3px;
                    bottom: 3px;
                    background-color: white;
                    transition: .3s;
                    border-radius: 50%;
                }
                input:checked + .lyvo-cookie-slider {
                    background-color: #8E2DE2;
                }
                input:checked + .lyvo-cookie-slider:before {
                    transform: translateX(20px);
                }
                input:disabled + .lyvo-cookie-slider {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
            `}</style>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>🍪</span>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>
                        {showConfig ? 'Configuración de Cookies' : 'Tu privacidad en LYVO'}
                    </h3>
                </div>
            </div>

            {!showConfig ? (
                <>
                    <p style={{ margin: '0 0 18px 0', fontSize: '14px', lineHeight: '1.6', color: 'rgba(255, 255, 255, 0.8)' }}>
                        Utilizamos cookies propias estrictamente necesarias para el inicio de sesión y la navegación segura. Además, usamos cookies no esenciales (como módulos antifraude de Stripe y preferencias de visualización). Puedes aceptar todas las cookies o rechazarlas directamente según el RGPD y la Directiva ePrivacy.
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                        {/* Botones principales con IDÉNTICO PESO y visibilidad (requisito legal AEPD) */}
                        <button
                            type="button"
                            onClick={handleAcceptAll}
                            className="lyvo-cookie-btn lyvo-cookie-btn-primary"
                        >
                            Aceptar todas
                        </button>
                        <button
                            type="button"
                            onClick={handleRejectAll}
                            className="lyvo-cookie-btn lyvo-cookie-btn-secondary"
                        >
                            Rechazar no esenciales
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowConfig(true)}
                            className="lyvo-cookie-btn-link"
                            style={{ marginLeft: 'auto' }}
                        >
                            Personalizar
                        </button>
                    </div>

                    <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                        <span>Tus elecciones se conservarán durante 6 meses.</span>
                        <Link href="/legal/cookies" target="_blank" style={{ color: '#C084FC', textDecoration: 'none' }}>
                            Ver Política de Cookies ↗
                        </Link>
                    </div>
                </>
            ) : (
                <>
                    <p style={{ margin: '0 0 16px 0', fontSize: '13px', lineHeight: '1.5', color: 'rgba(255, 255, 255, 0.7)' }}>
                        Selecciona qué categorías de cookies permites utilizar durante tu experiencia en LYVO:
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                        {/* 1. Técnicas obligatorias */}
                        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ maxWidth: '80%' }}>
                                <div style={{ fontWeight: 600, fontSize: '14px', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    Cookies Técnicas Necesarias
                                    <span style={{ fontSize: '11px', backgroundColor: 'rgba(142, 45, 226, 0.25)', color: '#C084FC', padding: '2px 8px', borderRadius: '12px' }}>Obligatorias</span>
                                </div>
                                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '4px' }}>
                                    Imprescindibles para mantener tu sesión activa, proteger el login y navegar por la plataforma.
                                </div>
                            </div>
                            <label className="lyvo-cookie-switch">
                                <input type="checkbox" checked disabled />
                                <span className="lyvo-cookie-slider" />
                            </label>
                        </div>

                        {/* 2. Seguridad y Antifraude Stripe */}
                        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ maxWidth: '80%' }}>
                                <div style={{ fontWeight: 600, fontSize: '14px', color: '#FFFFFF' }}>
                                    Seguridad Bancaria y Antifraude (Stripe)
                                </div>
                                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '4px' }}>
                                    Detección de patrones fraudulentos en pagos con tarjeta y pasarela de cobros a creadores (<code>__stripe_mid</code>, <code>__stripe_sid</code>).
                                </div>
                            </div>
                            <label className="lyvo-cookie-switch">
                                <input
                                    type="checkbox"
                                    checked={allowSecurity}
                                    onChange={(e) => setAllowSecurity(e.target.checked)}
                                />
                                <span className="lyvo-cookie-slider" />
                            </label>
                        </div>

                        {/* 3. Preferencias de Reproducción */}
                        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ maxWidth: '80%' }}>
                                <div style={{ fontWeight: 600, fontSize: '14px', color: '#FFFFFF' }}>
                                    Preferencias de Experiencia
                                </div>
                                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '4px' }}>
                                    Guardar ajustes como el tema visual, volumen preferido y filtros de contenido entre visitas.
                                </div>
                            </div>
                            <label className="lyvo-cookie-switch">
                                <input
                                    type="checkbox"
                                    checked={allowPreferences}
                                    onChange={(e) => setAllowPreferences(e.target.checked)}
                                />
                                <span className="lyvo-cookie-slider" />
                            </label>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            onClick={() => setShowConfig(false)}
                            className="lyvo-cookie-btn lyvo-cookie-btn-secondary"
                            style={{ minWidth: '100px' }}
                        >
                            Atrás
                        </button>
                        <button
                            type="button"
                            onClick={handleRejectAll}
                            className="lyvo-cookie-btn lyvo-cookie-btn-secondary"
                        >
                            Rechazar todas
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveCustom}
                            className="lyvo-cookie-btn lyvo-cookie-btn-primary"
                        >
                            Guardar preferencias
                        </button>
                    </div>
                </>
            )}
        </aside>
    );
}
