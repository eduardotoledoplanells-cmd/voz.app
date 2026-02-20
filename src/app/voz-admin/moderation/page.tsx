'use client';
import { useState, useEffect } from 'react';
import '98.css';

interface ModerationItem {
    id: string;
    type: 'video' | 'audio' | 'text' | 'image';
    url: string;
    userHandle: string;
    reportReason?: string;
    timestamp: string;
    status: 'pending' | 'approved' | 'rejected';
}

export default function VozModerationPage() {
    const [queue, setQueue] = useState<ModerationItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchQueue();
    }, []);

    const fetchQueue = () => {
        setLoading(true);
        fetch('/api/voz/moderation')
            .then(res => res.json())
            .then(data => {
                setQueue(data);
                if (data.length > 0 && !selectedItem) {
                    setSelectedItem(data[0]);
                } else if (data.length === 0) {
                    setSelectedItem(null);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    const handleAction = (status: 'approved' | 'rejected') => {
        if (!selectedItem) return;

        const employee = JSON.parse(localStorage.getItem('vozEmployee') || '{}');

        fetch('/api/voz/moderation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: selectedItem.id,
                status,
                employeeName: employee.username
            })
        })
            .then(() => {
                const nextIndex = queue.findIndex(item => item.id === selectedItem.id) + 1;
                const nextItem = nextIndex < queue.length ? queue[nextIndex] : null;
                setSelectedItem(nextItem);
                fetchQueue();
            });
    };

    const handleSkip = () => {
        const nextIndex = queue.findIndex(item => item.id === selectedItem?.id) + 1;
        if (nextIndex < queue.length) {
            setSelectedItem(queue[nextIndex]);
        } else if (queue.length > 0) {
            setSelectedItem(queue[0]);
        }
    };

    return (
        <div style={{ padding: 10, display: 'flex', gap: 10, height: '85vh' }}>
            {/* Lista de Cola de Denuncias */}
            <div style={{ width: '300px', display: 'flex', flexDirection: 'column' }}>
                <fieldset style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <legend>Denuncias Pendientes ({queue.length})</legend>
                    <div className="sunken-panel" style={{ flex: 1, backgroundColor: 'white', overflowY: 'auto' }}>
                        <ul className="tree-view">
                            {loading ? (
                                <li>Cargando reportes...</li>
                            ) : queue.length === 0 ? (
                                <li>No hay denuncias pendientes</li>
                            ) : (
                                queue.map(item => (
                                    <li
                                        key={item.id}
                                        onClick={() => setSelectedItem(item)}
                                        style={{
                                            cursor: 'pointer',
                                            backgroundColor: selectedItem?.id === item.id ? 'navy' : 'transparent',
                                            color: selectedItem?.id === item.id ? 'white' : 'black',
                                            padding: '4px 8px',
                                            borderBottom: '1px solid #dfdfdf'
                                        }}
                                    >
                                        <div style={{ fontWeight: 'bold' }}>{item.type === 'video' ? '📹 Video' : '🔊 Audio'}</div>
                                        <div style={{ fontSize: '0.8em', opacity: selectedItem?.id === item.id ? 0.9 : 0.7 }}>
                                            Por: {item.userHandle}
                                        </div>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                </fieldset>
            </div>

            {/* Área de Visualización */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div className="window" style={{ flex: 1, marginBottom: 10, display: 'flex', flexDirection: 'column' }}>
                    <div className="title-bar">
                        <div className="title-bar-text">
                            Visualizador de Denuncias: {selectedItem ? `${selectedItem.type.toUpperCase()} de ${selectedItem.userHandle}` : 'Nada seleccionado'}
                        </div>
                    </div>
                    <div className="window-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 10 }}>
                        {selectedItem ? (
                            <>
                                <div style={{ marginBottom: 10, padding: 5, background: '#ffcccc', border: '1px solid red', fontWeight: 'bold', color: '#b30000' }}>
                                    🚩 Motivo del Reporte: {selectedItem.reportReason || 'No especificado'}
                                </div>
                                <div className="sunken-panel" style={{ flex: 1, background: 'black', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                                    {selectedItem.type === 'video' ? (
                                        <video
                                            key={selectedItem.url}
                                            src={selectedItem.url}
                                            controls
                                            autoPlay
                                            style={{ maxWidth: '100%', maxHeight: '100%' }}
                                        />
                                    ) : selectedItem.type === 'audio' ? (
                                        <div style={{ textAlign: 'center' }}>
                                            <img src="https://win98icons.alexmeub.com/icons/png/sndvol32-1.png" alt="Audio" style={{ width: 64, marginBottom: 20 }} />
                                            <audio
                                                key={selectedItem.url}
                                                src={selectedItem.url}
                                                controls
                                                autoPlay
                                                style={{ width: '300px' }}
                                            />
                                        </div>
                                    ) : (
                                        <p style={{ color: 'white' }}>Tipo de contenido no soportado: {selectedItem.type}</p>
                                    )}
                                </div>
                                <div className="status-bar" style={{ marginTop: 10 }}>
                                    <p className="status-bar-field">ID: {selectedItem.id}</p>
                                    <p className="status-bar-field">Usuario: {selectedItem.userHandle}</p>
                                    <p className="status-bar-field">Fecha: {new Date(selectedItem.timestamp).toLocaleString()}</p>
                                </div>
                            </>
                        ) : (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#c0c0c0' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <img src="https://win98icons.alexmeub.com/icons/png/shield_cool-1.png" alt="Moderacion" style={{ width: 64, marginBottom: 10 }} />
                                    <p>Selecciona una denuncia de la cola para revisarla.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="field-row" style={{ justifyContent: 'center', gap: 20 }}>
                    <button
                        disabled={!selectedItem}
                        onClick={() => handleAction('rejected')}
                        style={{ minWidth: 120, fontWeight: 'bold', color: 'red' }}
                    >
                        🗑️ ELIMINAR / BANEAR
                    </button>
                    <button
                        disabled={!selectedItem}
                        onClick={() => handleAction('approved')}
                        style={{ minWidth: 120, fontWeight: 'bold', color: 'green' }}
                    >
                        🛡️ MANTENER POST
                    </button>
                    <button
                        disabled={queue.length <= 1}
                        onClick={handleSkip}
                        style={{ minWidth: 80 }}
                    >
                        Saltar
                    </button>
                </div>
            </div>
        </div>
    );
}
