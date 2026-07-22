"use client";
import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import BottomNav from '../components/BottomNav';
import { Send, ArrowLeft, MessageSquare, RefreshCw, User as UserIcon, Lock, Sparkles } from 'lucide-react';

function MessagesPageContent() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const targetHandleParam = searchParams.get('handle') || searchParams.get('creatorHandle');
    const targetEscrowParam = searchParams.get('escrowId');

    const [conversations, setConversations] = useState<any[]>([]);
    const [activeEscrow, setActiveEscrow] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');

    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const [startNewChatUser, setStartNewChatUser] = useState<any>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const myHandle = user?.handle || (user?.name ? `@${user.name}` : '');

    // 1. Redireccionar si no está autenticado
    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    // 2. Cargar lista de conversaciones
    const fetchConversations = useCallback(async (showLoading = false) => {
        if (!myHandle) return;
        if (showLoading) setLoadingConversations(true);

        try {
            const token = localStorage.getItem('token') || '';
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`/api/voz/pm?userHandle=${encodeURIComponent(myHandle)}&t=${Date.now()}`, { headers });
            const data = await res.json();
            if (Array.isArray(data)) {
                setConversations(data);
                
                // Si venimos con escrowId específico en los parámetros
                if (targetEscrowParam && !activeEscrow) {
                    const found = data.find((e: any) => String(e.id) === String(targetEscrowParam));
                    if (found) {
                        setActiveEscrow(found);
                    }
                }
                
                // Si venimos con un handle específico para iniciar conversación
                if (targetHandleParam && targetHandleParam !== myHandle && !activeEscrow && !startNewChatUser) {
                    const existing = data.find((e: any) => 
                        e.sender_handle?.toLowerCase() === targetHandleParam.toLowerCase() || 
                        e.creator_handle?.toLowerCase() === targetHandleParam.toLowerCase()
                    );
                    if (existing) {
                        setActiveEscrow(existing);
                    } else {
                        // Buscar datos del usuario de destino
                        fetch(`/api/voz/users/profile?handle=${encodeURIComponent(targetHandleParam)}`)
                            .then(r => r.json())
                            .then(profileData => {
                                if (profileData.user) {
                                    setStartNewChatUser(profileData.user);
                                }
                            })
                            .catch(console.error);
                    }
                }
            }
        } catch (err) {
            console.error("Error fetching conversations:", err);
        } finally {
            setLoadingConversations(false);
        }
    }, [myHandle, targetEscrowParam, targetHandleParam, activeEscrow, startNewChatUser]);

    useEffect(() => {
        if (user && myHandle) {
            fetchConversations(true);
        }
    }, [user, myHandle, fetchConversations]);

    // 3. Cargar mensajes del chat activo
    const fetchMessages = useCallback(async (escrowId: string, showLoading = false) => {
        if (!myHandle || !escrowId) return;
        if (showLoading) setLoadingMessages(true);

        try {
            const token = localStorage.getItem('token') || '';
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`/api/voz/pm?escrowId=${encodeURIComponent(escrowId)}&userHandle=${encodeURIComponent(myHandle)}&t=${Date.now()}`, { headers });
            const data = await res.json();
            if (Array.isArray(data)) {
                setMessages(data);
            }
        } catch (err) {
            console.error("Error fetching messages:", err);
        } finally {
            setLoadingMessages(false);
        }
    }, [myHandle]);

    useEffect(() => {
        if (activeEscrow?.id) {
            setStartNewChatUser(null);
            fetchMessages(activeEscrow.id, true);

            // Polling cada 4 segundos para actualizar chat activo
            const interval = setInterval(() => {
                fetchMessages(activeEscrow.id, false);
            }, 4000);

            return () => clearInterval(interval);
        }
    }, [activeEscrow, fetchMessages]);

    // Scroll al final al recibir o enviar mensaje
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 4. Enviar Mensaje
    const handleSendMessage = async () => {
        if (!inputText.trim() || sending) return;
        setSending(true);
        setErrorMessage('');

        const textToSend = inputText.trim();
        setInputText('');

        try {
            const token = localStorage.getItem('token') || '';
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            if (activeEscrow) {
                // Responder en un chat existente
                const res = await fetch('/api/voz/pm', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        action: 'reply',
                        escrowId: activeEscrow.id,
                        content: textToSend,
                        idempotencyKey: `pm-reply-${user.id}-${activeEscrow.id}-${Date.now()}`
                    })
                });

                const data = await res.json();
                if (data.success) {
                    await fetchMessages(activeEscrow.id, false);
                    fetchConversations(false);
                } else {
                    setErrorMessage(data.error || "No se pudo enviar el mensaje.");
                    setInputText(textToSend); // Restaurar el texto
                }
            } else if (startNewChatUser) {
                // Iniciar un nuevo chat
                const res = await fetch('/api/voz/pm', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        action: 'start',
                        creatorHandle: startNewChatUser.handle,
                        message: textToSend,
                        idempotencyKey: `pm-start-${user.id}-${startNewChatUser.id || startNewChatUser.handle}-${Date.now()}`
                    })
                });

                const data = await res.json();
                if (data.success) {
                    setStartNewChatUser(null);
                    await fetchConversations(true);
                    if (data.escrowId) {
                        const newEscrow = {
                            id: data.escrowId,
                            sender_handle: myHandle,
                            creator_handle: startNewChatUser.handle,
                            creator_name: startNewChatUser.name,
                            creator_avatar: startNewChatUser.profileImage || startNewChatUser.profile_image
                        };
                        setActiveEscrow(newEscrow);
                    }
                } else {
                    setErrorMessage(data.error || "No se pudo iniciar el chat.");
                    setInputText(textToSend);
                }
            }
        } catch (err) {
            console.error("Error sending message:", err);
            setErrorMessage("Error de conexión al enviar el mensaje.");
            setInputText(textToSend);
        } finally {
            setSending(false);
        }
    };

    if (isLoading || !user) {
        return (
            <div style={{ backgroundColor: '#000', color: 'white', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                Cargando mensajes...
            </div>
        );
    }

    const otherUser = activeEscrow ? (
        activeEscrow.sender_handle === myHandle ? {
            handle: activeEscrow.creator_handle,
            name: activeEscrow.creator_name || activeEscrow.creator_handle?.replace('@', ''),
            avatar: activeEscrow.creator_avatar
        } : {
            handle: activeEscrow.sender_handle,
            name: activeEscrow.sender_name || activeEscrow.sender_handle?.replace('@', ''),
            avatar: activeEscrow.sender_avatar
        }
    ) : (startNewChatUser ? {
        handle: startNewChatUser.handle,
        name: startNewChatUser.name || startNewChatUser.handle?.replace('@', ''),
        avatar: startNewChatUser.profileImage || startNewChatUser.profile_image
    } : null);

    return (
        <div style={{ backgroundColor: '#000', color: 'white', minHeight: '100vh', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '450px', borderLeft: '1px solid #111', borderRight: '1px solid #111', minHeight: '100vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', paddingBottom: '70px', position: 'relative' }}>
                
                {/* Header */}
                <div style={{ padding: '15px 20px', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#000', position: 'sticky', top: 0, zIndex: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {(activeEscrow || startNewChatUser) ? (
                            <button 
                                onClick={() => { setActiveEscrow(null); setStartNewChatUser(null); }}
                                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                            >
                                <ArrowLeft size={22} />
                            </button>
                        ) : (
                            <button 
                                onClick={() => router.back()}
                                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                            >
                                <ArrowLeft size={22} />
                            </button>
                        )}

                        {otherUser ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ 
                                    width: '36px', height: '36px', borderRadius: '50%', 
                                    backgroundColor: '#8E2DE2', display: 'flex', justifyContent: 'center', alignItems: 'center',
                                    fontWeight: 'bold', overflow: 'hidden', backgroundImage: otherUser.avatar ? `url(${otherUser.avatar})` : 'none', backgroundSize: 'cover'
                                }}>
                                    {!otherUser.avatar && (otherUser.name ? otherUser.name.charAt(0).toUpperCase() : '?')}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{otherUser.name}</div>
                                    <div style={{ color: '#888', fontSize: '12px' }}>{otherUser.handle}</div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <MessageSquare size={22} color="#8E2DE2" />
                                <span style={{ fontWeight: 'bold', fontSize: '18px' }}>Mensajes Privados</span>
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={() => fetchConversations(true)}
                        style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>

                {/* Contenido Principal */}
                {(!activeEscrow && !startNewChatUser) ? (
                    /* LISTA DE CONVERSACIONES */
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {loadingConversations ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888' }}>
                                Cargando chats...
                            </div>
                        ) : conversations.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
                                <MessageSquare size={48} color="#444" style={{ marginBottom: '15px' }} />
                                <h3 style={{ color: '#eee', margin: '0 0 8px 0' }}>Tu bandeja está vacía</h3>
                                <p style={{ fontSize: '14px', maxWidth: '280px', margin: '0 auto', color: '#888' }}>
                                    Visita el perfil de cualquier creador para iniciar un chat privado.
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {conversations.map((c: any) => {
                                    const isSender = c.sender_handle === myHandle;
                                    const name = isSender ? c.creator_name : c.sender_name;
                                    const handle = isSender ? c.creator_handle : c.sender_handle;
                                    const avatar = isSender ? c.creator_avatar : c.sender_avatar;
                                    const hasNew = c.hasNew || c.unread_count > 0;

                                    return (
                                        <div 
                                            key={c.id}
                                            onClick={() => setActiveEscrow(c)}
                                            style={{ 
                                                display: 'flex', alignItems: 'center', gap: '12px', padding: '15px 20px', 
                                                borderBottom: '1px solid #1a1a1a', cursor: 'pointer',
                                                backgroundColor: hasNew ? 'rgba(142, 45, 226, 0.08)' : 'transparent',
                                                transition: 'background-color 0.2s'
                                            }}
                                        >
                                            <div style={{ 
                                                width: '48px', height: '48px', borderRadius: '50%', 
                                                backgroundColor: '#8E2DE2', display: 'flex', justifyContent: 'center', alignItems: 'center',
                                                fontWeight: 'bold', fontSize: '18px', flexShrink: 0,
                                                backgroundImage: avatar ? `url(${avatar})` : 'none', backgroundSize: 'cover'
                                            }}>
                                                {!avatar && (name ? name.charAt(0).toUpperCase() : '?')}
                                            </div>

                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: hasNew ? 'bold' : '600', color: 'white', fontSize: '15px' }}>
                                                        {name || handle}
                                                    </span>
                                                    <span style={{ fontSize: '11px', color: '#666' }}>
                                                        {c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                                    <span style={{ color: hasNew ? '#8E2DE2' : '#888', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {handle}
                                                    </span>
                                                    {hasNew && (
                                                        <span style={{ 
                                                            backgroundColor: '#8E2DE2', color: 'white', borderRadius: '10px', 
                                                            padding: '2px 8px', fontSize: '11px', fontWeight: 'bold' 
                                                        }}>
                                                            {c.unread_count || 1}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    /* CHAT ACTIVO DE MENSAJES */
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 130px)' }}>
                        <div style={{ flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {loadingMessages ? (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>Cargando conversación...</div>
                            ) : messages.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
                                    <Sparkles size={32} color="#8E2DE2" style={{ marginBottom: '10px' }} />
                                    <p style={{ margin: 0 }}>Escribe tu primer mensaje para empezar la conversación.</p>
                                </div>
                            ) : (
                                messages.map((m: any) => {
                                    const isMine = m.sender_handle === myHandle;
                                    return (
                                        <div 
                                            key={m.id || m.created_at} 
                                            style={{ 
                                                display: 'flex', 
                                                justifyContent: isMine ? 'flex-end' : 'flex-start',
                                                marginBottom: '4px'
                                            }}
                                        >
                                            <div style={{ 
                                                maxWidth: '75%', 
                                                padding: '10px 14px', 
                                                borderRadius: isMine ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                                                background: isMine ? 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)' : '#262626',
                                                color: 'white',
                                                fontSize: '14px',
                                                lineHeight: '1.4',
                                                wordBreak: 'break-word',
                                                boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                                            }}>
                                                {m.content}
                                                <div style={{ fontSize: '10px', color: isMine ? 'rgba(255,255,255,0.7)' : '#888', marginTop: '4px', textAlign: 'right' }}>
                                                    {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Error Alert */}
                        {errorMessage && (
                            <div style={{ padding: '8px 15px', backgroundColor: 'rgba(211, 47, 47, 0.2)', borderLeft: '3px solid #d32f2f', color: '#ff6b6b', fontSize: '13px', margin: '0 15px 10px 15px', borderRadius: '4px' }}>
                                {errorMessage}
                            </div>
                        )}

                        {/* Input Footer */}
                        <div style={{ padding: '10px 15px', borderTop: '1px solid #222', backgroundColor: '#111', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input 
                                type="text" 
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                                placeholder="Escribe un mensaje..."
                                style={{ 
                                    flex: 1, backgroundColor: '#222', color: 'white', border: '1px solid #333', 
                                    borderRadius: '20px', padding: '10px 15px', fontSize: '14px', outline: 'none' 
                                }}
                            />
                            <button 
                                onClick={handleSendMessage}
                                disabled={sending || !inputText.trim()}
                                style={{ 
                                    width: '40px', height: '40px', borderRadius: '50%', 
                                    background: inputText.trim() ? 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)' : '#333', 
                                    color: 'white', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', 
                                    cursor: inputText.trim() ? 'pointer' : 'default', opacity: sending ? 0.6 : 1 
                                }}
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                )}

                <BottomNav />
            </div>
        </div>
    );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={<div style={{ backgroundColor: '#000', color: 'white', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Cargando bandeja de entrada...</div>}>
            <MessagesPageContent />
        </Suspense>
    );
}
