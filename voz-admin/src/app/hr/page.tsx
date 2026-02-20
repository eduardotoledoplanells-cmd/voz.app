'use client';
import { useState, useEffect } from 'react';
import '98.css';

export default function VozHrPage() {
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form state
    const [newEmp, setNewEmp] = useState({
        username: '',
        workerNumber: '',
        password: '123',
        role: '3' // 3: Moderator by default
    });

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = () => {
        setLoading(true);
        fetch('/api/voz/employees')
            .then(res => res.json())
            .then(data => {
                setEmployees(data);
                setLoading(false);
            })
            .catch(err => setLoading(false));
    };

    const handleCreateEmployee = (e: React.FormEvent) => {
        e.preventDefault();

        if (!newEmp.username || !newEmp.workerNumber) {
            alert("Rellena todos los campos.");
            return;
        }

        fetch('/api/voz/employees', {
            method: 'POST',
            body: JSON.stringify(newEmp),
            headers: { 'Content-Type': 'application/json' }
        })
            .then(res => res.json())
            .then(() => {
                setShowModal(false);
                setNewEmp({ username: '', workerNumber: '', password: '123', role: '3' });
                fetchEmployees();
            });
    };

    if (loading && employees.length === 0) return <div style={{ padding: 10 }}>Cargando HR...</div>;

    return (
        <div style={{ padding: 10, height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <div className="field-row" style={{ marginBottom: 10 }}>
                <button onClick={() => setShowModal(true)}>👤 Nuevo Empleado</button>
            </div>

            {/* MODAL CREACION ESTILO 98 */}
            {showModal && (
                <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)', zIndex: 100,
                    width: '300px'
                }} className="window">
                    <div className="title-bar">
                        <div className="title-bar-text">Añadir Nuevo Empleado</div>
                        <div className="title-bar-controls">
                            <button aria-label="Close" onClick={() => setShowModal(false)}></button>
                        </div>
                    </div>
                    <div className="window-body">
                        <form onSubmit={handleCreateEmployee}>
                            <div className="field-row-stacked">
                                <label>Nombre del Empleado:</label>
                                <input type="text" value={newEmp.username} onChange={e => setNewEmp({ ...newEmp, username: e.target.value })} />
                            </div>
                            <div className="field-row-stacked">
                                <label>Número de Empleado:</label>
                                <input type="text" placeholder="Ej: 005" value={newEmp.workerNumber} onChange={e => setNewEmp({ ...newEmp, workerNumber: e.target.value })} />
                            </div>
                            <div className="field-row-stacked">
                                <label>Contraseña:</label>
                                <input type="password" value={newEmp.password} onChange={e => setNewEmp({ ...newEmp, password: e.target.value })} />
                            </div>
                            <div className="field-row-stacked">
                                <label>Rol:</label>
                                <select value={newEmp.role} onChange={e => setNewEmp({ ...newEmp, role: e.target.value })}>
                                    <option value="1">Director (1)</option>
                                    <option value="2">Administrador (2)</option>
                                    <option value="3">Moderador (3)</option>
                                    <option value="4">Publicidad (4)</option>
                                    <option value="5">Servicio Técnico (5)</option>
                                    <option value="6">Desarrollador (6)</option>
                                </select>
                            </div>
                            <div className="field-row" style={{ justifyContent: 'flex-end', marginTop: 15 }}>
                                <button type="submit">Aceptar</button>
                                <button type="button" onClick={() => setShowModal(false)}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="sunken-panel" style={{ height: '400px', width: '100%', backgroundColor: 'white', overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid black', backgroundColor: '#c0c0c0', position: 'sticky', top: 0 }}>
                            <th style={{ padding: '2px 5px' }}>Nº</th>
                            <th style={{ padding: '2px 5px' }}>Empleado</th>
                            <th style={{ padding: '2px 5px' }}>Rol</th>
                            <th style={{ padding: '2px 5px' }}>Último Acceso</th>
                            <th style={{ padding: '2px 5px' }}>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map(e => (
                            <tr key={e.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                                <td style={{ padding: '2px 5px' }}>{e.workerNumber || '---'}</td>
                                <td style={{ padding: '2px 5px', fontWeight: 'bold' }}>{e.username}</td>
                                <td style={{ padding: '2px 5px' }}>{e.role}</td>
                                <td style={{ padding: '2px 5px' }}>{e.lastLogin}</td>
                                <td style={{ padding: '2px 5px' }}>
                                    <div className="field-row">
                                        <input type="checkbox" checked={e.active} disabled />
                                        <label>Activo</label>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="field-row" style={{ marginTop: 10 }}>
                <div style={{ padding: 5, border: '1px dotted gray', width: '100%', fontSize: '11px' }}>
                    ℹ️ Roles: Director(1), Administrador(2), Moderador(3), Publicidad(4), Servicio Técnico(5), Desarrollador(6).
                </div>
            </div>
        </div>
    );
}
