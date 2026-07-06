'use client';
import { useState, useEffect } from 'react';
import '98.css';

interface AlertItem {
    id: number;
    servicio: string;
    nivel?: string;
    mensaje_error: string;
    stack?: string;
    usuario?: string;
    plataforma?: string;
    version_app?: string;
    pantalla?: string;
    metadata_json?: any;
    firma?: string;
    ocurrencias?: number;
    usuarios_unicos?: number;
    primera_vez?: string;
    ultima_vez?: string;
    creado_en: string;
}

export function parseError(fullMessage: string) {
    if (!fullMessage) return { title: 'Sin mensaje', stackTrace: '', url: '' };
    const lines = fullMessage.split('\n');
    const urlLine = lines.find(l => l.startsWith('URL:'));
    const url = urlLine ? urlLine.replace('URL:', '').trim() : '';
    const title = lines[0] || 'Error Desconocido';
    const stackTrace = lines.slice(1).filter(l => !l.startsWith('URL:')).join('\n');
    return { title, stackTrace, url };
}

function timeAgo(dateStr?: string): string {
    if (!dateStr) return '—';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `hace ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `hace ${days}d`;
}

const SERVICE_COLORS: Record<string, string> = {
    'Frontend': '#e65100',
    'ErrorBoundary': '#bf360c',
    'UnhandledError': '#b71c1c',
    'VideoUpload': '#880e4f',
    'PM-Inicio': '#4a148c',
    'PM-Mensajes': '#4a148c',
    'PM-Conversaciones': '#4a148c',
    'PMs': '#4a148c',    'Compras': '#c62828',
    'Wallet-Retiro': '#b71c1c',
    'Wallet-Transfer': '#b71c1c',
    'Donaciones': '#1a237e',
    'Auth-Login': '#004d40',
    'Auth-Register': '#004d40',
    'Auth-SyncInit': '#00695c',
    'Notificaciones': '#1565c0',
    'Seguimiento': '#1565c0',
    'Ledger': '#2e7d32',
    'Videos-Fetch': '#37474f',
    'Upload': '#6a1b9a',
    'VoiceUpload': '#ad1457',
};

function getServiceColor(servicio: string): string {
    if (SERVICE_COLORS[servicio]) return SERVICE_COLORS[servicio];    if (servicio?.startsWith('Auth')) return '#004d40';
    if (servicio?.startsWith('PM')) return '#4a148c';
    if (servicio?.startsWith('Wallet')) return '#b71c1c';
    return '#1565c0';
}

function getPlatformBadge(plataforma?: string): string {
    if (plataforma === 'ios') return '🍎 iOS';
    if (plataforma === 'android') return '🤖 Android';
    if (plataforma === 'web') return '🌐 Web';
    return '❓ —';
}

function getNivelColor(nivel?: string): string {
    if (nivel === 'critical') return '#d32f2f';
    if (nivel === 'error') return '#e65100';
    if (nivel === 'warning') return '#f57f17';
    if (nivel === 'info') return '#1565c0';
    return '#e65100';
}

export default function ErrorsPage() {
    const [alerts, setAlerts] = useState<AlertItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterService, setFilterService] = useState('All');
    const [filterNivel, setFilterNivel] = useState('All');
    const [groupedMode, setGroupedMode] = useState(true);

    const fetchAlerts = () => {
        setLoading(true);
        const url = groupedMode ? '/api/voz/admin/alerts?grouped=true' : '/api/voz/admin/alerts';
        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setAlerts(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching alerts:', err);
                setLoading(false);
            });
    };

    useEffect(() => { fetchAlerts(); }, [groupedMode]);

    const handleCopyForAI = (alertItem: AlertItem) => {
        const { title } = parseError(alertItem.mensaje_error);
        const text = `======================================================================
REPORTE DE ERROR — APLICACIÓN VOZ V2
======================================================================
SERVICIO: ${alertItem.servicio}
NIVEL: ${alertItem.nivel || 'error'}
PLATAFORMA: ${alertItem.plataforma || '—'} | VERSIÓN: ${alertItem.version_app || '—'}
USUARIO: ${alertItem.usuario || '—'} | PANTALLA: ${alertItem.pantalla || '—'}
OCURRENCIAS: ${alertItem.ocurrencias || 1} | USUARIOS ÚNICOS: ${alertItem.usuarios_unicos || 1}
PRIMERA VEZ: ${alertItem.primera_vez ? new Date(alertItem.primera_vez).toLocaleString() : '—'}
ÚLTIMA VEZ: ${alertItem.ultima_vez ? new Date(alertItem.ultima_vez).toLocaleString() : '—'}

ERROR: ${title}

STACK:
${alertItem.stack || parseError(alertItem.mensaje_error).stackTrace || 'No disponible'}

METADATA:
${alertItem.metadata_json ? JSON.stringify(alertItem.metadata_json, null, 2) : 'Sin metadata'}
======================================================================
Analiza este error y dime cómo solucionarlo.`;
        navigator.clipboard.writeText(text);
        alert('¡Copiado! Pégalo en el chat para resolver juntos.');
    };

    const filteredAlerts = alerts.filter(alert => {
        const haystack = (alert.mensaje_error + alert.servicio + (alert.usuario || '') + (alert.version_app || '')).toLowerCase();
        const matchesSearch = haystack.includes(searchTerm.toLowerCase());
        const matchesService = filterService === 'All' || alert.servicio === filterService;
        const matchesNivel = filterNivel === 'All' || (alert.nivel || 'error') === filterNivel;
        return matchesSearch && matchesService && matchesNivel;
    });

    const services = ['All', ...Array.from(new Set(alerts.map(a => a.servicio))).sort()];

    const totalOcurrencias = filteredAlerts.reduce((sum, a) => sum + (a.ocurrencias || 1), 0);
    const totalUsuarios = filteredAlerts.reduce((sum, a) => sum + (a.usuarios_unicos || 1), 0);

    return (
        <div style={{ padding: 10, height: '92vh', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>⚠️ Registro de Errores — Sistema V2</h3>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <label style={{ fontSize: 12 }}>
                        <input type="checkbox" checked={groupedMode} onChange={e => setGroupedMode(e.target.checked)} />
                        {' '}Vista agrupada
                    </label>
                    <button onClick={fetchAlerts}>🔄 Actualizar</button>
                </div>
            </div>

            {/* Stats bar */}
            <div style={{ display: 'flex', gap: 16, fontSize: 12, padding: '4px 0', borderBottom: '1px solid #666' }}>
                <span>📊 Tipos únicos: <strong>{filteredAlerts.length}</strong></span>
                <span>🔁 Total ocurrencias: <strong style={{ color: '#ff6b35' }}>{totalOcurrencias}</strong></span>
                <span>👥 Usuarios afectados: <strong style={{ color: '#ff6b35' }}>{totalUsuarios}</strong></span>
                {groupedMode && <span style={{ color: '#888' }}>— ordenado por frecuencia</span>}
            </div>

            {/* Filtros */}
            <div className="field-row" style={{ gap: 12, flexWrap: 'wrap' }}>
                <div>
                    <label style={{ marginRight: 5, fontSize: 12 }}>Buscar:</label>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="error, usuario, versión..."
                        style={{ width: '220px' }}
                    />
                </div>
                <div>
                    <label style={{ marginRight: 5, fontSize: 12 }}>Servicio:</label>
                    <select value={filterService} onChange={e => setFilterService(e.target.value)}>
                        {services.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div>
                    <label style={{ marginRight: 5, fontSize: 12 }}>Nivel:</label>
                    <select value={filterNivel} onChange={e => setFilterNivel(e.target.value)}>
                        {['All', 'critical', 'error', 'warning', 'info'].map(n =>
                            <option key={n} value={n}>{n}</option>
                        )}
                    </select>
                </div>
            </div>

            {/* Tabla principal */}
            <div className="sunken-panel" style={{ flex: 1, backgroundColor: '#000', color: '#00ff00', overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#00ff00', fontSize: 12 }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '2px solid #00ff00', position: 'sticky', top: 0, backgroundColor: '#111', zIndex: 10 }}>
                            <th style={{ padding: '6px 8px', width: 100 }}>Servicio</th>
                            <th style={{ padding: '6px 8px', width: 72 }}>Nivel</th>
                            <th style={{ padding: '6px 4px', width: 60 }}>Origen</th>
                            <th style={{ padding: '6px 4px', width: 55, textAlign: 'center', color: '#ff6b35' }}>× veces</th>
                            <th style={{ padding: '6px 4px', width: 42, textAlign: 'center', color: '#ff6b35' }}>👥</th>
                            <th style={{ padding: '6px 8px', width: 65 }}>Versión</th>
                            <th style={{ padding: '6px 8px', width: 80 }}>Última vez</th>
                            <th style={{ padding: '6px 8px' }}>Mensaje</th>
                            <th style={{ padding: '6px 8px', width: 130, textAlign: 'center' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && filteredAlerts.length === 0 ? (
                            <tr><td colSpan={9} style={{ textAlign: 'center', padding: 20, color: 'gray' }}>Cargando...</td></tr>
                        ) : filteredAlerts.length === 0 ? (
                            <tr><td colSpan={9} style={{ textAlign: 'center', padding: 20, color: 'gray' }}>✅ No hay errores registrados.</td></tr>
                        ) : filteredAlerts.map(alertItem => {
                            const { title } = parseError(alertItem.mensaje_error);
                            const nivel = alertItem.nivel || 'error';
                            const ocurrencias = alertItem.ocurrencias || 1;
                            const isHot = ocurrencias >= 10;

                            return (
                                <tr
                                    key={alertItem.id}
                                    style={{ borderBottom: '1px solid #1a3a1a', cursor: 'pointer', backgroundColor: isHot ? '#1a0000' : 'transparent' }}
                                    onClick={() => setSelectedAlert(alertItem)}
                                >
                                    <td style={{ padding: '5px 8px' }}>
                                        <span style={{
                                            padding: '2px 5px', borderRadius: 3,
                                            backgroundColor: getServiceColor(alertItem.servicio),
                                            color: 'white', fontWeight: 'bold', fontSize: 10,
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {alertItem.servicio}
                                        </span>
                                    </td>
                                    <td style={{ padding: '5px 8px' }}>
                                        <span style={{
                                            padding: '1px 5px', borderRadius: 3,
                                            backgroundColor: getNivelColor(nivel),
                                            color: 'white', fontSize: 10, fontWeight: 'bold',
                                            textTransform: 'uppercase'
                                        }}>
                                            {nivel}
                                        </span>
                                    </td>
                                    <td style={{ padding: '5px 4px', fontSize: 10, whiteSpace: 'nowrap' }}>
                                        {getPlatformBadge(alertItem.plataforma)}
                                    </td>
                                    <td style={{ padding: '5px 4px', textAlign: 'center', fontWeight: 'bold', color: isHot ? '#ff4444' : '#ff9944' }}>
                                        {isHot ? `🔥 ${ocurrencias}` : ocurrencias}
                                    </td>
                                    <td style={{ padding: '5px 4px', textAlign: 'center', color: '#aaa' }}>
                                        {alertItem.usuarios_unicos || 1}
                                    </td>
                                    <td style={{ padding: '5px 8px', color: '#00aaff', fontSize: 11 }}>
                                        {alertItem.version_app || '—'}
                                    </td>
                                    <td style={{ padding: '5px 8px', color: '#888', fontSize: 11, whiteSpace: 'nowrap' }}>
                                        {timeAgo(alertItem.ultima_vez || alertItem.creado_en)}
                                    </td>
                                    <td style={{
                                        padding: '5px 8px', fontFamily: 'monospace',
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 360
                                    }}>
                                        {title}
                                    </td>
                                    <td style={{ padding: '5px 8px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                                        <button style={{ marginRight: 4 }} onClick={() => setSelectedAlert(alertItem)}>🔍 Ver</button>
                                        <button onClick={() => handleCopyForAI(alertItem)}>🤖 IA</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Modal de detalle */}
            {selectedAlert && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="window" style={{ width: '80vw', maxWidth: 900, maxHeight: '85vh', overflowY: 'auto' }}>
                        <div className="title-bar">
                            <div className="title-bar-text">
                                🔍 Detalle: [{selectedAlert.servicio}] — {selectedAlert.nivel?.toUpperCase() || 'ERROR'}
                            </div>
                            <div className="title-bar-controls">
                                <button aria-label="Close" onClick={() => setSelectedAlert(null)} />
                            </div>
                        </div>
                        <div className="window-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

                            {/* Metadata strip */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, padding: '6px 0', borderBottom: '1px solid #ccc' }}>
                                <span>📱 <strong>{getPlatformBadge(selectedAlert.plataforma)}</strong></span>
                                <span>🏷 v<strong>{selectedAlert.version_app || '—'}</strong></span>
                                <span>👤 <strong>{selectedAlert.usuario || 'Anónimo'}</strong></span>
                                <span>📍 <strong>{selectedAlert.pantalla || '—'}</strong></span>
                                <span>🔁 <strong style={{ color: '#c62828' }}>{selectedAlert.ocurrencias || 1}</strong> ocurrencias</span>
                                <span>👥 <strong>{selectedAlert.usuarios_unicos || 1}</strong> usuarios afectados</span>
                            </div>
                            <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#666' }}>
                                <span>Primera vez: {selectedAlert.primera_vez ? new Date(selectedAlert.primera_vez).toLocaleString() : '—'}</span>
                                <span>Última vez: {selectedAlert.ultima_vez ? new Date(selectedAlert.ultima_vez).toLocaleString() : new Date(selectedAlert.creado_en).toLocaleString()}</span>
                                {selectedAlert.firma && <span style={{ color: '#999', fontFamily: 'monospace' }}>firma: {selectedAlert.firma.slice(0, 12)}…</span>}
                            </div>

                            {/* Mensaje de error */}
                            <div style={{
                                padding: 10, border: '1px solid #d8000c',
                                backgroundColor: '#ffbaba', color: '#d8000c',
                                fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold',
                                wordBreak: 'break-word', whiteSpace: 'pre-wrap'
                            }}>
                                ⚠️ {parseError(selectedAlert.mensaje_error).title}
                            </div>

                            {/* URL (errores de frontend web) */}
                            {parseError(selectedAlert.mensaje_error).url && (
                                <div style={{ padding: '5px 10px', backgroundColor: '#1a1a2e', color: '#00aaff', fontFamily: 'monospace', fontSize: 12, borderRadius: 4 }}>
                                    🔗 URL: {parseError(selectedAlert.mensaje_error).url}
                                </div>
                            )}

                            {/* Stack trace */}
                            <label>Stack trace:</label>
                            <textarea
                                readOnly
                                value={selectedAlert.stack || parseError(selectedAlert.mensaje_error).stackTrace || 'No disponible'}
                                style={{ height: 140, fontFamily: 'monospace', fontSize: 11, backgroundColor: '#111', color: '#00ff00', border: '1px solid #333', padding: 8 }}
                            />

                            {/* Metadata JSON */}
                            {selectedAlert.metadata_json && (
                                <>
                                    <label>Metadata (contexto extra):</label>
                                    <pre style={{
                                        backgroundColor: '#0a0a0a', color: '#00aaff',
                                        padding: 10, fontSize: 11, fontFamily: 'monospace',
                                        borderRadius: 4, maxHeight: 150, overflow: 'auto',
                                        border: '1px solid #222', margin: 0
                                    }}>
                                        {JSON.stringify(selectedAlert.metadata_json, null, 2)}
                                    </pre>
                                </>
                            )}

                            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                <button onClick={() => handleCopyForAI(selectedAlert)}>🤖 Copiar para IA</button>
                                <button onClick={() => setSelectedAlert(null)}>Cerrar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
