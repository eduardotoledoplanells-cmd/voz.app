'use client';

import React, { useState, useRef } from 'react';

interface R2VideoUploadProps {
    initialToken?: string;
}

export default function R2VideoUpload({ initialToken = '' }: R2VideoUploadProps) {
    const [token, setToken] = useState(initialToken);
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [progressMessage, setProgressMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [uploadedData, setUploadedData] = useState<{
        url: string;
        key: string;
        bucket: string;
        size: number;
    } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = (selectedFile: File) => {
        setErrorMessage('');
        setUploadedData(null);
        
        // Size validation: 100MB max
        if (selectedFile.size > 100 * 1024 * 1024) {
            setErrorMessage('El tamaño del archivo supera los 100 MB permitidos.');
            setFile(null);
            return;
        }

        // Type validation
        if (!selectedFile.type.startsWith('video/')) {
            setErrorMessage('El archivo seleccionado debe ser un archivo de vídeo.');
            setFile(null);
            return;
        }

        setFile(selectedFile);
        setStatus('idle');
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setErrorMessage('Por favor, selecciona un vídeo primero.');
            return;
        }

        if (!token.trim()) {
            setErrorMessage('Se requiere un token de autenticación (Bearer Token) para realizar la subida.');
            return;
        }

        setStatus('uploading');
        setProgressMessage('Subiendo archivo a Cloudflare R2...');
        setErrorMessage('');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const cleanToken = token.replace('Bearer ', '').trim();
            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${cleanToken}`
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al subir el archivo');
            }

            setStatus('success');
            setProgressMessage('¡Vídeo subido con éxito!');
            setUploadedData({
                url: data.url,
                key: data.key,
                bucket: data.bucket,
                size: data.size
            });
        } catch (error: any) {
            console.error('Upload component error:', error);
            setStatus('error');
            setErrorMessage(error.message || 'Error desconocido al subir el vídeo.');
        }
    };

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    return (
        <div style={{
            maxWidth: '650px',
            margin: '2rem auto',
            padding: '2.5rem',
            borderRadius: '24px',
            backgroundColor: 'rgba(25, 25, 45, 0.65)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            color: '#e2e8f0',
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
        }}>
            <h2 style={{
                fontSize: '1.75rem',
                fontWeight: '800',
                marginBottom: '0.5rem',
                background: 'linear-gradient(135deg, #a78bfa 0%, #f472b6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textAlign: 'center'
            }}>
                Subida de Vídeo a Cloudflare R2
            </h2>
            <p style={{
                color: '#94a3b8',
                fontSize: '0.9rem',
                textAlign: 'center',
                marginBottom: '2rem'
            }}>
                Sube tus vídeos de forma segura a través del endpoint `/api/upload`
            </p>

            {/* Token Authentication Input */}
            <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: '#cbd5e1',
                    marginBottom: '0.5rem'
                }}>
                    Token de Autenticación (Bearer token de Supabase)
                </label>
                <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Introduce o pega tu token JWT de Supabase..."
                    style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(15, 15, 25, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#f8fafc',
                        fontSize: '0.9rem',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                />
            </div>

            {/* Drag & Drop Area */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerFileSelect}
                style={{
                    border: `2px dashed ${isDragOver ? '#8b5cf6' : 'rgba(255, 255, 255, 0.15)'}`,
                    borderRadius: '16px',
                    padding: '3rem 2rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: isDragOver ? 'rgba(139, 92, 246, 0.05)' : 'rgba(0, 0, 0, 0.15)',
                    transition: 'all 0.2s ease',
                    marginBottom: '1.5rem'
                }}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="video/*"
                    style={{ display: 'none' }}
                />

                <div style={{
                    fontSize: '2.5rem',
                    marginBottom: '1rem',
                }}>
                    📹
                </div>

                {file ? (
                    <div>
                        <p style={{ fontWeight: '600', color: '#f8fafc', fontSize: '1rem', wordBreak: 'break-all' }}>
                            {file.name}
                        </p>
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                            Tamaño: {formatBytes(file.size)}
                        </p>
                    </div>
                ) : (
                    <div>
                        <p style={{ fontWeight: '600', color: '#e2e8f0', fontSize: '0.95rem' }}>
                            Arrastra y suelta tu archivo de vídeo aquí
                        </p>
                        <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                            O haz clic para explorar tu dispositivo (Máx. 100MB)
                        </p>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {errorMessage && (
                <div style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    color: '#fca5a5',
                    fontSize: '0.85rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    ⚠️ <span>{errorMessage}</span>
                </div>
            )}

            {/* Uploading Status */}
            {status === 'uploading' && (
                <div style={{
                    textAlign: 'center',
                    marginBottom: '1.5rem'
                }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        border: '3px solid rgba(139, 92, 246, 0.1)',
                        borderTop: '3px solid #8b5cf6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 0.75rem'
                    }} />
                    <p style={{ color: '#a78bfa', fontSize: '0.9rem', fontWeight: '500' }}>
                        {progressMessage}
                    </p>
                    
                    <style dangerouslySetInnerHTML={{ __html: `
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}} />
                </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                    onClick={handleUpload}
                    disabled={!file || status === 'uploading'}
                    style={{
                        padding: '0.75rem 2rem',
                        borderRadius: '12px',
                        fontWeight: '700',
                        fontSize: '0.95rem',
                        cursor: (!file || status === 'uploading') ? 'not-allowed' : 'pointer',
                        border: 'none',
                        background: (!file || status === 'uploading')
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
                        color: (!file || status === 'uploading') ? '#64748b' : '#ffffff',
                        transition: 'opacity 0.2s',
                        boxShadow: (!file || status === 'uploading') ? 'none' : '0 4px 15px rgba(124, 58, 237, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                        if (file && status !== 'uploading') {
                            e.currentTarget.style.opacity = '0.9';
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '1';
                    }}
                >
                    Subir a Cloudflare R2
                </button>

                {file && status !== 'uploading' && (
                    <button
                        onClick={() => {
                            setFile(null);
                            setStatus('idle');
                            setUploadedData(null);
                        }}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '12px',
                            fontWeight: '600',
                            fontSize: '0.95rem',
                            cursor: 'pointer',
                            backgroundColor: 'transparent',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#cbd5e1',
                        }}
                    >
                        Limpiar
                    </button>
                )}
            </div>

            {/* Success Metadata & Preview */}
            {status === 'success' && uploadedData && (
                <div style={{
                    marginTop: '2rem',
                    padding: '1.5rem',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.15)',
                }}>
                    <p style={{
                        color: '#34d399',
                        fontWeight: '700',
                        fontSize: '1rem',
                        marginBottom: '1rem',
                        textAlign: 'center'
                    }}>
                        🎉 Subida Completada Correctamente
                    </p>
                    
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                            <span>Bucket:</span>
                            <span style={{ color: '#e2e8f0', fontWeight: '500' }}>{uploadedData.bucket}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
                            <span>Clave:</span>
                            <span style={{ color: '#e2e8f0', fontWeight: '500', wordBreak: 'break-all', textAlign: 'right', marginLeft: '1rem' }}>{uploadedData.key}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem' }}>
                            <span>Tamaño:</span>
                            <span style={{ color: '#e2e8f0', fontWeight: '500' }}>{formatBytes(uploadedData.size)}</span>
                        </div>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '0.5rem' }}>
                            Vista previa del vídeo:
                        </p>
                        <video
                            src={uploadedData.url}
                            controls
                            style={{
                                width: '100%',
                                borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                backgroundColor: '#000000'
                            }}
                        />
                        <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
                            <a
                                href={uploadedData.url}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                    fontSize: '0.85rem',
                                    color: '#60a5fa',
                                    textDecoration: 'underline'
                                }}
                            >
                                Abrir URL pública en una pestaña nueva
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
