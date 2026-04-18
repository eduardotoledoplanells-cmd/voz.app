'use client';
import { useState, useEffect } from 'react';
import '98.css';

export default function SupportInbox() {
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isSending, setIsSending] = useState(false);

    const fetchMessages = async () => {
        try {
            const res = await fetch('/api/voz/support');
            const data = await res.json();
            if (data.success && data.messages) {
                setMessages(data.messages);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 15000); // refresh every 15s
        return () => clearInterval(interval);
    }, []);

    const handleSendReply = async () => {
        if (!replyText.trim() || !selectedUser) return;
        setIsSending(true);

        try {
            const res = await fetch('/api/voz/support', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userHandle: selectedUser,
                    message: replyText,
                    isFromAdmin: true
                })
            });

            if (res.ok) {
                setReplyText('');
                await fetchMessages(); // reload to show the new message
            } else {
                alert('Error al enviar el mensaje.');
            }
        } catch (e) {
            alert('Fallo de red al enviar respuesta.');
        } finally {
            setIsSending(false);
        }
    };

    // Group messages by user
    const groupedUsers = Array.from(new Set(messages.map(m => m.user_handle)));
    const activeConversation = messages.filter(m => m.user_handle === selectedUser).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const handleSelectUser = async (u: string) => {
        setSelectedUser(u);
        const hasUnread = messages.some(m => m.user_handle === u && !m.is_from_admin && !m.read_status);
        if (hasUnread) {
            // Actualizar el estado local para quitar el punto rojo rápido
            setMessages(prev => prev.map(m => 
                (m.user_handle === u && !m.is_from_admin) ? { ...m, read_status: true } : m
            ));
            // Actualizar la base de datos de manera asíncrona
            try {
                await fetch('/api/voz/support', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userHandle: u })
                });
            } catch (error) {
                console.error("Error updating read status:", error);
            }
        }
    };

    return (
        <div style={{ display: 'flex', height: '100%', gap: '10px' }}>
            {/* Left Panel: Contact List */}
            <div className="window" style={{ width: '250px', display: 'flex', flexDirection: 'column' }}>
                <div className="title-bar">
                    <div className="title-bar-text">Bandeja de Entrada</div>
                </div>
                <div className="window-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p style={{ margin: 0, fontSize: '12px' }}>Usuarios con tickets abiertos:</p>
                    <div className="sunken-panel" style={{ flex: 1, backgroundColor: 'white', padding: '2px', overflowY: 'auto' }}>
                        {loading && groupedUsers.length === 0 ? <p style={{ padding: 10 }}>Cargando...</p> : null}
                        {!loading && groupedUsers.length === 0 ? <p style={{ padding: 10, color: 'gray' }}>No hay mensajes recientes.</p> : null}
                        
                        {groupedUsers.map(u => {
                            const unreadCount = messages.filter(m => m.user_handle === u && !m.is_from_admin && !m.read_status).length;
                            return (
                                <div 
                                    key={u}
                                    onClick={() => handleSelectUser(u)}
                                    style={{
                                        padding: '5px 10px',
                                        cursor: 'pointer',
                                        backgroundColor: selectedUser === u ? '#000080' : 'transparent',
                                        color: selectedUser === u ? 'white' : 'black',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        userSelect: 'none'
                                    }}
                                >
                                    <span>{u}</span>
                                    {unreadCount > 0 && (
                                        <span style={{ background: 'red', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' }}>{unreadCount}</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Right Panel: Conversation Thread */}
            <div className="window" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div className="title-bar">
                    <div className="title-bar-text">
                        {selectedUser ? `Conversación: ${selectedUser}` : 'Centro de Soporte VOZ'}
                    </div>
                </div>
                <div className="window-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {!selectedUser ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'gray' }}>
                            <p>Selecciona un usuario de la lista para ver la conversación.</p>
                        </div>
                    ) : (
                        <>
                            <div className="sunken-panel" style={{ flex: 1, backgroundColor: 'white', padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {activeConversation.map(msg => {
                                    const isSelf = msg.is_from_admin;
                                    return (
                                        <div key={msg.id} style={{ 
                                            alignSelf: isSelf ? 'flex-end' : 'flex-start',
                                            maxWidth: '80%',
                                            backgroundColor: isSelf ? '#d5f5e3' : '#f2f2f2',
                                            border: '1px solid #ccc',
                                            padding: '8px',
                                            borderRadius: '4px'
                                        }}>
                                            <div style={{ fontSize: '10px', color: 'gray', marginBottom: '4px', fontWeight: 'bold' }}>
                                                {isSelf ? 'Equipo VOZ' : msg.user_handle} - {new Date(msg.created_at).toLocaleString()}
                                            </div>
                                            <div style={{ wordWrap: 'break-word', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                                                {msg.message}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                <textarea 
                                    className="sunken-panel"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder={`Enviando respuesta a ${selectedUser}. Esto le llegará como notificación a Actividad.`}
                                    style={{ flex: 1, height: '60px', padding: '5px', resize: 'none' }}
                                />
                                <button 
                                    onClick={handleSendReply}
                                    disabled={isSending || !replyText.trim()}
                                    style={{ height: '60px', width: '100px', fontWeight: 'bold' }}
                                >
                                    {isSending ? 'Enviando...' : 'Responder'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
