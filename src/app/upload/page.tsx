"use client";
import { useState, useRef } from 'react';
import BottomNav from '../components/BottomNav';
import { Upload, Music, FileVideo, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { VideoEditor, EditorSettings } from '../components/VideoEditor';

export default function UploadPage() {
    const { user: authUser } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [uploadedUrl, setUploadedUrl] = useState('');
    const [statusMsg, setStatusMsg] = useState('');
    const [showEditor, setShowEditor] = useState(false);
    const [editorSettings, setEditorSettings] = useState<EditorSettings | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const compressWebVideo = async (inputFile: File, settings: EditorSettings | null): Promise<File> => {
        if (!settings && (!inputFile.type.startsWith('video/') || inputFile.size <= 5 * 1024 * 1024)) {
            return inputFile;
        }

        try {
            setStatusMsg('Procesando vídeo en el navegador (0%)...');
            console.log(`[WebCompressor] Iniciando compresión de ${inputFile.name}...`);

            return await new Promise((resolve) => {
                const video = document.createElement('video');
                video.preload = 'metadata';
                video.src = URL.createObjectURL(inputFile);
                video.muted = false; // Need it unmuted to capture audio, but we won't connect it to output unless we want it playing
                video.playsInline = true;

                const timeout = setTimeout(() => {
                    console.warn("[WebCompressor] Timeout en compresión, utilizando vídeo original.");
                    URL.revokeObjectURL(video.src);
                    resolve(inputFile);
                }, 60000);

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

                        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                        const dest = audioCtx.createMediaStreamDestination();
                        let hasAudio = false;

                        if (!settings?.isMuted) {
                            try {
                                const source = audioCtx.createMediaElementSource(video);
                                source.connect(dest);
                                hasAudio = true;
                            } catch (e) {
                                console.warn('[WebCompressor] Cannot create media element source', e);
                            }
                        } else {
                            video.muted = true;
                        }

                        if (settings?.selectedMusic) {
                            try {
                                const response = await fetch(settings.selectedMusic.previewUrl);
                                const arrayBuffer = await response.arrayBuffer();
                                const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                                const source = audioCtx.createBufferSource();
                                source.buffer = audioBuffer;
                                source.loop = true;
                                
                                const gainNode = audioCtx.createGain();
                                gainNode.gain.value = settings.musicVolume !== undefined ? settings.musicVolume : 0.5;
                                
                                source.connect(gainNode);
                                gainNode.connect(dest);
                                
                                source.start(0);
                                hasAudio = true;
                            } catch (e) {
                                console.warn('[WebCompressor] Could not load background music:', e);
                            }
                        }

                        const videoStream = canvas.captureStream(30);
                        const streamTracks = [videoStream.getVideoTracks()[0]];
                        if (hasAudio && dest.stream.getAudioTracks().length > 0) {
                            streamTracks.push(dest.stream.getAudioTracks()[0]);
                        }
                        const stream = new MediaStream(streamTracks);

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
                            if (audioCtx.state !== 'closed') audioCtx.close();
                            const blob = new Blob(chunks, { type: mimeType });
                            if (blob.size > 0) {
                                console.log(`[WebCompressor] Compresión exitosa: ${(inputFile.size / 1024 / 1024).toFixed(1)} MB -> ${(blob.size / 1024 / 1024).toFixed(1)} MB`);
                                const ext = mimeType.includes('mp4') ? '.mp4' : '.webm';
                                const compressedFile = new File([blob], inputFile.name.replace(/\.[^/.]+$/, "") + "_opt" + ext, { type: mimeType });
                                resolve(compressedFile);
                            } else {
                                resolve(inputFile);
                            }
                        };

                        const startTime = settings ? (duration * settings.trimRange[0] / 100) : 0;
                        const endTime = settings ? (duration * settings.trimRange[1] / 100) : duration;
                        video.currentTime = startTime;

                        recorder.start();
                        await video.play().catch(() => {
                            // Autoplay block fallback
                            video.muted = true;
                            return video.play();
                        });

                        const draw = () => {
                            if (!video.paused && !video.ended && video.currentTime <= endTime) {
                                const pct = Math.min(99, Math.round(((video.currentTime - startTime) / (endTime - startTime)) * 100));
                                setStatusMsg(`Procesando vídeo en el navegador (${pct}%)...`);
                                
                                if (settings?.selectedFilter && settings.selectedFilter.id !== 'none') {
                                    if (settings.selectedFilter.id === 'bw') ctx.filter = 'grayscale(100%)';
                                    else if (settings.selectedFilter.id === 'sepia') ctx.filter = 'sepia(100%)';
                                    else if (settings.selectedFilter.id === 'vintage') ctx.filter = 'sepia(50%) contrast(1.2)';
                                    else ctx.filter = `brightness(${settings.filterBrightness * 2}) contrast(${1 + settings.filterIntensity})`;
                                } else {
                                    ctx.filter = 'none';
                                }
                                
                                ctx.drawImage(video, 0, 0, width, height);
                                
                                if (settings?.selectedFilter?.color && settings.selectedFilter.color !== 'transparent') {
                                    ctx.fillStyle = settings.selectedFilter.color;
                                    ctx.fillRect(0, 0, width, height);
                                }
                                
                                requestAnimationFrame(draw);
                            } else {
                                setStatusMsg('Procesamiento completado (100%). Preparando envío...');
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

    const generateVideoThumbnail = async (videoFile: File): Promise<Blob | null> => {
        return new Promise((resolve) => {
            try {
                if (!videoFile.type.startsWith('video/')) {
                    return resolve(null);
                }
                const video = document.createElement('video');
                video.preload = 'metadata';
                video.muted = true;
                video.playsInline = true;
                const objectUrl = URL.createObjectURL(videoFile);
                video.src = objectUrl;

                let resolved = false;
                const timeout = setTimeout(() => {
                    if (!resolved) {
                        resolved = true;
                        URL.revokeObjectURL(objectUrl);
                        resolve(null);
                    }
                }, 6000);

                video.onloadedmetadata = () => {
                    const targetTime = Math.min(1.0, video.duration > 2 ? video.duration * 0.1 : 0.5);
                    video.currentTime = targetTime;
                };

                video.onseeked = () => {
                    if (resolved) return;
                    try {
                        const canvas = document.createElement('canvas');
                        canvas.width = video.videoWidth || 640;
                        canvas.height = video.videoHeight || 360;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                            canvas.toBlob((blob) => {
                                resolved = true;
                                clearTimeout(timeout);
                                URL.revokeObjectURL(objectUrl);
                                resolve(blob);
                            }, 'image/jpeg', 0.85);
                        } else {
                            resolved = true;
                            clearTimeout(timeout);
                            URL.revokeObjectURL(objectUrl);
                            resolve(null);
                        }
                    } catch (e) {
                        console.warn('[Thumbnail Capture Canvas Error]:', e);
                        if (!resolved) {
                            resolved = true;
                            clearTimeout(timeout);
                            URL.revokeObjectURL(objectUrl);
                            resolve(null);
                        }
                    }
                };

                video.onerror = () => {
                    if (!resolved) {
                        resolved = true;
                        clearTimeout(timeout);
                        URL.revokeObjectURL(objectUrl);
                        resolve(null);
                    }
                };
            } catch (e) {
                console.warn('[Thumbnail Capture Setup Error]:', e);
                resolve(null);
            }
        });
    };

    const executeUpload = async (uploadFile: File, settings: EditorSettings | null) => {
        if (!uploadFile) return;

        setStatus('uploading');
        setErrorMsg('');
        setStatusMsg('Subiendo vídeo a los servidores...');

        try {
            let user = authUser;
            if (!user) {
                const storedUser = typeof window !== 'undefined' ? (localStorage.getItem('user') || sessionStorage.getItem('user')) : null;
                if (storedUser) {
                    try {
                        user = JSON.parse(storedUser);
                    } catch {
                        user = null;
                    }
                }
            }

            if (!user) {
                throw new Error('Debes iniciar sesión para subir contenido.');
            }

            const userHandle = user.handle || (user.name ? `@${user.name.toLowerCase().replace(/\s+/g, '')}` : '') || user.email?.split('@')[0] || 'usuario';
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

            let finalFile = uploadFile;
            if (uploadFile.type.startsWith('video/')) {
                finalFile = await compressWebVideo(uploadFile, settings);
            }

            setStatusMsg('Generando enlace seguro de subida...');
            const mimeType = finalFile.type || 'video/mp4';

            const presignRes = await fetch('/api/upload/presign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: finalFile.name,
                    contentType: mimeType
                })
            });

            const presignData = await presignRes.json();
            if (!presignRes.ok || !presignData.success || !presignData.presignedUrl) {
                throw new Error(presignData.error || 'No se pudo generar la clave de subida');
            }

            setStatusMsg('Subiendo archivo directamente a Cloudflare R2...');
            try {
                const uploadRes = await fetch(presignData.presignedUrl, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': mimeType,
                    },
                    body: finalFile
                });

                if (!uploadRes.ok) {
                    const errText = await uploadRes.text().catch(() => '');
                    console.error('[Upload R2 Error]:', uploadRes.status, errText);
                    throw new Error(`Fallo al subir el archivo a Cloudflare R2 (${uploadRes.status}).`);
                }

                videoUrl = presignData.publicUrl;
            } catch (r2Err: any) {
                console.warn('[R2 Direct Upload Fetch Warning]:', r2Err);
                if (presignData.supabaseSignedUrl) {
                    setStatusMsg('Subiendo vídeo...');
                    const supaRes = await fetch(presignData.supabaseSignedUrl, {
                        method: 'PUT',
                        headers: { 'Content-Type': mimeType },
                        body: finalFile
                    });
                    if (supaRes.ok) {
                        videoUrl = presignData.supabasePublicUrl || presignData.publicUrl;
                    }
                }

                if (!videoUrl) {
                    throw new Error('Error de red al conectar con Cloudflare R2 (Failed to fetch). Asegúrate de guardar la política CORS en el panel de Cloudflare.');
                }
            }

            let generatedThumbnailUrl = '';
            if (uploadFile.type.startsWith('video/')) {
                setStatusMsg('Generando fotograma automático para la carátula...');
                try {
                    const thumbBlob = await generateVideoThumbnail(finalFile);
                    if (thumbBlob) {
                        const sanitizedBase = finalFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                        const thumbFileName = `thumb_${Date.now()}_${sanitizedBase}.jpg`;
                        const thumbPresignRes = await fetch('/api/upload/presign', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                filename: thumbFileName,
                                contentType: 'image/jpeg'
                            })
                        });
                        const thumbPresignData = await thumbPresignRes.json();
                        if (thumbPresignData.success) {
                            const targetUploadUrl = thumbPresignData.supabaseSignedUrl || thumbPresignData.presignedUrl;
                            if (targetUploadUrl) {
                                const thumbUpRes = await fetch(targetUploadUrl, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'image/jpeg' },
                                    body: thumbBlob
                                });
                                if (thumbUpRes.ok) {
                                    generatedThumbnailUrl = thumbPresignData.supabasePublicUrl || thumbPresignData.publicUrl;
                                    console.log('✅ Carátula de vídeo generada con éxito:', generatedThumbnailUrl);
                                }
                            }
                        }
                    }
                } catch (thumbErr) {
                    console.warn('[Automatic Thumbnail Generation Warning]:', thumbErr);
                }
            }

            setStatusMsg('Registrando vídeo en LYVO...');
            const videoRes = await fetch('/api/voz/videos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    videoUrl,
                    user: userHandle,
                    description: settings?.description || 'Mi nuevo vídeo',
                    thumbnailUrl: generatedThumbnailUrl,
                    isMuted: settings?.isMuted || false,
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

            {showEditor && file && (
                <VideoEditor 
                    file={file} 
                    onApply={(settings) => {
                        setShowEditor(false);
                        executeUpload(file, settings);
                    }}
                    onCancel={() => {
                        setFile(null);
                        setShowEditor(false);
                    }}
                />
            )}

            {/* Mobile Top Bar */}
            <div className="mobile-top-bar">
                <div style={{ width: '30px' }} />
                <span style={{ fontWeight: '700', fontSize: '15px' }}>Subir contenido</span>
                <div style={{ width: '30px' }} />
            </div>

            <div style={{ padding: '12px 20px', maxWidth: '500px', margin: '0 auto' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '6px' }}>
                    {status === 'success' ? '¡Publicado! 🎉' : 'Nueva publicación'}
                </h2>
                <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
                    {status === 'success' ? 'Tu contenido ya está disponible en LYVO.' : 'Comparte tu vídeo o audio con la comunidad.'}
                </p>

                {status === 'success' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '40px 20px', background: 'rgba(52,199,89,0.05)', border: '1px solid rgba(52,199,89,0.2)', borderRadius: '20px' }}>
                        <CheckCircle2 size={64} color="#34C759" />
                        <p style={{ color: '#34C759', fontWeight: '700', fontSize: '18px', margin: 0 }}>¡Publicado con éxito!</p>
                        {uploadedUrl && (
                            <video src={uploadedUrl} controls style={{ width: '100%', borderRadius: '12px', maxHeight: '300px', objectFit: 'contain', backgroundColor: '#111' }} />
                        )}
                        <button onClick={() => { setStatus('idle'); setFile(null); setUploadedUrl(''); }} style={{
                            padding: '13px 28px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white', borderRadius: '14px', fontWeight: '600', cursor: 'pointer', fontSize: '15px'
                        }}>
                            Subir otro
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        {/* File Upload Area */}
                        <div
                            onClick={() => fileRef.current?.click()}
                            style={{
                                border: `2px dashed ${file ? 'rgba(142,45,226,0.6)' : 'rgba(255,255,255,0.1)'}`,
                                borderRadius: '20px',
                                padding: '24px 20px',
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
                                if (selectedFile.type.startsWith('video/')) {
                                    setShowEditor(true);
                                }
                                if (status === 'error') {
                                    setStatus('idle');
                                    setErrorMsg('');
                                }
                            }}
                            style={{ display: 'none' }}
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

                        {status === 'uploading' && (
                            <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                                <Loader2 size={32} color="#8E2DE2" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
                                <div style={{ color: 'white', fontWeight: 'bold' }}>{statusMsg}</div>
                            </div>
                        )}
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
}
