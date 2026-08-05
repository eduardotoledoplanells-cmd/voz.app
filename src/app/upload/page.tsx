"use client";
import { useState, useRef } from 'react';
import BottomNav from '../components/BottomNav';
import { Upload, Music, FileVideo, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function UploadPage() {
    const { user: authUser } = useAuth();
    const [title, setTitle] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [uploadedUrl, setUploadedUrl] = useState('');
    const [statusMsg, setStatusMsg] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    const compressWebVideo = async (inputFile: File): Promise<File> => {
        if (!inputFile.type.startsWith('video/') || inputFile.size <= 5 * 1024 * 1024) {
            return inputFile;
        }

        try {
            setStatusMsg('Optimizando y comprimiendo vídeo en el navegador (0%)...');
            console.log(`[WebCompressor] Iniciando compresión de ${inputFile.name} (${(inputFile.size / 1024 / 1024).toFixed(1)} MB)...`);

            return await new Promise((resolve) => {
                const video = document.createElement('video');
                video.preload = 'metadata';
                video.src = URL.createObjectURL(inputFile);
                video.muted = true;
                video.playsInline = true;

                const timeout = setTimeout(() => {
                    console.warn("[WebCompressor] Timeout en compresión, utilizando vídeo original.");
                    URL.revokeObjectURL(video.src);
                    resolve(inputFile);
                }, 40000);

                video.onloadedmetadata = async () => {
                    try {
                        let width = video.videoWidth || 1280;
                        let height = video.videoHeight || 720;
                        const duration = video.duration || 1;
                        const maxDim = 1280;

                        if (width > maxDim || height > maxDim) {
                            if (width > height) {
                                height = Math.round((height * maxDim) / width);
                                width = maxDim;
                            } else {
                                width = Math.round((width * maxDim) / height);
                                height = maxDim;
                            }
                        }

                        width = width - (width % 2);
                        height = height - (height % 2);

                        const canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');

                        if (!ctx) {
                            clearTimeout(timeout);
                            URL.revokeObjectURL(video.src);
                            return resolve(inputFile);
                        }

                        const stream = canvas.captureStream(30);
                        const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')
                            ? 'video/mp4;codecs=avc1'
                            : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
                            ? 'video/webm;codecs=vp9'
                            : 'video/webm';

                        const recorder = new MediaRecorder(stream, {
                            mimeType,
                            videoBitsPerSecond: 2500000
                        });

                        const chunks: Blob[] = [];
                        recorder.ondataavailable = (e) => {
                            if (e.data.size > 0) chunks.push(e.data);
                        };

                        recorder.onstop = () => {
                            clearTimeout(timeout);
                            URL.revokeObjectURL(video.src);
                            const blob = new Blob(chunks, { type: mimeType });
                            if (blob.size > 0 && blob.size < inputFile.size) {
                                console.log(`[WebCompressor] Compresión exitosa: ${(inputFile.size / 1024 / 1024).toFixed(1)} MB -> ${(blob.size / 1024 / 1024).toFixed(1)} MB`);
                                const ext = mimeType.includes('mp4') ? '.mp4' : '.webm';
                                const compressedFile = new File([blob], inputFile.name.replace(/\.[^/.]+$/, "") + "_opt" + ext, { type: mimeType });
                                resolve(compressedFile);
                            } else {
                                resolve(inputFile);
                            }
                        };

                        recorder.start();
                        await video.play();

                        const draw = () => {
                            if (!video.paused && !video.ended) {
                                const pct = Math.min(99, Math.round((video.currentTime / duration) * 100));
                                setStatusMsg(`Optimizando y comprimiendo vídeo en el navegador (${pct}%)...`);
                                ctx.drawImage(video, 0, 0, width, height);
                                requestAnimationFrame(draw);
                            } else {
                                setStatusMsg('Compresión completada (100%). Preparando envío...');
                                recorder.stop();
                            }
                        };
                        draw();
                    } catch (err) {
                        clearTimeout(timeout);
                        URL.revokeObjectURL(video.src);
                        resolve(inputFile);
                    }
                };

                video.onerror = () => {
                    clearTimeout(timeout);
                    URL.revokeObjectURL(video.src);
                    resolve(inputFile);
                };
            });
        } catch (e) {
            console.warn("[WebCompressor] Fallback a archivo original:", e);
            return inputFile;
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setStatus('uploading');
        setErrorMsg('');
        setStatusMsg('Subiendo vídeo a los servidores...');

        try {
            // 2. Get user from AuthContext or localStorage / sessionStorage
            let user = authUser;
            if (!user) {
                const storedUser = typeof window !== 'undefined' ? (localStorage.getItem('user') || sessionStorage.getItem('user')) : null;
                if (storedUser) {
                    try {
                        user = JSON.parse(storedUser);
                    } catch (e) {}
                }
            }

            if (!user) {
                throw new Error('Debes iniciar sesión para subir contenido.');
            }

            const rawHandle = user.handle || (user.name ? `@${user.name.toLowerCase().replace(/\s+/g, '')}` : '') || user.email?.split('@')[0] || 'usuario';
            const userHandle = rawHandle.startsWith('@') ? rawHandle : `@${rawHandle}`;
            const userId = user.id || (user as any).userId || userHandle;
            const userToken = (typeof window !== 'undefined' ? localStorage.getItem('token') || sessionStorage.getItem('token') : '') || '';

            const supabaseSession = typeof window !== 'undefined' ? (
                localStorage.getItem('supabase_session') ||
                localStorage.getItem('sb-thiftwzubmvcrdhuwcwm-auth-token')
            ) : null;

            let token = userToken;
            if (!token && supabaseSession) {
                try {
                    const sessionData = JSON.parse(supabaseSession);
                    token = sessionData?.access_token || sessionData?.[0]?.access_token || '';
                } catch {
                    token = typeof supabaseSession === 'string' ? supabaseSession : '';
                }
            }
            
            let videoUrl = '';

            // Try R2 Presigned Upload first, fallback to FormData media upload
            try {
                setStatusMsg('Generando enlace seguro de subida...');
                
                const uploadHeaders: Record<string, string> = {
                    'x-user-handle': userHandle,
                    'x-user-id': userId,
                    'Content-Type': 'application/json'
                };
                if (token) {
                    uploadHeaders['Authorization'] = `Bearer ${token}`;
                }

                const mimeType = file.type || 'video/mp4';

                const presignRes = await fetch('/api/upload/presign', {
                    method: 'POST',
                    headers: uploadHeaders,
                    body: JSON.stringify({
                        filename: file.name,
                        fileType: mimeType,
                        fileSize: file.size
                    }),
                });

                const presignText = await presignRes.text();
                let presignData: any = {};
                try { 
                    presignData = JSON.parse(presignText); 
                } catch (e) {
                    console.error('[Presign API Response parse error]:', presignText);
                }

                if (presignRes.ok && presignData.presignedUrl) {
                    setStatusMsg('Subiendo vídeo...');
                    const r2Res = await fetch(presignData.presignedUrl, {
                        method: 'PUT',
                        body: file,
                        headers: {
                            'Content-Type': mimeType
                        }
                    });

                    if (r2Res.ok) {
                        videoUrl = presignData.url;
                    } else {
                        const errTxt = await r2Res.text().catch(() => '');
                        console.error('[Upload] R2 upload status:', r2Res.status, errTxt);
                    }
                } else {
                    console.warn('[Upload] Presign non-ok:', presignRes.status, presignData);
                }
            } catch (presignErr) {
                console.warn('[Upload] R2 Presign failed, trying direct media upload fallback:', presignErr);
            }

            // Fallback: Direct FormData upload via /api/media/upload
            if (!videoUrl) {
                setStatusMsg('Subiendo archivo al servidor...');
                const formData = new FormData();
                formData.append('file', file);
                formData.append('subDir', 'videos');

                const fallbackHeaders: Record<string, string> = {
                    'x-user-handle': userHandle,
                    'x-user-id': userId
                };
                if (token) fallbackHeaders['Authorization'] = `Bearer ${token}`;

                const mediaRes = await fetch('/api/media/upload', {
                    method: 'POST',
                    headers: fallbackHeaders,
                    body: formData
                });

                const mediaData = await mediaRes.json();
                if (!mediaRes.ok || !mediaData.url) {
                    throw new Error(mediaData.error || mediaData.message || 'No se pudo subir el archivo. Inténtalo de nuevo.');
                }
                videoUrl = mediaData.url;
            }

            // 5. Register video in the database
            setStatusMsg('Registrando vídeo en LYVO...');
            const videoRes = await fetch('/api/voz/videos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    videoUrl,
                    user: userHandle,
                    description: title || '',
                    thumbnailUrl: '',
                    isMuted: false,
                }),
            });

            const videoText = await videoRes.text();
            let videoData: any = {};
            try {
                videoData = JSON.parse(videoText);
            } catch {
                console.error('[Video Register Response non-JSON]:', videoText);
            }

            if (!videoRes.ok) {
                throw new Error(videoData.error || 'El vídeo se subió pero no se pudo registrar en la base de datos.');
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
                    {status === 'success' ? 'Tu contenido ya está disponible en LYVO.' : 'Comparte tu vídeo o audio con la comunidad.'}
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
                            onChange={async (e) => {
                                const selectedFile = e.target.files?.[0] || null;
                                if (!selectedFile) return;

                                if (selectedFile.size > 1024 * 1024 * 1024) {
                                    setErrorMsg('Tu vídeo es demasiado pesado. El límite es de 1 GB.');
                                    setStatus('error');
                                    setFile(null);
                                    return;
                                }

                                if (selectedFile.type.startsWith('video/')) {
                                    const getVideoDuration = (f: File): Promise<number> => new Promise((resolve) => {
                                        const video = document.createElement('video');
                                        video.preload = 'metadata';
                                        video.src = URL.createObjectURL(f);
                                        video.onloadedmetadata = () => {
                                            URL.revokeObjectURL(video.src);
                                            resolve(video.duration);
                                        };
                                        video.onerror = () => {
                                            URL.revokeObjectURL(video.src);
                                            resolve(0);
                                        };
                                    });

                                    const duration = await getVideoDuration(selectedFile);
                                    
                                    let user = authUser;
                                    if (!user && typeof window !== 'undefined') {
                                        const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
                                        if (storedUser) {
                                            try { user = JSON.parse(storedUser); } catch (err) {}
                                        }
                                    }

                                    // Fetch fresh profile data to get latest custom_video_duration set by admin
                                    if (user && (user.id || user.handle)) {
                                        try {
                                            const query = user.id ? `id=${encodeURIComponent(user.id)}` : `handle=${encodeURIComponent(user.handle)}`;
                                            const profileRes = await fetch(`/api/voz/users/profile?${query}&t=${Date.now()}`);
                                            const profileData = await profileRes.json();
                                            if (profileData.success && profileData.user) {
                                                user = { ...user, ...profileData.user };
                                                if (typeof window !== 'undefined') {
                                                    localStorage.setItem('user', JSON.stringify(user));
                                                }
                                            }
                                        } catch (e) {
                                            console.warn('Failed to fetch fresh user profile limit:', e);
                                        }
                                    }

                                    let maxAllowed = 90;
                                    const customLimit = Number(
                                        user?.custom_video_duration ||
                                        user?.privacy_settings?.custom_video_duration ||
                                        user?.privacySettings?.custom_video_duration ||
                                        0
                                    );
                                    const followers = user?.followers_count || user?.followers || 0;
                                    
                                    if (customLimit > 0) {
                                        maxAllowed = customLimit;
                                    } else {
                                        if (followers >= 10000) maxAllowed = 600;
                                        else if (followers >= 5000) maxAllowed = 300;
                                        else if (followers >= 3000) maxAllowed = 150;
                                    }

                                    if (duration > maxAllowed + 0.5) {
                                        const limitStr = maxAllowed >= 60 ? (maxAllowed/60) + ' minutos' : maxAllowed + ' segundos';
                                        setErrorMsg(customLimit > 0
                                            ? `Tu límite especial configurado es de ${limitStr}. Tu vídeo dura ${(duration/60).toFixed(1)} minutos.`
                                            : `Necesitas más seguidores para subir vídeos de esta duración. Tu límite actual es de ${limitStr} por tener ${followers} seguidores.`
                                        );
                                        setStatus('error');
                                        setFile(null);
                                        return;
                                    }
                                }

                                setFile(selectedFile);
                                if (status === 'error') {
                                    setStatus('idle');
                                    setErrorMsg('');
                                }
                            }}
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
                                padding: '16px',
                                color: '#FF6B6B',
                                fontSize: '14px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px'
                            }}>
                                <span>⚠️ {errorMsg}</span>
                                {errorMsg.includes('iniciar sesión') && (
                                    <a
                                        href="/login"
                                        style={{
                                            display: 'inline-block',
                                            padding: '10px 16px',
                                            backgroundColor: '#8E2DE2',
                                            color: 'white',
                                            borderRadius: '8px',
                                            fontWeight: '700',
                                            textAlign: 'center',
                                            textDecoration: 'none'
                                        }}
                                    >
                                        Ir a Iniciar Sesión
                                    </a>
                                )}
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
                                <><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> {statusMsg || 'Publicando...'}</>
                            ) : (
                                'Publicar en LYVO'
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
