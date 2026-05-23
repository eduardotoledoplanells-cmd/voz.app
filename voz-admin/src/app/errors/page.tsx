'use client';
import { useState, useEffect } from 'react';
import '98.css';

interface AlertItem {
    id: number;
    servicio: string;
    mensaje_error: string;
    creado_en: string;
}

export default function ErrorsPage() {
    const [alerts, setAlerts] = useState<AlertItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterService, setFilterService] = useState('All');

    const fetchAlerts = () => {
        setLoading(true);
        fetch('/api/voz/admin/alerts')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setAlerts(data);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching alerts:', err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchAlerts();
    }, []);

    const handleCopyError = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Código de error copiado al portapapeles.');
    };

    const filteredAlerts = alerts.filter(alert => {
        const matchesSearch = alert.mensaje_error.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              alert.servicio.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesService = filterService === 'All' || alert.servicio === filterService;
        return matchesSearch && matchesService;
    });

    const services = ['All', ...Array.from(new Set(alerts.map(a => a.servicio)))];

    return (
        <div style={{ padding: 10, height: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h3 style={{ margin: 0 }}>⚠️ Registro de Errores de Sistema</h3>
                <button onClick={fetchAlerts}>🔄 Actualizar</button>
            </div>

            <div className="field-row" style={{ marginBottom: 10, gap: 15 }}>
                <div>
                    <label style={{ marginRight: 5 }}>Buscar en error:</label>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por texto..."
                        style={{ width: '250px' }}
                    />
                </div>
                <div>
                    <label style={{ marginRight: 5 }}>Servicio:</label>
                    <select value={filterService} onChange={(e) => setFilterService(e.target.value)}>
                        {services.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="sunken-panel" style={{ flex: 1, backgroundColor: 'white', overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid black', position: 'sticky', top: 0, backgroundColor: '#c0c0c0', zIndex: 10 }}>
                            <th style={{ padding: '8px', width: '180px' }}>Fecha y Hora</th>
                            <th style={{ padding: '8px', width: '120px' }}>Servicio</th>
                            <th style={{ padding: '8px' }}>Mensaje de Error / Stack Trace</th>
                            <th style={{ padding: '8px', width: '150px', textAlign: 'center' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && alerts.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'gray' }}>
                                    Cargando registros de errores...
                                </td>
                            </tr>
                        ) : filteredAlerts.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'gray' }}>
                                    No se encontraron errores.
                                </td>
                            </tr>
                        ) : (
                            filteredAlerts.map((alertItem) => (
                                <tr 
                                    key={alertItem.id} 
                                    style={{ borderBottom: '1px solid #eee', cursor: 'pointer' }}
                                    onClick={() => setSelectedAlert(alertItem)}
                                    className="alert-row"
                                >
                                    <td style={{ padding: '8px', whiteSpace: 'nowrap' }}>
                                        {new Date(alertItem.creado_en).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '8px' }}>
                                        <span style={{
                                            padding: '2px 6px',
                                            borderRadius: '3px',
                                            backgroundColor: 
                                                alertItem.servicio === 'Stripe' ? '#6772e5' : 
                                                alertItem.servicio === 'Ledger' ? '#2e7d32' : 
                                                alertItem.servicio === 'KYC' ? '#e65100' : '#1565c0',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            fontSize: '11px'
                                        }}>
                                            {alertItem.servicio}
                                        </span>
                                    </td>
                                    <td style={{ 
                                        padding: '8px', 
                                        fontSize: '12px', 
                                        fontFamily: 'monospace', 
                                        whiteSpace: 'nowrap', 
                                        overflow: 'hidden', 
                                        textOverflow: 'ellipsis',
                                        maxWidth: '400px'
                                    }}>
                                        {alertItem.mensaje_error}
                                    </td>
                                    <td style={{ padding: '8px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                        <button onClick={() => setSelectedAlert(alertItem)} style={{ marginRight: 5 }}>
                                            🔍 Ver
                                        </button>
                                        <button onClick={() => handleCopyError(alertItem.mensaje_error)}>
                                            📋 Copiar
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {selectedAlert && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000
                }}>
                    <div className="window" style={{ width: '600px', maxWidth: '90%' }}>
                        <div className="title-bar">
                            <div className="title-bar-text">Detalle del Error - ID #{selectedAlert.id} ({selectedAlert.servicio})</div>
                            <div className="title-bar-controls">
                                <button aria-label="Close" onClick={() => setSelectedAlert(null)}></button>
                            </div>
                        </div>
                        <div className="window-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                <span><b>Servicio:</b> {selectedAlert.servicio}</span>
                                <span><b>Ocurrido el:</b> {new Date(selectedAlert.creado_en).toLocaleString()}</span>
                            </div>
                            
                            <label>Mensaje de error y pila de llamadas (stack trace):</label>
                            <textarea 
                                readOnly
                                value={selectedAlert.mensaje_error}
                                style={{ 
                                    width: '100%', 
                                    height: '250px', 
                                    fontFamily: 'monospace', 
                                    fontSize: '11px', 
                                    whiteSpace: 'pre',
                                    resize: 'none',
                                    backgroundColor: '#fff',
                                    color: '#000',
                                    border: '1px solid #808080',
                                    padding: '5px'
                                }}
                            />

                            <div className="field-row" style={{ justifyContent: 'flex-end', gap: 10 }}>
                                <button onClick={() => handleCopyError(selectedAlert.mensaje_error)}>
                                    📋 Copiar Error
                                </button>
                                <button onClick={() => setSelectedAlert(null)}>
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="status-bar" style={{ marginTop: 10 }}>
                <p className="status-bar-field">Total Errores: {filteredAlerts.length}</p>
                <p className="status-bar-field">Filtrado por: {filterService}</p>
            </div>
        </div>
    );
}
