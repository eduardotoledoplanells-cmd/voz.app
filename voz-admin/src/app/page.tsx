'use client';
import { useState, useEffect } from 'react';
import '98.css';

export default function VozAdminDashboard() {
    const [stats, setStats] = useState({
        users: 0,
        pendingVideos: 0,
        revenue: 0,
        pendingRedemptions: 0,
        vozInteractions: 0,
        vozDistributed: 0
    });
    const [username, setUsername] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    const [logs, setLogs] = useState<any[]>([]);

    const [currentEmployee, setCurrentEmployee] = useState<any>(null);

    const fetchData = async () => {
        try {
            const [uRes, mRes, bRes, rRes, aRes] = await Promise.all([
                fetch('/api/voz/users'),
                fetch('/api/voz/moderation'),
                fetch('/api/voz/billing'),
                fetch('/api/voz/redemptions'),
                fetch('/api/voz/analytics')
            ]);

            const users = await uRes.json();
            const mod = await mRes.json();
            const billing = await bRes.json();
            const redemptions = await rRes.json();
            const analytics = await aRes.json();

            setStats({
                users: Array.isArray(users) ? users.length : 0,
                pendingVideos: Array.isArray(mod) ? mod.filter((m: any) => m.status === 'pending').length : 0,
                revenue: billing?.stats?.totalRevenue || 0,
                pendingRedemptions: Array.isArray(redemptions) ? redemptions.filter((r: any) => r.status === 'pending').length : 0,
                vozInteractions: analytics?.totalTips || 0,
                vozDistributed: analytics?.totalRevenueShared || 0
            });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        }
    };

    useEffect(() => {
        fetchData();
        fetchLogs();
        const stored = localStorage.getItem('vozEmployee');
        if (stored) {
            setCurrentEmployee(JSON.parse(stored));
        }
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

                const sessionData = {
                    id: emp.id,
                    username: emp.username,
                    role: emp.role,
                    workerNumber: emp.workerNumber || '???'
                };

                // Save session (simulated)
                localStorage.setItem('vozEmployee', JSON.stringify(sessionData));
                setCurrentEmployee(sessionData);

                // Register log WITH WORKER NUMBER and UPDATE lastLogin
                fetch('/api/voz/logs', {
                    method: 'POST',
                    body: JSON.stringify({
                        employeeName: `[${emp.workerNumber || '???'}] ${emp.username}`,
                        action: 'Inicio de Sesión',
                        details: `Rol: ${emp.role}. Inicio de jornada.`
                    }),
                    headers: { 'Content-Type': 'application/json' }
                });

                // Update Employee Last Login in DB
                fetch('/api/voz/employees', {
                    method: 'PATCH',
                    body: JSON.stringify({
                        id: emp.id,
                        lastLogin: new Date().toLocaleTimeString()
                    }),
                    headers: { 'Content-Type': 'application/json' }
                }).then(() => {
                    fetchLogs();
                    alert(`Bienvenido [${emp.workerNumber}] ${emp.username}. Jornada iniciada.`);
                    setUsername('');
                    setEmployeeId('');
                });
            });
    };

    const handleLogout = () => {
        if (!currentEmployee) return;

        fetch('/api/voz/employees', {
            method: 'PATCH',
            body: JSON.stringify({
                id: currentEmployee.id,
                lastLogout: new Date().toLocaleTimeString()
            }),
            headers: { 'Content-Type': 'application/json' }
        }).then(() => {
            localStorage.removeItem('vozEmployee');
            setCurrentEmployee(null);
            fetchLogs();
            alert('Jornada finalizada. Sesión cerrada.');
        });
    };

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '30px', height: '100%', overflowY: 'auto' }}>
            <div>
                <h4 style={{ marginBottom: '5px' }}>Bienvenido al centro de control de la app Voz</h4>
                <p>Centro de mando operativo. Datos actualizados en tiempo real desde la DB Central.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {/* Stats Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <fieldset style={{ border: '2px inset white', padding: '15px' }}>
                        <legend>Estado del Sistema</legend>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div style={{ textAlign: 'center', borderRight: '1px solid #808080' }}>
                                <p style={{ margin: 0, fontSize: '12px' }}>Usuarios Totales</p>
                                <h2 style={{ margin: '5px 0' }}>{stats.users.toLocaleString()}</h2>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ margin: 0, fontSize: '12px' }}>Videos Moderación</p>
                                <h2 style={{ margin: '5px 0', color: stats.pendingVideos > 0 ? 'red' : 'green' }}>
                                    {stats.pendingVideos}
                                </h2>
                            </div>
                            <div style={{ textAlign: 'center', borderTop: '1px solid #808080', borderRight: '1px solid #808080', paddingTop: '10px' }}>
                                <p style={{ margin: 0, fontSize: '12px' }}>Ingresos Brutos</p>
                                <h2 style={{ margin: '5px 0', color: '#008000' }}>{stats.revenue}€</h2>
                            </div>
                            <div style={{ textAlign: 'center', borderTop: '1px solid #808080', paddingTop: '10px' }}>
                                <p style={{ margin: 0, fontSize: '12px' }}>Canjes Pendientes</p>
                                <h2 style={{ margin: '5px 0', color: stats.pendingRedemptions > 0 ? 'orange' : 'inherit' }}>
                                    {stats.pendingRedemptions}
                                </h2>
                            </div>
                            <div style={{ textAlign: 'center', borderTop: '1px solid #808080', paddingTop: '10px', gridColumn: 'span 2' }}>
                                <p style={{ margin: 0, fontSize: '12px' }}>Actividad App VOZ (Regalos/PM)</p>
                                <h2 style={{ margin: '5px 0', color: '#8A2BE2' }}>
                                    {stats.vozInteractions} <span style={{ fontSize: '0.6em', color: 'black' }}>({stats.vozDistributed.toFixed(2)}€ Repartidos)</span>
                                </h2>
                            </div>
                        </div>
                    </fieldset>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <p style={{ margin: 0, fontWeight: 'bold' }}>Trabajadores Logeados:</p>
                            <div className="sunken-panel" style={{
                                padding: '10px',
                                backgroundColor: 'white',
                                height: '220px',
                                overflowY: 'scroll'
                            }}>
                                {logs.filter(l => l.action.includes('Sesión')).length === 0 ? (
                                    <p style={{ color: 'gray', fontSize: '0.85rem' }}>Sin actividad de conexión.</p>
                                ) : (
                                    <ul style={{ margin: 0, paddingLeft: '15px', fontSize: '0.85rem' }}>
                                        {logs.filter(l => l.action.includes('Sesión')).map((log) => (
                                            <li key={log.id} style={{ marginBottom: '4px' }}>
                                                [{new Date(log.timestamp).toLocaleTimeString()}] <b>{log.employeeName}</b>: {log.action}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <p style={{ margin: 0, fontWeight: 'bold' }}>Supervisión Moderación:</p>
                            <div className="sunken-panel" style={{
                                padding: '10px',
                                backgroundColor: '#f0f0f0',
                                height: '220px',
                                overflowY: 'scroll'
                            }}>
                                {logs.filter(l => l.action.includes('MODERACIÓN')).length === 0 ? (
                                    <p style={{ color: 'gray', fontSize: '0.85rem' }}>Sin acciones de moderación.</p>
                                ) : (
                                    <ul style={{ margin: 0, paddingLeft: '15px', fontSize: '0.85rem' }}>
                                        {logs.filter(l => l.action.includes('MODERACIÓN')).map((log) => (
                                            <li key={log.id} style={{ marginBottom: '4px' }}>
                                                [{new Date(log.timestamp).toLocaleTimeString()}] <b>{log.employeeName}</b>: {log.action === 'APPROVED MODERACIÓN' ? '✅ Aprobado' : '❌ Rechazado'}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Login Area */}
                <div className="window" style={{ maxWidth: '350px', alignSelf: 'start' }}>
                    <div className="title-bar">
                        <div className="title-bar-text">Control de Acceso</div>
                    </div>
                    <div className="window-body">
                        {currentEmployee ? (
                            <div style={{ textAlign: 'center' }}>
                                <p><strong>Identificado como:</strong></p>
                                <p style={{ fontSize: '1.2em', margin: '5px 0' }}>{currentEmployee.username}</p>
                                <p style={{ color: '#808080', fontSize: '0.9em' }}>Rol: {currentEmployee.role}</p>
                                <hr style={{ margin: '15px 0' }} />
                                <button
                                    onClick={handleLogout}
                                    style={{ width: '100%', padding: '8px', fontWeight: 'bold' }}
                                >
                                    🚪 Finalizar Jornada (Cerrar Sesión)
                                </button>
                            </div>
                        ) : (
                            <>
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
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
