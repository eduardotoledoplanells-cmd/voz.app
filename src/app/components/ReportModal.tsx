'use client';

import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    video: {
        id: string;
        user?: string;
        userHandle?: string;
        videoUrl?: string;
        description?: string;
    } | null;
}

const REPORT_REASONS = [
    { id: 'pornography', label: 'Pornografía / Contenido sexual', icon: '🔞', desc: 'Desnudez o actos de carácter sexual no consentidos o explícitos.' },
    { id: 'inappropriate', label: 'Contenido inapropiado', icon: '⚠️', desc: 'Contenido ofensivo, vulgar o fuera de lugar.' },
    { id: 'violence', label: 'Violencia o contenido peligroso', icon: '🥊', desc: 'Incitación a la violencia, autolesiones o actos de riesgo.' },
    { id: 'spam', label: 'Spam o engaño', icon: '🚫', desc: 'Publicidad engañosa, fraudes o repetición masiva.' },
    { id: 'copyright', label: 'Violación de derechos de autor', icon: '⚖️', desc: 'Uso no autorizado de material con propiedad intelectual.' },
    { id: 'other', label: 'Otro motivo', icon: '💬', desc: 'Cualquier otra razón que viole las normas comunitarias.' },
];

export default function ReportModal({ isOpen, onClose, video }: ReportModalProps) {
    const { user } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    if (!isOpen || !video) return null;

    const handleReport = async (reasonLabel: string) => {
        const reporterHandle = user?.handle || user?.email || 'usuario_web';
        
        setSubmitting(true);
        setSelectedReason(reasonLabel);
        setStatusMessage(null);

        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const res = await fetch('/api/voz/moderation/report', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    targetId: video.id,
                    reporter: reporterHandle,
                    reason: reasonLabel,
                    type: 'video',
                    content: {
                        id: video.id,
                        videoUrl: video.videoUrl,
                        user: video.user || video.userHandle || 'desconocido',
                        description: video.description
                    }
                })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setStatusMessage({
                    type: 'success',
                    text: 'Denuncia enviada. Gracias por ayudarnos a mantener VOZ seguro. Nuestro equipo revisará el contenido.'
                });
                setTimeout(() => {
                    handleClose();
                }, 2200);
            } else {
                setStatusMessage({
                    type: 'error',
                    text: data.error || 'No se pudo registrar la denuncia. Inténtalo de nuevo.'
                });
            }
        } catch (e) {
            setStatusMessage({
                type: 'error',
                text: 'Error de conexión con el servidor.'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setStatusMessage(null);
        setSelectedReason(null);
        setSubmitting(false);
        onClose();
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.2s ease-out'
        }}>
            <div style={{
                backgroundColor: '#121216',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '24px',
                width: '100%',
                maxWidth: '480px',
                maxHeight: '90vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(255, 59, 48, 0.15)',
                color: 'white',
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(255, 59, 48, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(255, 59, 48, 0.3)'
                        }}>
                            <ShieldAlert size={20} color="#FF3B30" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#FFF' }}>Denunciar Vídeo</h3>
                            <span style={{ fontSize: '12px', color: '#888' }}>Selecciona el motivo del reporte</span>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={submitting}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#888',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#FFF'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#888'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Status Alert Banner */}
                {statusMessage && (
                    <div style={{
                        padding: '14px 20px',
                        backgroundColor: statusMessage.type === 'success' ? 'rgba(52, 199, 89, 0.15)' : 'rgba(255, 59, 48, 0.15)',
                        borderBottom: `1px solid ${statusMessage.type === 'success' ? 'rgba(52, 199, 89, 0.3)' : 'rgba(255, 59, 48, 0.3)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '13px',
                        lineHeight: '1.4',
                        color: statusMessage.type === 'success' ? '#34C759' : '#FF3B30'
                    }}>
                        {statusMessage.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                        <span>{statusMessage.text}</span>
                    </div>
                )}

                {/* Reasons List */}
                <div style={{
                    padding: '16px 20px 24px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                }}>
                    {REPORT_REASONS.map((reason) => {
                        const isSelected = selectedReason === reason.label;
                        return (
                            <button
                                key={reason.id}
                                disabled={submitting}
                                onClick={() => handleReport(reason.label)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    width: '100%',
                                    padding: '14px 16px',
                                    borderRadius: '16px',
                                    backgroundColor: isSelected ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                                    border: `1px solid ${isSelected ? '#FF3B30' : 'rgba(255, 255, 255, 0.08)'}`,
                                    color: 'white',
                                    textAlign: 'left',
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s ease',
                                    opacity: submitting && !isSelected ? 0.5 : 1
                                }}
                                onMouseEnter={(e) => {
                                    if (!submitting && !isSelected) {
                                        e.currentTarget.style.backgroundColor = 'rgba(255, 59, 48, 0.08)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 59, 48, 0.3)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!submitting && !isSelected) {
                                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                                    }
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <span style={{ fontSize: '20px' }}>{reason.icon}</span>
                                    <div>
                                        <div style={{ fontSize: '15px', fontWeight: '600', color: isSelected ? '#FF3B30' : '#FFF' }}>
                                            {reason.label}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                                            {reason.desc}
                                        </div>
                                    </div>
                                </div>

                                {submitting && isSelected && (
                                    <Loader2 size={18} className="animate-spin" color="#FF3B30" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '14px 24px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    textAlign: 'center',
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.4)'
                }}>
                    Tus denuncias son confidenciales y revisadas por el equipo de seguridad de VOZ.
                </div>
            </div>
        </div>
    );
}
