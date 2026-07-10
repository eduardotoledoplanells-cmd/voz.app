"use client";
import { useState, useRef } from 'react';
import BottomNav from '../components/BottomNav';
import { Upload, Music, FileVideo, CheckCircle2, Loader2 } from 'lucide-react';

export default function UploadPage() {
    const [title, setTitle] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [uploadedUrl, setUploadedUrl] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setStatus('uploading');
        setErrorMsg('');

        try {
            // 1. Get user & session token from localStorage
            const storedUser = localStorage.getItem('user');
            const supabaseSession =
                localStorage.getItem('supabase_session') ||
                localStorage.getItem('sb-thiftwzubmvcrdhuwcwm-auth-token');

            if (!storedUser) {
                setErrorMsg('Debes iniciar sesión para subir contenido.');
                setStatus('error');
                return;
            }

            const user = JSON.parse(storedUser);

            // Parse token from Supabase session storage
            let token = '';
            if (supabaseSession) {
                try {
                    const sessionData = JSON.parse(supabaseSession);
                    token = sessionData?.access_token || sessionData?.[0]?.access_token || '';
                } catch {
                    token = supabaseSession;
                }
            }

            // 2. Upload video file to R2
            const formData = new FormData();
            formData.append('file', file);

            let videoUrl = '';

            if (token) {
                // Authenticated upload to R2
                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData,
                });
                const uploadData = await uploadRes.json();
                if (!uploadRes.ok) {
                    throw new Error(uploadData.error || 'Error al subir el archivo a R2.');
                }
                videoUrl = uploadData.url;
            } else {
                // Fallback: media/upload endpoint (no auth required)
                const mediaRes = await fetch('/api/media/upload', {
                    method: 'POST',
                    body: formData,
                });
                if (mediaRes.ok) {
                    const mediaData = await mediaRes.json();
                    videoUrl = mediaData.url || mediaData.videoUrl || '';
                }
                if (!videoUrl) {
                    throw new Error('No se encontró sesión activa. Cierra sesión y vuelve a entrar.');
                }
            }

            // 3. Register video in the database
            const handle = user.handle || `@${user.name}`;
            const videoRes = await fetch('/api/voz/videos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    videoUrl,
                    user: handle,
                    description: title || '',
                    thumbnailUrl: '',
                    isMuted: false,
                }),
            });

            const videoData = await videoRes.json();
            if (!videoRes.ok) {
                throw new Error(videoData.error || 'El vídeo se subió pero no se pudo registrar.');
            }

            setUploadedUrl(videoUrl);
            setStatus('success');

        } catch (err: any) {
            console.error('[Upload] Error:', err);
            setErrorMsg(err.message || 'Error desconocido al subir el vídeo.');
            setStatus('error');
        }
    };

    const fileType = file?.type.startsWith('audio') ? 'audio' : file?.type.startsWith('video') ? 'video' : null;

    return (
        <div style={{ backgroundColor: '#000', color: 'white', minHeight: '100dvh', width: '100%', paddingBottom: 'calc(70px + env(safe-area-inset-bottom, 0px))' }}>

            {/* Mobile Top Bar */}
            <div className="mobile-top-bar">
                <div style={{ width: '30px' }} />
                <span style={{ fontWeight: '700', fontSize: '15px' }}>Subir contenido</span>
                <div style={{ width: '30px' }} />
            </div>

            <div style={{ padding: '24px 20px', maxWidth: '500px', margin: '0 auto' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '6px' }}>
                    {status === 'success' ? '¡Publicado! 🎉' : 'Nueva publicación'}
                </h2>
                <p style={{ color: '#666', fontSize: '14px', marginBottom: '28px' }}>
                    {status === 'success' ? 'Tu contenido ya está disponible en VOZ.' : 'Comparte tu vídeo o audio con la comunidad.'}
                </p>

                {status === 'success' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '40px 20px', background: 'rgba(52,199,89,0.05)', border: '1px solid rgba(52,199,89,0.2)', borderRadius: '20px' }}>
                        <CheckCircle2 size={64} color="#34C759" />
                        <p style={{ color: '#34C759', fontWeight: '700', fontSize: '18px', margin: 0 }}>¡Publicado con éxito!</p>
                        {uploadedUrl && (
                            <video src={uploadedUrl} controls style={{ width: '100%', borderRadius: '12px', maxHeight: '300px', objectFit: 'contain', backgroundColor: '#111' }} />
                        )}
                        <button onClick={() => { setStatus('idle'); setFile(null); setTitle(''); setUploadedUrl(''); }} style={{
                            padding: '13px 28px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white', borderRadius: '14px', fontWeight: '600', cursor: 'pointer', fontSize: '15px'
                        }}>
                            Subir otro
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        {/* File Upload Area */}
                        <div
                            onClick={() => fileRef.current?.click()}
                            style={{
                                border: `2px dashed ${file ? 'rgba(142,45,226,0.6)' : 'rgba(255,255,255,0.1)'}`,
                                borderRadius: '20px',
                                padding: '40px 20px',
                                textAlign: 'center',
                                cursor: 'pointer',
                                background: file ? 'rgba(142,45,226,0.05)' : 'rgba(255,255,255,0.02)',
                                transition: 'all 0.2s',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '12px'
                            }}
                        >
                            {file ? (
                                <>
                                    {fileType === 'audio' ? <Music size={44} color="#8E2DE2" /> : <FileVideo size={44} color="#8E2DE2" />}
                                    <div>
                                        <p style={{ fontWeight: '700', fontSize: '15px', marginBottom: '4px', color: '#8E2DE2' }}>{file.name}</p>
                                        <p style={{ fontSize: '12px', color: '#666' }}>{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                                    </div>
                                    <span style={{ fontSize: '12px', color: '#555', textDecoration: 'underline' }}>Cambiar archivo</span>
                                </>
                            ) : (
                                <>
                                    <Upload size={40} color="#333" />
                                    <div>
                                        <p style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>Toca para seleccionar</p>
                                        <p style={{ fontSize: '13px', color: '#555' }}>Vídeo o audio · MP4, MOV, MP3, WAV</p>
                                    </div>
                                </>
                            )}
                        </div>
                        <input
                            ref={fileRef}
                            type="file"
                            accept="video/*,audio/*"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            style={{ display: 'none' }}
                        />

                        {/* Description */}
                        <textarea
                            placeholder="Escribe una descripción... #hashtag @mención"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            rows={3}
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                borderRadius: '14px',
                                border: '1px solid rgba(255,255,255,0.08)',
                                backgroundColor: 'rgba(255,255,255,0.04)',
                                color: 'white',
                                fontSize: '16px',
                                fontFamily: 'inherit',
                                resize: 'none',
                                outline: 'none',
                                boxSizing: 'border-box',
                            }}
                        />

                        {/* Error message */}
                        {status === 'error' && errorMsg && (
                            <div style={{
                                backgroundColor: 'rgba(255,59,48,0.1)',
                                border: '1px solid rgba(255,59,48,0.3)',
                                borderRadius: '12px',
                                padding: '12px 16px',
                                color: '#FF6B6B',
                                fontSize: '14px',
                            }}>
                                ⚠️ {errorMsg}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={!file || status === 'uploading'}
                            style={{
                                padding: '16px',
                                background: file ? 'linear-gradient(135deg, #8E2DE2, #4A00E0)' : 'rgba(255,255,255,0.06)',
                                color: file ? 'white' : '#333',
                                border: 'none', borderRadius: '14px',
                                fontWeight: '700', cursor: file ? 'pointer' : 'not-allowed',
                                fontSize: '16px', transition: 'all 0.2s',
                                boxShadow: file ? '0 4px 16px rgba(142,45,226,0.35)' : 'none',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                            }}
                        >
                            {status === 'uploading' ? (
                                <><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> Publicando...</>
                            ) : (
                                'Publicar en VOZ'
                            )}
                        </button>

                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </form>
                )}
            </div>

            <BottomNav />
        </div>
    );
}
