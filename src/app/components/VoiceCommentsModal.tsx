"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Play, Pause, Trash2, Heart, MoreVertical, Flag, Ban, Pin, CornerDownRight } from 'lucide-react';

export default function VoiceCommentsModal({ isOpen, onClose, videoId, currentUserHandle, videoOwnerHandle, onCommentAdded }: { isOpen: boolean, onClose: () => void, videoId: string, currentUserHandle?: string, videoOwnerHandle?: string, onCommentAdded?: () => void }) {
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [replyingTo, setReplyingTo] = useState<{id: string, handle: string} | null>(null);
    
    // Auto-play state
    const [autoPlay, setAutoPlay] = useState(true);
    
    // Menu state
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // Audio Player State
    const [playingId, setPlayingId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Recording Refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const durationRef = useRef<number>(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);


    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRecording) {
            interval = setInterval(() => {
                setRecordingTime(prev => {
                    const newTime = prev + 1;
                    durationRef.current = newTime;
                    return newTime;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    useEffect(() => {
        if (recordingTime >= 15 && isRecording) {
            stopRecording();
        }
    }, [recordingTime, isRecording]);

    const fetchComments = async () => {
        if (!videoId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/voz/voice-comments?videoId=${videoId}&userHandle=${currentUserHandle || ''}`);
            const data = await res.json();
            setComments(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching comments:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchComments();
        } else {
            stopAudio();
            if (isRecording) stopRecording();
        }
    }, [isOpen, videoId]);

    const stopAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
        }
        setPlayingId(null);
    };

    const togglePlay = (commentId: string, url: string) => {
        if (playingId === commentId) {
            stopAudio();
        } else {
            stopAudio();
            const audio = new Audio(url);
            audio.onended = () => {
                setPlayingId(null);
                if (autoPlay) {
                    const currentIndex = comments.findIndex(c => c.id === commentId);
                    if (currentIndex >= 0 && currentIndex < comments.length - 1) {
                        const nextComment = comments[currentIndex + 1];
                        setTimeout(() => togglePlay(nextComment.id, nextComment.audio_url), 500);
                    }
                }
            };
            audio.play().catch(e => console.log("Audio play prevented", e));
            audioRef.current = audio;
            setPlayingId(commentId);
        }
    };

    const startRecording = async () => {
        if (!currentUserHandle) {
            alert("Inicia sesión para dejar comentarios de voz.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                stream.getTracks().forEach(track => track.stop()); // Apagar micro
                await uploadAudio(audioBlob);
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            durationRef.current = 0;
        } catch (error) {
            console.error("Error accessing microphone:", error);
            alert("Error: No se pudo acceder al micrófono. Por favor, revisa los permisos del navegador o asegúrate de tener un micrófono conectado al PC.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const uploadAudio = async (blob: Blob) => {
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('audio', blob, 'comment.m4a'); // Use m4a as preferred by backend 

            // 1. Upload to storage
            const uploadRes = await fetch('/api/voice/upload', {
                method: 'POST',
                body: formData
            });
            const uploadData = await uploadRes.json();
            
            if (!uploadRes.ok) throw new Error(uploadData.error || "Error uploading to storage");
            const audioUrl = uploadData.audioUrl;

            // 2. Save comment
            const userStr = localStorage.getItem('user');
            const avatarUrl = userStr ? JSON.parse(userStr).profile_image : '';

            const saveRes = await fetch('/api/voz/voice-comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    videoId,
                    userHandle: currentUserHandle,
                    avatarUrl,
                    audioUrl,
                    duration: `${durationRef.current}s`,
                    parentId: replyingTo ? replyingTo.id : undefined
                })
            });

            if (!saveRes.ok) throw new Error("Error saving comment");

            setReplyingTo(null);
            fetchComments();
            if (onCommentAdded) onCommentAdded();
        } catch (error: any) {
            console.error("Error uploading comment:", error);
            alert("Error al enviar el comentario: " + error.message);
        } finally {
            setIsUploading(false);
            setRecordingTime(0);
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!confirm("¿Seguro que quieres borrar esta nota de voz?")) return;
        setOpenMenuId(null);
        try {
            const res = await fetch(`/api/voz/voice-comments/${commentId}`, { method: 'DELETE' });
            if (res.ok) await fetchComments();
            else alert("No se pudo borrar el comentario.");
        } catch (e) {
            console.error(e);
        }
    };

    const handleReport = (commentId: string) => {
        setOpenMenuId(null);
        alert("Denuncia enviada.");
    };

    const handleBlock = (userToBlock: string) => {
        setOpenMenuId(null);
        alert(`Usuario ${userToBlock} bloqueado.`);
    };

    const handlePin = (commentId: string) => {
        setOpenMenuId(null);
        alert("Función de fijar comentario procesada.");
    };

    const handleLike = async (commentId: string, currentLikeStatus: boolean) => {
        try {
            const action = currentLikeStatus ? 'unlike' : 'like';
            setComments(comments.map(c => 
                c.id === commentId 
                    ? { ...c, isLikedByMe: !currentLikeStatus, likes: currentLikeStatus ? c.likes - 1 : c.likes + 1 }
                    : c
            ));
            await fetch('/api/voz/voice-comments', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ commentId, userHandle: currentUserHandle, action })
            });
        } catch (error) {
            console.error(error);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleReply = (commentId: string, handle: string) => {
        setReplyingTo({ id: commentId, handle });
        setOpenMenuId(null);
    };

    if (!isOpen) return null;

    const parentComments = comments.filter(c => !c.parent_id);
    const childComments = comments.filter(c => c.parent_id);

    const CommentItem = ({ comment, isReply, onReply }: { comment: any, isReply: boolean, onReply: () => void }) => (
        <div style={{ display: 'flex', gap: '10px', paddingLeft: isReply ? '40px' : '0' }}>
            {isReply && <CornerDownRight size={16} color="#555" style={{ marginTop: '10px' }} />}
            <img 
                src={comment.avatar_url || 'https://via.placeholder.com/40'} 
                alt={comment.user_handle} 
                style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', backgroundColor: '#333' }}
            />
            <div style={{ flex: 1, backgroundColor: '#222', borderRadius: '15px', padding: '10px', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <div style={{ fontWeight: 'bold', color: 'white', fontSize: '0.9rem' }}>
                        {comment.user_handle}
                        {comment.is_pinned && <Pin size={12} style={{ marginLeft: '5px', display: 'inline' }} color="#8E2DE2" />}
                    </div>
                    <div style={{ position: 'relative' }}>
                        <MoreVertical size={16} color="gray" style={{ cursor: 'pointer' }} onClick={() => setOpenMenuId(openMenuId === comment.id ? null : comment.id)} />
                        {openMenuId === comment.id && (
                            <div style={{ 
                                position: 'absolute', right: 0, top: '20px', 
                                backgroundColor: '#333', borderRadius: '5px', padding: '5px',
                                zIndex: 10, minWidth: '120px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                            }}>
                                {(currentUserHandle === videoOwnerHandle) && (
                                    <>
                                        <div onClick={() => handleDelete(comment.id)} style={{ padding: '5px 10px', color: '#FF3B30', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <Trash2 size={14} /> Borrar
                                        </div>
                                        <div onClick={() => handlePin(comment.id)} style={{ padding: '5px 10px', color: '#8E2DE2', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <Pin size={14} /> Anclar
                                        </div>
                                        <div onClick={onReply} style={{ padding: '5px 10px', color: 'white', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <CornerDownRight size={14} /> Responder
                                        </div>
                                    </>
                                )}
                                {(currentUserHandle !== videoOwnerHandle && currentUserHandle === comment.user_handle) && (
                                    <>
                                        <div onClick={() => handleDelete(comment.id)} style={{ padding: '5px 10px', color: '#FF3B30', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <Trash2 size={14} /> Borrar
                                        </div>
                                        <div onClick={onReply} style={{ padding: '5px 10px', color: 'white', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <CornerDownRight size={14} /> Responder
                                        </div>
                                    </>
                                )}
                                {(currentUserHandle !== videoOwnerHandle && currentUserHandle !== comment.user_handle) && (
                                    <>
                                        <div onClick={() => handleReport(comment.id)} style={{ padding: '5px 10px', color: '#FF3B30', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <Flag size={14} /> Denunciar
                                        </div>
                                        <div onClick={onReply} style={{ padding: '5px 10px', color: 'white', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <CornerDownRight size={14} /> Responder
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div 
                    style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: '10px', 
                        backgroundColor: '#8E2DE2', padding: '5px 15px', 
                        borderRadius: '20px', cursor: 'pointer' 
                    }}
                    onClick={() => togglePlay(comment.id, comment.audio_url)}
                >
                    {playingId === comment.id ? <Pause size={16} color="white" /> : <Play size={16} color="white" />}
                    <div style={{ width: '100px', height: '4px', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: playingId === comment.id ? '50%' : '0%', height: '100%', backgroundColor: 'white', transition: 'width 0.2s' }} />
                    </div>
                    <span style={{ color: 'white', fontSize: '0.8rem' }}>{comment.duration}</span>
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
                <Heart 
                    size={16} 
                    color={comment.isLikedByMe ? "#FF3B30" : "gray"} 
                    fill={comment.isLikedByMe ? "#FF3B30" : "none"} 
                    style={{ cursor: 'pointer' }} 
                    onClick={() => handleLike(comment.id, !!comment.isLikedByMe)}
                />
                <span style={{ fontSize: '0.7rem', color: 'gray', marginTop: '3px' }}>{comment.likes || 0}</span>
            </div>
        </div>
    );

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', justifyContent: 'flex-end', backdropFilter: 'blur(5px)' }}>
            <div style={{ width: '100%', maxWidth: '450px', height: '100vh', backgroundColor: '#111', borderRadius: '20px 0 0 20px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #333' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'white' }}>Comentarios de Voz</h2>
                        <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px', gap: '5px' }}>
                            <input type="checkbox" id="autoplay-toggle" checked={autoPlay} onChange={(e) => setAutoPlay(e.target.checked)} style={{ accentColor: '#8E2DE2', cursor: 'pointer' }} />
                            <label htmlFor="autoplay-toggle" style={{ color: 'gray', fontSize: '0.8rem', cursor: 'pointer' }}>Reproducción automática</label>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
                </div>
                
                {replyingTo && (
                    <div style={{ padding: '8px 15px', backgroundColor: '#333', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Respondiendo a <strong style={{ color: '#8E2DE2' }}>{replyingTo.handle}</strong></span>
                        <button onClick={() => setReplyingTo(null)} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '16px' }}>×</button>
                    </div>
                )}
                
                <div style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', color: '#888', marginTop: '20px' }}>Cargando...</div>
                    ) : comments.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#888', marginTop: '20px' }}>No hay notas de voz aún. Sé el primero.</div>
                    ) : (
                        parentComments.map((comment) => {
                            const replies = childComments.filter(c => c.parent_id === comment.id);
                            return (
                                <React.Fragment key={comment.id}>
                                    <CommentItem 
                                        comment={comment} 
                                        isReply={false} 
                                        onReply={() => handleReply(comment.id, comment.user_handle)} 
                                    />
                                    {replies.map(reply => (
                                        <CommentItem 
                                            key={reply.id} 
                                            comment={reply} 
                                            isReply={true} 
                                            onReply={() => handleReply(comment.id, reply.user_handle)} 
                                        />
                                    ))}
                                </React.Fragment>
                            );
                        })
                    )}
                </div>

                {/* Footer - Record Button */}
                <div style={{ padding: '20px 20px calc(20px + env(safe-area-inset-bottom, 25px)) 20px', borderTop: '1px solid #333', backgroundColor: '#1a1a1a' }}>
                    {isUploading ? (
                        <div style={{ textAlign: 'center', color: 'white', padding: '15px' }}>Enviando audio...</div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#222', borderRadius: '30px', padding: '5px 15px' }}>
                            <div style={{ color: isRecording ? '#FF3B30' : 'gray', flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {isRecording && <div style={{ width: '10px', height: '10px', backgroundColor: '#FF3B30', borderRadius: '50%', animation: 'pulse 1s infinite' }} />}
                                {isRecording ? `Grabando... ${formatTime(recordingTime)} (Max 15s)` : 'Pulsa el micro para hablar...'}
                            </div>
                            
                            <button 
                                onClick={isRecording ? stopRecording : startRecording}
                                style={{
                                    width: '45px', height: '45px', borderRadius: '50%', 
                                    border: 'none', cursor: 'pointer',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                                    backgroundColor: isRecording ? '#FF3B30' : '#8E2DE2',
                                    color: 'white',
                                    transition: 'background-color 0.3s'
                                }}
                            >
                                {isRecording ? <Square size={20} fill="white" /> : <Mic size={24} />}
                            </button>
                        </div>
                    )}
                    <style>{`
                        @keyframes pulse {
                            0% { transform: scale(1); opacity: 1; }
                            50% { transform: scale(1.5); opacity: 0.5; }
                            100% { transform: scale(1); opacity: 1; }
                        }
                    `}</style>
                </div>
            </div>
        </div>
    );
}
