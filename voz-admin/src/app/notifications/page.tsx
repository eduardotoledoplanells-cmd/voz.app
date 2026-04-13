'use client';
import React, { useState, useEffect } from 'react';
import '98.css';

export default function NotificationsPage() {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState('system');
    const [isSending, setIsSending] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const [employee, setEmployee] = useState<any>(null);

    useEffect(() => {
        const stored = localStorage.getItem('vozEmployee');
        if (stored) setEmployee(JSON.parse(stored));
    }, []);

    const handleSendBroadcast = async () => {
        if (!title.trim() || !message.trim()) {
            alert('Por favor completa todos los campos.');
            return;
        }

        if (!confirm('¿Estás SEGURO de enviar esta notificación a TODOS los usuarios activos? Esta acción no se puede deshacer.')) {
            return;
        }

        setIsSending(true);
        setStatus('Preparando envío masivo...');

        try {
            const res = await fetch('/api/voz/notifications/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    message,
                    type,
                    employeeName: employee ? `[${employee.workerNumber}] ${employee.username}` : 'Admin'
                })
            });

            const data = await res.json();

            if (data.success) {
                setStatus(`¡Éxito! Notificación enviada a ${data.count} usuarios.`);
                setTitle('');
                setMessage('');
            } else {
                setStatus('Error: ' + (data.error || 'No se pudo completar el envío.'));
            }
        } catch (error) {
            console.error('Error sending broadcast:', error);
            setStatus('Error de conexión con el servidor.');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '600px' }}>
            <div className="window">
                <div className="title-bar">
                    <div className="title-bar-text">Broadcaster Master v1.0 - Envío Masivo</div>
                </div>
                <div className="window-body">
                    <p>Utiliza esta herramienta para enviar comunicaciones oficiales a todos los usuarios de la aplicación VOZ.</p>
                    <div className="field-row-stacked" style={{ marginBottom: '15px' }}>
                        <label>Título de la Notificación (Máximo 50 caracteres)</label>
                        <input 
                            type="text" 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            placeholder="Ej: Mantenimiento programado"
                            maxLength={50}
                        />
                    </div>
                    <div className="field-row-stacked" style={{ marginBottom: '15px' }}>
                        <label>Mensaje del Cuerpo</label>
                        <textarea 
                            rows={5} 
                            value={message} 
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Escribe aquí el contenido que verán los usuarios..."
                        />
                    </div>
                    <div className="field-row" style={{ marginBottom: '20px' }}>
                        <label>Tipo de Alerta:</label>
                        <select value={type} onChange={(e) => setType(e.target.value)}>
                            <option value="system">Sistema (Gris)</option>
                            <option value="important">Importante (Rojo)</option>
                            <option value="update">Actualización (Azul)</option>
                            <option value="promo">Promoción (Dorado)</option>
                        </select>
                    </div>

                    {status && (
                        <div className="sunken-panel" style={{ padding: '10px', marginBottom: '15px', backgroundColor: '#c0c0c0' }}>
                            <p style={{ margin: 0, fontWeight: 'bold' }}>{status}</p>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button onClick={() => { setTitle(''); setMessage(''); setStatus(null); }}>Limpiar</button>
                        <button 
                            className="default" 
                            onClick={handleSendBroadcast} 
                            disabled={isSending}
                            style={{ padding: '0 20px' }}
                        >
                            {isSending ? 'Enviando...' : 'Transmitir a Todos'}
                        </button>
                    </div>
                </div>
                <div className="status-bar">
                    <p className="status-bar-field">Prioridad: {type === 'important' ? 'ALTA' : 'Normal'}</p>
                    <p className="status-bar-field">Protocolo: UDP-Broadcast</p>
                </div>
            </div>

            <div className="window" style={{ marginTop: '20px' }}>
                <div className="window-body">
                    <p><strong>Nota:</strong> Los usuarios recibirán tanto una notificación interna como una notificación push (si tienen el token activo).</p>
                </div>
            </div>
        </div>
    );
}
