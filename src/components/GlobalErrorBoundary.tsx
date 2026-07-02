'use client';

import React from 'react';

interface Props {
    children: React.ReactNode;
    userHandle?: string;
}

interface State {
    hasError: boolean;
    errorMessage: string;
    componentStack: string;
}

/**
 * GlobalErrorBoundary — Captura cualquier error no manejado en el árbol
 * de componentes React y lo reporta al panel de administración de VOZ.
 *
 * Reemplaza la "pantalla blanca" por una pantalla de error amigable y
 * envía el stack trace completo a /api/voz/client-error → tabla system_alerts.
 */
export class GlobalErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, errorMessage: '', componentStack: '' };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            errorMessage: error?.message || 'Error desconocido',
            componentStack: '',
        };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        const errorMessage = error?.message || 'Error desconocido';
        const componentStack = info?.componentStack || '';
        const url = typeof window !== 'undefined' ? window.location.href : 'unknown';

        // Actualizar state con el stack completo
        this.setState({ errorMessage, componentStack });

        // Enviar al servidor de forma no bloqueante
        try {
            fetch('/api/voz/client-error', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    errorMessage,
                    componentStack,
                    url,
                    userHandle: this.props.userHandle || null,
                }),
            }).catch(() => {
                // Silenciar fallos de red — no queremos un bucle de errores
            });
        } catch {
            // Nunca propagar errores desde el error boundary
        }

        console.error('[GlobalErrorBoundary] Crash capturado:', error, info);
    }

    handleReload = () => {
        this.setState({ hasError: false, errorMessage: '', componentStack: '' });
        if (typeof window !== 'undefined') {
            window.history.back();
        }
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#0a0a0a',
                    color: '#ffffff',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                    padding: '24px',
                    textAlign: 'center',
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
                    <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px', color: '#fff' }}>
                        Algo salió mal
                    </h1>
                    <p style={{ color: '#999', fontSize: '15px', maxWidth: '320px', marginBottom: '32px', lineHeight: 1.5 }}>
                        Ha ocurrido un error inesperado. Nuestro equipo ya ha sido notificado automáticamente.
                    </p>
                    <button
                        onClick={this.handleReload}
                        style={{
                            backgroundColor: '#8E2DE2',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '14px 28px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            marginBottom: '12px',
                        }}
                    >
                        ← Volver atrás
                    </button>
                    <button
                        onClick={() => window.location.href = '/'}
                        style={{
                            backgroundColor: 'transparent',
                            color: '#666',
                            border: '1px solid #333',
                            borderRadius: '12px',
                            padding: '12px 24px',
                            fontSize: '14px',
                            cursor: 'pointer',
                        }}
                    >
                        Ir al inicio
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
