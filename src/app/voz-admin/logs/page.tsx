'use client';
import { useState, useEffect } from 'react';
import '98.css';

export default function DirectorLogsPage() {
    const [activeTab, setActiveTab] = useState<'logs' | 'staff'>('logs');
    const [logs, setLogs] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Employee Form State
    const [showAddModal, setShowAddModal] = useState(false);
    const [newEmp, setNewEmp] = useState({ username: '', role: '3', password: '' });

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
        const endpoint = activeTab === 'logs' ? '/api/voz/logs' : '/api/voz/employees';
        fetch(endpoint)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    if (activeTab === 'logs') setLogs(data);
                    else setEmployees(data);
                }
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
                setNewEmp({ username: '', role: '3', password: '' });
            });
    };

    const handleDeleteEmployee = (id: string) => {
        if (!confirm('¿Seguro que quieres eliminar a este empleado?')) return;
        fetch(`/api/voz/employees?id=${id}`, { method: 'DELETE' })
            .then(() => fetchData());
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
                                    {filteredLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'gray' }}>
                                                No se encontraron registros.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredLogs.map((log) => (
                                            <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                                                <td style={{ padding: '8px', whiteSpace: 'nowrap' }}>
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </td>
                                                <td style={{ padding: '8px' }}><b>{log.employeeName}</b></td>
                                                <td style={{ padding: '8px' }}>{log.action}</td>
                                                <td style={{ padding: '8px', fontSize: '0.85rem', color: '#666' }}>
                                                    {log.details || '-'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ marginBottom: 10 }}>
                            <button onClick={() => setShowAddModal(true)}>Añadir Nuevo Empleado</button>
                        </div>
                        <div className="sunken-panel" style={{ flex: 1, backgroundColor: 'white', overflow: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid black', position: 'sticky', top: 0, backgroundColor: '#c0c0c0' }}>
                                        <th style={{ padding: '8px' }}>Nombre</th>
                                        <th style={{ padding: '8px' }}>Password</th>
                                        <th style={{ padding: '8px' }}>Rol (Nivel)</th>
                                        <th style={{ padding: '8px' }}>Último Acceso</th>
                                        <th style={{ padding: '8px' }}>Estado</th>
                                        <th style={{ padding: '8px' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employees.map(emp => (
                                        <tr key={emp.id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '8px' }}><b>{emp.username}</b></td>
                                            <td style={{ padding: '8px', fontFamily: 'monospace' }}>{emp.password || '123'}</td>
                                            <td style={{ padding: '8px' }}>{roleNames[emp.role] || emp.role} ({emp.role})</td>
                                            <td style={{ padding: '8px' }}>{emp.lastLogin}</td>
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

            <div className="status-bar" style={{ marginTop: 'auto' }}>
                <p className="status-bar-field">Modo: {activeTab === 'logs' ? 'Auditoría' : 'Gestión Staff'}</p>
                <p className="status-bar-field">Acceso: Director de Sistema</p>
            </div>
        </div>
    );
}
