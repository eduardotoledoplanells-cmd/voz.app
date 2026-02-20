'use client';
import { useState, useEffect } from 'react';
import '98.css';

export default function VozHrPage() {
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/voz/employees')
            .then(res => res.json())
            .then(data => {
                setEmployees(data);
                setLoading(false);
            })
            .catch(err => setLoading(false));
    }, []);

    const handleNewEmployee = () => {
        const username = prompt("Nombre de Usuario:");
        if (!username) return;

        fetch('/api/voz/employees', {
            method: 'POST',
            body: JSON.stringify({ username, role: 'moderator' }),
            headers: { 'Content-Type': 'application/json' }
        })
            .then(res => res.json())
            .then(newEmp => setEmployees([...employees, newEmp]));
    };

    if (loading) return <div style={{ padding: 10 }}>Cargando HR...</div>;

    return (
        <div style={{ padding: 10, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="field-row" style={{ marginBottom: 10 }}>
                <button onClick={handleNewEmployee}>👤 Nuevo Empleado</button>
            </div>

            <div className="sunken-panel" style={{ height: '300px', width: '100%', backgroundColor: 'white' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid black' }}>
                            <th>ID</th>
                            <th>Usuario</th>
                            <th>Rol</th>
                            <th>Último Acceso</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map(e => (
                            <tr key={e.id}>
                                <td>{e.id.substring(0, 8)}</td>
                                <td style={{ fontWeight: 'bold' }}>{e.username}</td>
                                <td>{e.role.toUpperCase()}</td>
                                <td>{new Date(e.lastLogin).toLocaleDateString()}</td>
                                <td>
                                    <input type="checkbox" checked={e.active} readOnly />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="field-row" style={{ marginTop: 10 }}>
                <div style={{ padding: 5, border: '1px dotted gray', width: '100%' }}>
                    ℹ️ Logs de auditoría disponibles en /logs
                </div>
            </div>
        </div>
    );
}
