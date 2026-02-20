'use client';
import { useState, useEffect } from 'react';
import '98.css';

export default function VozAdminDashboard() {
    const [stats, setStats] = useState({ users: 0, pendingVideos: 12 });
    const [username, setUsername] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/voz/users')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setStats(prev => ({ ...prev, users: data.length }));
                }
            });
        fetchLogs();
    }, []);

    const fetchLogs = () => {
        fetch('/api/voz/logs')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setLogs(data);
                }
            });
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !employeeId) return;

        // Fetch employees to find the one logging in
        fetch('/api/voz/employees')
            .then(res => res.json())
            .then(employees => {
                const emp = employees.find((e: any) => e.username.toLowerCase() === username.toLowerCase());

                if (!emp) {
                    alert('Usuario no encontrado en la base de datos de empleados.');
                    return;
                }

                // Verify password
                const expectedPass = emp.password || '123';
                if (employeeId !== expectedPass) {
                    alert('Código de Empleado (Password) incorrecto.');
                    return;
                }

                // Register log
                fetch('/api/voz/logs', {
                    method: 'POST',
                    body: JSON.stringify({
                        employeeName: username,
                        action: 'Inicio de Sesión',
                        details: `Rol: ${emp.role}`
                    }),
                    headers: { 'Content-Type': 'application/json' }
                }).then(() => fetchLogs());

                // Save session (simulated)
                localStorage.setItem('vozEmployee', JSON.stringify({
                    username: emp.username,
                    role: emp.role
                }));

                alert(`Bienvenido ${emp.username}. Sesión iniciada como Nivel ${emp.role}.`);
                setUsername('');
                setEmployeeId('');
                // Refresh to let layout pick up the new role
                window.location.reload();
            });
    };

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '30px', height: '100%', overflowY: 'auto' }}>
            <div>
                <h4 style={{ marginBottom: '5px' }}>Bienvenido al centro de control de la app Voz</h4>
                <p>Gestiona usuarios, contenido y publicidad desde un solo lugar.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {/* Stats Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <fieldset style={{ border: '2px inset white', padding: '15px' }}>
                        <legend>Estado del Sistema</legend>
                        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ margin: 0 }}>Usuarios Activos</p>
                                <h1 style={{ margin: '5px 0' }}>{stats.users.toLocaleString()}</h1>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ margin: 0 }}>Vídeos Pendientes</p>
                                <h1 style={{ margin: '5px 0', color: 'red' }}>{stats.pendingVideos}</h1>
                            </div>
                        </div>
                    </fieldset>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <p style={{ margin: 0, fontWeight: 'bold' }}>Logeados Recientes:</p>
                        <div className="sunken-panel" style={{
                            padding: '10px',
                            backgroundColor: 'white',
                            height: '180px',
                            overflowY: 'scroll'
                        }}>
                            {logs.length === 0 ? (
                                <p style={{ color: 'gray', fontSize: '0.85rem' }}>No hay actividad reciente.</p>
                            ) : (
                                <ul style={{ margin: 0, paddingLeft: '15px', fontSize: '0.85rem' }}>
                                    {logs.map((log) => (
                                        <li key={log.id} style={{ marginBottom: '4px' }}>
                                            [{new Date(log.timestamp).toLocaleTimeString()}] <b>{log.employeeName}</b>: {log.action}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                {/* Login Area */}
                <div className="window" style={{ maxWidth: '350px', alignSelf: 'start' }}>
                    <div className="title-bar">
                        <div className="title-bar-text">Inicio de Sesión de Empleado</div>
                    </div>
                    <div className="window-body">
                        <p>Identifícate para registrar tu actividad en el sistema.</p>
                        <form onSubmit={handleLogin}>
                            <div className="field-row-stacked" style={{ marginBottom: '10px' }}>
                                <label>Nombre de Usuario:</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="ej: admin_rober"
                                />
                            </div>
                            <div className="field-row-stacked" style={{ marginBottom: '15px' }}>
                                <label>Código de Empleado (Password):</label>
                                <input
                                    type="password"
                                    value={employeeId}
                                    onChange={(e) => setEmployeeId(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="field-row" style={{ justifyContent: 'flex-end', gap: '5px' }}>
                                <button type="submit" style={{ fontWeight: 'bold' }}>Acceder</button>
                                <button type="button" onClick={() => { setUsername(''); setEmployeeId(''); }}>Limpiar</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
