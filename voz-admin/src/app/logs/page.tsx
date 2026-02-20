'use client';
import { useState, useEffect } from 'react';
import '98.css';

export default function DirectorLogsPage() {
    const [activeTab, setActiveTab] = useState<'logs' | 'staff' | 'moderation'>('logs');
    const [moderationStats, setModerationStats] = useState<any>({ productivity: [], inactivity: [] });
    const [logs, setLogs] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Employee Form State
    const [showAddModal, setShowAddModal] = useState(false);
    const [newEmp, setNewEmp] = useState({ username: '', role: '3', password: '', workerNumber: '' }); // workerNumber removed from form but kept in state if needed for optimistic UI (though not used here)

    // Delete Confirmation State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [empToDelete, setEmpToDelete] = useState<string | null>(null);
    const [deleteSearchTerm, setDeleteSearchTerm] = useState('');

    const roleNames: Record<number, string> = {
        1: 'Director',
        2: 'Administrador',
        3: 'Moderador',
        4: 'Publicidad',
        5: 'Servicio Técnico',
        6: 'Desarrollador'
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = () => {
        setLoading(true);
        let endpoint = '/api/voz/logs';
        if (activeTab === 'staff') endpoint = '/api/voz/employees';
        if (activeTab === 'moderation') endpoint = '/api/voz/moderation/stats';

        fetch(endpoint)
            .then(res => res.json())
            .then(data => {
                if (activeTab === 'logs' && Array.isArray(data)) setLogs(data);
                else if (activeTab === 'staff' && Array.isArray(data)) setEmployees(data);
                else if (activeTab === 'moderation') setModerationStats(data);

                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    const handleAddEmployee = (e: React.FormEvent) => {
        e.preventDefault();
        fetch('/api/voz/employees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newEmp)
        })
            .then(res => res.json())
            .then(() => {
                fetchData();
                setShowAddModal(false);
                setNewEmp({ username: '', role: '3', password: '', workerNumber: '' });
            });
    };

    const handleDeleteEmployee = (id: string) => {
        setEmpToDelete(id);
        setShowDeleteModal(true);
    };

    const confirmDeleteEmployee = () => {
        if (!empToDelete) return;
        fetch(`/api/voz/employees?id=${empToDelete}`, { method: 'DELETE' })
            .then(() => {
                fetchData();
                setShowDeleteModal(false);
                setEmpToDelete(null);
            });
    };

    const filteredLogs = logs.filter(log =>
        log.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading && logs.length === 0 && employees.length === 0)
        return <div style={{ padding: 10 }}>Cargando datos del sistema...</div>;

    return (
        <div style={{ padding: 10, height: '85vh', display: 'flex', flexDirection: 'column' }}>
            <menu role="tablist">
                <li role="tab" className={activeTab === 'logs' ? 'active' : ''}>
                    <a href="#logs" onClick={() => setActiveTab('logs')}>Audit Logs</a>
                </li>
                <li role="tab" className={activeTab === 'staff' ? 'active' : ''}>
                    <a href="#staff" onClick={() => setActiveTab('staff')}>Gestión de Personal</a>
                </li>
                <li role="tab" className={activeTab === 'moderation' ? 'active' : ''}>
                    <a href="#moderation" onClick={() => setActiveTab('moderation')}>Supervisión Moderación</a>
                </li>
            </menu>

            <div className="window-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {activeTab === 'logs' ? (
                    <>
                        <div className="field-row" style={{ marginBottom: 10 }}>
                            <label>Filtrar registros:</label>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar por empleado o acción..."
                                style={{ width: '300px' }}
                            />
                            <button onClick={fetchData}>Actualizar</button>
                        </div>

                        <div className="sunken-panel" style={{ flex: 1, backgroundColor: 'white', overflow: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid black', position: 'sticky', top: 0, backgroundColor: '#c0c0c0' }}>
                                        <th style={{ padding: '8px' }}>Fecha y Hora</th>
                                        <th style={{ padding: '8px' }}>Empleado</th>
                                        <th style={{ padding: '8px' }}>Acción</th>
                                        <th style={{ padding: '8px' }}>Detalles</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLogs.filter(l => l.employeeName !== 'Sistema' && !l.action.includes('Creación de Usuario')).length === 0 ? (
                                        <tr>
                                            <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'gray' }}>
                                                No se encontraron registros de empleados.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredLogs
                                            .filter(l => l.employeeName !== 'Sistema' && !l.action.includes('Creación de Usuario'))
                                            .map((log) => (
                                                <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                                                    <td style={{ padding: '8px', whiteSpace: 'nowrap' }}>
                                                        {new Date(log.timestamp).toLocaleString()}
                                                    </td>
                                                    <td style={{ padding: '8px' }}><b>{log.employeeName}</b></td>
                                                    <td style={{ padding: '8px' }}>{log.action}</td>
                                                    <td style={{ padding: '8px', fontSize: '12px', color: '#222' }}>
                                                        {log.details || '-'}
                                                    </td>
                                                </tr>
                                            ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : activeTab === 'moderation' ? (
                    <div style={{ padding: '10px' }}>
                        <h4 style={{ marginTop: 0 }}>Productividad de Moderadores</h4>
                        <div className="sunken-panel" style={{ height: '250px', backgroundColor: 'white', overflow: 'auto', marginBottom: '20px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid black', position: 'sticky', top: 0, backgroundColor: '#c0c0c0' }}>
                                        <th style={{ padding: '8px' }}>Fecha/Hora</th>
                                        <th style={{ padding: '8px' }}>Moderador</th>
                                        <th style={{ padding: '8px' }}>Videos Revisados (Ciclo)</th>
                                        <th style={{ padding: '8px' }}>Total Histórico</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {moderationStats && moderationStats.productivity && moderationStats.productivity.length > 0 ? (
                                        [...moderationStats.productivity].reverse().map((stat: any, idx: number) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                                <td style={{ padding: '8px' }}>{new Date(stat.timestamp).toLocaleString()}</td>
                                                <td style={{ padding: '8px' }}><b>{stat.employee}</b></td>
                                                <td style={{ padding: '8px' }}>{stat.cycleVideos}</td>
                                                <td style={{ padding: '8px' }}>{stat.totalVideos}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan={4} style={{ padding: '10px', textAlign: 'center' }}>Sin datos de productividad.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <h4 style={{ marginTop: 0, color: 'red' }}>Alertas de Inactividad</h4>
                        <div className="sunken-panel" style={{ height: '200px', backgroundColor: '#fff0f0', overflow: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid black', position: 'sticky', top: 0, backgroundColor: '#c0c0c0' }}>
                                        <th style={{ padding: '8px' }}>Fecha/Hora</th>
                                        <th style={{ padding: '8px' }}>Moderador</th>
                                        <th style={{ padding: '8px' }}>Incidencia</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {moderationStats && moderationStats.inactivity && moderationStats.inactivity.length > 0 ? (
                                        [...moderationStats.inactivity].reverse().map((stat: any, idx: number) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                                <td style={{ padding: '8px' }}>{new Date(stat.timestamp).toLocaleString()}</td>
                                                <td style={{ padding: '8px' }}><b>{stat.employee}</b></td>
                                                <td style={{ padding: '8px', color: 'red', fontWeight: 'bold' }}>Inactividad Detectada (+1 min sin acción)</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan={3} style={{ padding: '10px', textAlign: 'center', color: 'green' }}>¡Excelente! No hay alertas de inactividad recientes.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ marginBottom: 10, display: 'flex', gap: 10 }}>
                            <button onClick={() => setShowAddModal(true)}>👤 Añadir Nuevo Empleado</button>
                            <button className="error" onClick={() => {
                                setEmpToDelete(null);
                                setShowDeleteModal(true);
                            }}>❌ Eliminar Empleado</button>
                        </div>
                        <div className="sunken-panel" style={{ flex: 1, backgroundColor: 'white', overflow: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid black', position: 'sticky', top: 0, backgroundColor: '#c0c0c0' }}>
                                        <th style={{ padding: '8px' }}>Nº</th>
                                        <th style={{ padding: '8px' }}>Nombre</th>
                                        <th style={{ padding: '8px' }}>Password</th>
                                        <th style={{ padding: '8px' }}>Rol (Nivel)</th>
                                        <th style={{ padding: '8px' }}>Inicio Jornada (Login)</th>
                                        <th style={{ padding: '8px' }}>Fin Jornada (Logout)</th>
                                        <th style={{ padding: '8px' }}>Estado</th>
                                        <th style={{ padding: '8px' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employees.map(emp => (
                                        <tr key={emp.id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '8px' }}>{emp.workerNumber || '---'}</td>
                                            <td style={{ padding: '8px' }}><b>{emp.username}</b></td>
                                            <td style={{ padding: '8px', fontFamily: 'monospace' }}>{emp.password || '123'}</td>
                                            <td style={{ padding: '8px' }}>{roleNames[emp.role] || emp.role} ({emp.role})</td>
                                            <td style={{ padding: '8px' }}>{emp.lastLogin}</td>
                                            <td style={{ padding: '8px' }}>{emp.lastLogout || '-'}</td>
                                            <td style={{ padding: '8px' }}>{emp.active ? '✅ Activo' : '❌ Inactivo'}</td>
                                            <td style={{ padding: '8px' }}>
                                                <button className="error" onClick={() => handleDeleteEmployee(emp.id)}>Borrar</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {showAddModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="window" style={{ width: '350px' }}>
                        <div className="title-bar">
                            <div className="title-bar-text">Nuevo Empleado</div>
                            <div className="title-bar-controls">
                                <button aria-label="Close" onClick={() => setShowAddModal(false)}></button>
                            </div>
                        </div>
                        <div className="window-body">
                            <form onSubmit={handleAddEmployee}>
                                <div className="field-row-stacked">
                                    <label>Nombre de Usuario (Login):</label>
                                    <input
                                        type="text"
                                        value={newEmp.username}
                                        onChange={e => setNewEmp({ ...newEmp, username: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="field-row-stacked" style={{ marginTop: 10 }}>
                                    <label>Contraseña:</label>
                                    <input
                                        type="text"
                                        value={newEmp.password}
                                        onChange={e => setNewEmp({ ...newEmp, password: e.target.value })}
                                        placeholder="Por defecto: 123"
                                    />
                                </div>
                                <div className="field-row-stacked" style={{ marginTop: 10 }}>
                                    <label>Rol asignado:</label>
                                    <select
                                        value={newEmp.role}
                                        onChange={e => setNewEmp({ ...newEmp, role: e.target.value })}
                                    >
                                        <option value="1">1 - Director</option>
                                        <option value="2">2 - Administrador</option>
                                        <option value="3">3 - Moderador</option>
                                        <option value="4">4 - Publicidad</option>
                                        <option value="5">5 - Servicio Técnico</option>
                                        <option value="6">6 - Desarrollador</option>
                                    </select>
                                </div>
                                <div className="field-row" style={{ marginTop: 20, justifyContent: 'flex-end' }}>
                                    <button type="submit">Guardar</button>
                                    <button type="button" onClick={() => setShowAddModal(false)}>Cancelar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1001
                }}>
                    <div className="window" style={{ width: '320px' }}>
                        <div className="title-bar">
                            <div className="title-bar-text">Eliminar Empleado</div>
                            <div className="title-bar-controls">
                                <button aria-label="Close" onClick={() => setShowDeleteModal(false)}></button>
                            </div>
                        </div>
                        <div className="window-body">
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 15, marginBottom: 20 }}>
                                <img src="https://win98icons.alexmeub.com/icons/png/msg_warning-2.png" alt="Warning" style={{ width: 32, height: 32 }} />
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: '0 0 10px 0' }}>Busca el empleado para darlo de baja:</p>
                                    <input
                                        type="text"
                                        placeholder="Nombre o Nº empleado..."
                                        style={{ width: '100%', marginBottom: '10px' }}
                                        value={deleteSearchTerm}
                                        onChange={(e) => {
                                            setDeleteSearchTerm(e.target.value);
                                            setEmpToDelete(null); // Reset choice when searching new
                                        }}
                                    />

                                    <div className="sunken-panel" style={{
                                        backgroundColor: 'white',
                                        height: '140px',
                                        overflowY: 'auto',
                                        padding: '2px',
                                        border: '1px solid #808080'
                                    }}>
                                        {employees
                                            .filter(e =>
                                                e.username.toLowerCase().includes(deleteSearchTerm.toLowerCase()) ||
                                                String(e.workerNumber || '').includes(deleteSearchTerm)
                                            )
                                            .map(e => (
                                                <div
                                                    key={e.id}
                                                    onClick={() => setEmpToDelete(e.id)}
                                                    style={{
                                                        padding: '4px 8px',
                                                        cursor: 'pointer',
                                                        backgroundColor: empToDelete === e.id ? '#000080' : 'transparent',
                                                        color: empToDelete === e.id ? 'white' : 'black',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    [{e.workerNumber || '---'}] {e.username}
                                                </div>
                                            ))
                                        }
                                        {employees.filter(e =>
                                            e.username.toLowerCase().includes(deleteSearchTerm.toLowerCase()) ||
                                            String(e.workerNumber || '').includes(deleteSearchTerm)
                                        ).length === 0 && (
                                                <div style={{ padding: '10px', color: 'gray', textAlign: 'center' }}>
                                                    No se encontraron resultados
                                                </div>
                                            )}
                                    </div>

                                    {empToDelete && (
                                        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#e1e1e1', border: '1px solid #808080' }}>
                                            <p style={{ margin: 0, fontSize: '12px' }}>Empleado seleccionado:</p>
                                            <p style={{ margin: '5px 0 0 0', fontWeight: 'bold', color: '#a00000' }}>
                                                {employees.find(e => e.id === empToDelete)?.username}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="field-row" style={{ justifyContent: 'center', gap: 10 }}>
                                <button disabled={!empToDelete} onClick={confirmDeleteEmployee} style={{ width: 80 }}>Eliminar</button>
                                <button onClick={() => { setShowDeleteModal(false); setDeleteSearchTerm(''); }} style={{ width: 80 }}>Cancelar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="status-bar" style={{ marginTop: 'auto' }}>
                <p className="status-bar-field">Modo: {activeTab === 'logs' ? 'Auditoría' : 'Gestión Staff'}</p>
                <p className="status-bar-field">Acceso: Director de Sistema</p>
            </div>
        </div>
    );
}
