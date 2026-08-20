"use client";
import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Download, LogIn, UserPlus, X, Smartphone, Sparkles, Play } from 'lucide-react';
import Link from 'next/link';

export default function AuthRequiredModal() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, isLoading } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [videoId, setVideoId] = useState<string | null>(null);

    useEffect(() => {
        const authReq = searchParams.get('authRequired') || searchParams.get('notice');
        const vId = searchParams.get('video') || searchParams.get('shared_video') || searchParams.get('v');

        if (vId) {
            setVideoId(vId);
        }

        if (authReq || vId) {
            setIsOpen(true);
        }
    }, [searchParams]);

    if (!isOpen) return null;

    // If user is already logged in and there's a video parameter, offer quick navigation to the feed
    if (!isLoading && user && videoId) {
        return (
            <div style={{
                position: 'fixed',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 99999,
                backgroundColor: 'rgba(20, 20, 24, 0.95)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(142, 45, 226, 0.4)',
                borderRadius: '16px',
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(142, 45, 226, 0.3)',
                maxWidth: '90%',
                color: '#FFFFFF'
            }}>
                <div>
                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '15px' }}>Vídeo compartido disponible</p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#AAA' }}>Tienes la sesión iniciada como <strong style={{ color: '#8E2DE2' }}>{user.name || user.handle}</strong></p>
                </div>
                <button
                    onClick={() => router.push(`/feed?v=${videoId}`)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#8E2DE2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '20px',
                        padding: '8px 16px',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                    }}
                >
                    <Play size={14} fill="white" />
                    Ver en Feed
                </button>
                <button
                    onClick={() => setIsOpen(false)}
                    style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '4px' }}
                >
                    <X size={18} />
                </button>
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            padding: '16px'
        }}>
            <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '460px',
                backgroundColor: 'rgba(18, 18, 22, 0.98)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '24px',
                padding: '32px 24px 28px',
                textAlign: 'center',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(142, 45, 226, 0.25)',
                color: '#FFFFFF',
                animation: 'modalPop 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
                {/* Close Button */}
                <button
                    onClick={() => setIsOpen(false)}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#AAA',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                    }}
                    title="Cerrar"
                >
                    <X size={18} />
                </button>

                {/* Animated App Icon */}
                <div style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '22px',
                    background: 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    boxShadow: '0 8px 25px rgba(142, 45, 226, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                    <Smartphone size={36} color="white" />
                </div>

                {/* Title & Subtitle */}
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'rgba(142, 45, 226, 0.15)',
                    border: '1px solid rgba(142, 45, 226, 0.3)',
                    borderRadius: '20px',
                    padding: '4px 12px',
                    fontSize: '12px',
                    color: '#C084FC',
                    fontWeight: '600',
                    marginBottom: '12px'
                }}>
                    <Sparkles size={14} />
                    <span>Experiencia Móvil Oficial</span>
                </div>

                <h2 style={{
                    fontSize: '22px',
                    fontWeight: '800',
                    margin: '0 0 10px',
                    lineHeight: '1.3',
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #E0E0E0 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    {videoId ? 'Descarga la App para ver este vídeo' : 'Descarga la App oficial de LYVO'}
                </h2>

                <p style={{
                    fontSize: '14px',
                    lineHeight: '1.5',
                    color: '#A0A0B0',
                    margin: '0 0 24px',
                    padding: '0 8px'
                }}>
                    Para reproducir vídeos, escuchar audios y participar en la comunidad, necesitas la aplicación oficial o registrarte en LYVO.
                </p>

                {/* Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Direct APK Download Button */}
                    <a
                        href="/LYVO.apk"
                        download="LYVO.apk"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            background: 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)',
                            color: '#FFFFFF',
                            textDecoration: 'none',
                            padding: '14px 20px',
                            borderRadius: '16px',
                            fontWeight: '700',
                            fontSize: '15px',
                            boxShadow: '0 4px 20px rgba(142, 45, 226, 0.4)',
                            transition: 'transform 0.15s, box-shadow 0.15s'
                        }}
                    >
                        <Download size={20} />
                        <span>Descargar App Oficial (APK)</span>
                    </a>

                    {/* Register / Login Buttons */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <Link
                            href="/register"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                color: '#FFFFFF',
                                textDecoration: 'none',
                                padding: '12px 14px',
                                borderRadius: '14px',
                                fontWeight: '600',
                                fontSize: '13px',
                                transition: 'background 0.15s'
                            }}
                        >
                            <UserPlus size={16} color="#C084FC" />
                            <span>Crear Cuenta</span>
                        </Link>

                        <Link
                            href="/login"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                color: '#FFFFFF',
                                textDecoration: 'none',
                                padding: '12px 14px',
                                borderRadius: '14px',
                                fontWeight: '600',
                                fontSize: '13px',
                                transition: 'background 0.15s'
                            }}
                        >
                            <LogIn size={16} color="#60A5FA" />
                            <span>Iniciar Sesión</span>
                        </Link>
                    </div>

                    {/* Dismiss Button */}
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#666',
                            fontSize: '13px',
                            padding: '8px',
                            cursor: 'pointer',
                            marginTop: '4px'
                        }}
                    >
                        Explorar la web primero
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes modalPop {
                    0% { transform: scale(0.92); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
