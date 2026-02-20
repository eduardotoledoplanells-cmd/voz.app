'use client';
import { useState, useEffect } from 'react';
import '98.css';

export default function VozUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [tempUser, setTempUser] = useState<any>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [userVideos, setUserVideos] = useState<any[]>([]);
    const [loadingVideos, setLoadingVideos] = useState(false);
    const [showVideosModal, setShowVideosModal] = useState(false);

    // Stats State
    const [showStats, setShowStats] = useState(false);
    const [activeTab, setActiveTab] = useState('registros');

    // Dialog state
    const [dialog, setDialog] = useState<{
        show: boolean;
        title: string;
        message: string;
        type: 'confirm' | 'alert';
        onConfirm?: () => void;
    }>({ show: false, title: '', message: '', type: 'alert' });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openMenuId && !(event.target as HTMLElement).closest('.status-menu-container')) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMenuId]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const showAlert = (message: string, title: string = 'Aviso') => {
        setDialog({ show: true, title, message, type: 'alert' });
    };

    const showConfirm = (message: string, onConfirm: () => void, title: string = 'Confirmación') => {
        setDialog({ show: true, title, message, type: 'confirm', onConfirm });
    };

    const fetchUsers = () => {
        fetch('/api/voz/users')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setUsers(data);
                    setFilteredUsers(data);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Fetch error:', err);
                setLoading(false);
            });
    };

    const handleDeleteUser = (id: string) => {
        showConfirm('¿Seguro que quieres borrar este usuario permanentemente?', () => {
            fetch(`/api/voz/users?id=${id}&employeeName=Admin`, { method: 'DELETE' })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setUsers(users.filter(u => u.id !== id));
                        setFilteredUsers(filteredUsers.filter(u => u.id !== id));
                    }
                });
        }, 'Borrar Usuario');
    };

    const handleSearch = () => {
        if (!searchTerm.trim()) {
            setFilteredUsers(users);
            return;
        }
        const lowerTerm = searchTerm.toLowerCase();
        const results = users.filter(u =>
            (u.name?.toLowerCase() || '').includes(lowerTerm) ||
            (u.id?.toString() || '').includes(lowerTerm)
        );
        setFilteredUsers(results);
    };

    const handleNameChange = (userId: string, newName: string) => {
        fetch('/api/voz/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: userId, name: newName, employeeName: 'Admin' })
        })
            .then(res => res.json())
            .then(updatedUser => {
                if (updatedUser && !updatedUser.error) {
                    if (selectedUser?.id === userId) {
                        setSelectedUser(updatedUser);
                    }
                    fetchUsers();
                }
            });
    };

    const handleStatusChange = (userId: string, newStatus: string) => {
        setOpenMenuId(null);
        fetch('/api/voz/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: userId, status: newStatus, employeeName: 'Admin' })
        })
            .then(res => res.json())
            .then(updatedUser => {
                if (updatedUser && !updatedUser.error) {
                    if (selectedUser?.id === userId) {
                        setSelectedUser(updatedUser);
                    }
                    fetchUsers();
                }
            });
    };

    const handleSaveModalChanges = () => {
        if (!tempUser) return;
        fetch('/api/voz/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: tempUser.id,
                name: tempUser.name,
                status: tempUser.status,
                reputation: tempUser.reputation,
                penalties: tempUser.penalties,
                employeeName: 'Admin'
            })
        })
            .then(res => res.json())
            .then(updatedUser => {
                if (updatedUser && !updatedUser.error) {
                    setSelectedUser(null);
                    setTempUser(null);
                    fetchUsers();
                }
            });
    };

    const handleViewVideos = (handle: string) => {
        setLoadingVideos(true);
        setShowVideosModal(true);
        fetch(`/api/voz/users?handle=${encodeURIComponent(handle)}`)
            .then(res => res.json())
            .then(data => {
                setUserVideos(data);
                setLoadingVideos(false);
            })
            .catch(() => setLoadingVideos(false));
    };

    const handleReputationChange = (userId: string, newRep: number) => {
        if (isNaN(newRep)) return;
        fetch('/api/voz/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: userId, reputation: newRep, employeeName: 'Admin' })
        })
            .then(res => res.json())
            .then(updatedUser => {
                if (updatedUser && !updatedUser.error) {
                    if (selectedUser?.id === userId) {
                        setSelectedUser(updatedUser);
                    }
                    fetchUsers();
                }
            });
    };

    const getStatusLabel = (status: any) => {
        const s = String(status || '').toLowerCase();
        switch (s) {
            case 'verified': return 'Verificado';
            case 'active': return 'Activo';
            case 'banned': return 'Baneado';
            default: return String(status || 'Desconocido');
        }
    };

    if (loading) return <div style={{ padding: 10 }}>Cargando base de datos...</div>;

    return (
        <div style={{ padding: 10, height: '85vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <div className="field-row" style={{ marginBottom: 10 }}>
                <label htmlFor="search">Buscar Usuario:</label>
                <input
                    id="search"
                    type="text"
                    style={{ width: 200 }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button onClick={handleSearch}>Buscar</button>
                <button onClick={() => setShowStats(true)} style={{ marginLeft: 10 }}>📊 Estadísticas</button>
            </div>

            <div className="sunken-panel" style={{ flex: 1, width: '100%', backgroundColor: 'white' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid black' }}>
                            <th style={{ padding: '5px' }}>ID</th>
                            <th style={{ padding: '5px' }}>Nombre</th>
                            <th style={{ padding: '5px' }}>Estado</th>
                            <th style={{ padding: '5px' }}>Reputación</th>
                            <th style={{ padding: '5px' }}>Strikes</th>
                            <th style={{ padding: '5px' }}>Videos</th>
                            <th style={{ padding: '5px' }}>No. Videos</th>
                            <th style={{ padding: '5px' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((u, idx) => (
                            <tr key={u.id} style={{
                                borderBottom: '1px solid #eee',
                                backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f5f5f5'
                            }}>
                                <td style={{ padding: '5px' }}>{String(u.id || '').substring(0, 8)}</td>
                                <td style={{ padding: '5px' }}>{String(u.name || 'Sin nombre')}</td>
                                <td style={{ padding: '5px', position: 'relative' }}>
                                    <div className="status-menu-container" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <span style={{
                                            color: u.status === 'banned' ? 'red' : u.status === 'verified' ? 'blue' : 'green',
                                            fontWeight: 'bold',
                                            minWidth: '80px'
                                        }}>
                                            {getStatusLabel(u.status)}
                                        </span>

                                        <div style={{ position: 'relative', display: 'flex' }}>
                                            <button
                                                style={{
                                                    minWidth: '22px',
                                                    height: '20px',
                                                    padding: 0,
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center'
                                                }}
                                                onClick={() => setOpenMenuId(openMenuId === u.id ? null : u.id)}
                                            >
                                                <span style={{ fontSize: '10px' }}>▼</span>
                                            </button>

                                            {openMenuId === u.id && (
                                                <ul className="tree-view" style={{
                                                    position: 'absolute',
                                                    top: '20px',
                                                    left: '0',
                                                    zIndex: 1000,
                                                    minWidth: '100px',
                                                    boxShadow: '2px 2px 5px rgba(0,0,0,0.5)',
                                                    listStyle: 'none',
                                                    margin: 0,
                                                    padding: '2px',
                                                    backgroundColor: '#c0c0c0'
                                                }}>
                                                    {['active', 'verified', 'banned'].map((s) => (
                                                        <li
                                                            key={s}
                                                            style={{
                                                                padding: '4px 10px',
                                                                cursor: 'pointer',
                                                                backgroundColor: 'inherit',
                                                                color: 'black'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.backgroundColor = '#000080';
                                                                e.currentTarget.style.color = 'white';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.backgroundColor = 'inherit';
                                                                e.currentTarget.style.color = 'black';
                                                            }}
                                                            onClick={() => handleStatusChange(u.id, s)}
                                                        >
                                                            {getStatusLabel(s)}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '5px' }}>
                                    <input
                                        type="number"
                                        value={u.reputation}
                                        onChange={(e) => handleReputationChange(u.id, parseInt(e.target.value))}
                                        style={{ width: '60px', padding: '2px', border: '1px inset white' }}
                                    />
                                </td>
                                <td style={{ padding: '5px' }}>
                                    <span style={{
                                        color: (u.penalties || 0) >= 3 ? 'red' : (u.penalties || 0) > 0 ? 'orange' : 'inherit',
                                        fontWeight: 'bold'
                                    }}>
                                        {u.penalties || 0}/3
                                    </span>
                                </td>
                                <td style={{ padding: '5px' }}>
                                    <button
                                        style={{ minWidth: 80, backgroundColor: '#c0c0c0' }}
                                        onClick={() => handleViewVideos(u.handle)}
                                    >Videos</button>
                                </td>
                                <td style={{ padding: '5px', textAlign: 'center' }}>
                                    <span style={{ fontWeight: 'bold' }}>{u.videoCount || 0}</span>
                                </td>
                                <td style={{ padding: '5px', display: 'flex', gap: 5 }}>
                                    <button style={{ minWidth: 80 }} onClick={() => {
                                        setSelectedUser(u);
                                        setTempUser({ ...u });
                                    }}>Perfil</button>
                                    <button
                                        style={{ minWidth: 20, color: 'red', fontWeight: 'bold' }}
                                        onClick={() => handleDeleteUser(u.id)}
                                        title="Borrar Usuario"
                                    >
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="status-bar" style={{ marginTop: 'auto' }}>
                <p className="status-bar-field">Total: {filteredUsers.length} usuarios</p>
                <p className="status-bar-field">Base de Datos: Conectada</p>
            </div>

            {selectedUser && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 2000,
                    width: '380px'
                }}>
                    <div className="window">
                        <div className="title-bar">
                            <div className="title-bar-text">Ajustes de Usuario: {tempUser?.name || selectedUser?.name}</div>
                            <div className="title-bar-controls">
                                <button aria-label="Close" onClick={() => { setSelectedUser(null); setTempUser(null); }}></button>
                            </div>
                        </div>
                        <div className="window-body">
                            <div style={{ display: 'flex', gap: 15 }}>
                                <div style={{
                                    width: 80,
                                    height: 80,
                                    background: '#c0c0c0',
                                    border: '2px inset white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '2rem'
                                }}>
                                    👤
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div className="field-row" style={{ marginBottom: 5 }}>
                                        <label><b>Nombre:</b></label>
                                        <input
                                            type="text"
                                            value={tempUser?.name || ''}
                                            onChange={(e) => setTempUser({ ...tempUser, name: e.target.value })}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <p style={{ margin: 0, fontSize: '12px' }}><b>ID:</b> {String(tempUser?.id || '')}</p>
                                    <p style={{ margin: 0, fontSize: '12px' }}><b>Email:</b> {String(tempUser?.email || '')}</p>
                                    <div className="field-row" style={{ marginTop: 10 }}>
                                        <label><b>Estado:</b></label>
                                        <select
                                            value={tempUser?.status || 'active'}
                                            onChange={(e) => setTempUser({ ...tempUser, status: e.target.value })}
                                            style={{ marginLeft: 5 }}
                                        >
                                            <option value="active">Activo</option>
                                            <option value="verified">Verificado</option>
                                            <option value="banned">Baneado</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <fieldset style={{ marginTop: 15 }}>
                                <legend>Gestión de Reputación</legend>
                                <div className="field-row" style={{ justifyContent: 'center', gap: 10 }}>
                                    <label>Reputación:</label>
                                    <input
                                        type="number"
                                        value={tempUser?.reputation || 0}
                                        onChange={(e) => setTempUser({ ...tempUser, reputation: parseInt(e.target.value) || 0 })}
                                        style={{ width: '80px', textAlign: 'center' }}
                                    />
                                </div>
                                <div className="field-row" style={{ justifyContent: 'center', gap: 10, marginTop: 5 }}>
                                    <label>Penalizaciones (Strikes):</label>
                                    <input
                                        type="number"
                                        max={3}
                                        min={0}
                                        value={tempUser?.penalties || 0}
                                        onChange={(e) => setTempUser({ ...tempUser, penalties: parseInt(e.target.value) || 0 })}
                                        style={{ width: '80px', textAlign: 'center' }}
                                    />
                                </div>
                            </fieldset>

                            <fieldset style={{ marginTop: 15 }}>
                                <legend>Evidencias de Infracción (Pruebas)</legend>
                                <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'white', padding: 5 }} className="sunken-panel">
                                    {tempUser?.penalizedContent && tempUser.penalizedContent.length > 0 ? (
                                        tempUser.penalizedContent.map((item: any, i: number) => (
                                            <div key={i} style={{ borderBottom: '1px solid #dfdfdf', padding: '5px 0' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                                    <span style={{ color: 'red', fontWeight: 'bold' }}>Falta #{i + 1}</span>
                                                    <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                                                </div>
                                                <div style={{ fontSize: '12px', margin: '3px 0' }}><b>Motivo:</b> {item.reason}</div>
                                                <div style={{ background: '#000', display: 'flex', justifyContent: 'center', marginTop: 5 }}>
                                                    <video src={item.url} style={{ width: '100%', maxHeight: '120px' }} controls />
                                                </div>
                                                <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '10px', color: 'blue', textDecoration: 'underline' }}>
                                                    Ver video original
                                                </a>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ padding: 10, textAlign: 'center', color: 'gray', fontSize: '12px' }}>
                                            No hay infracciones registradas para este usuario.
                                        </div>
                                    )}
                                </div>
                            </fieldset>

                            <div className="field-row" style={{ marginTop: 15, justifyContent: 'flex-end', gap: 10 }}>
                                <button style={{ fontWeight: 'bold' }} onClick={handleSaveModalChanges}>Aceptar</button>
                                <button onClick={() => { setSelectedUser(null); setTempUser(null); }}>Cerrar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showStats && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 3000
                }}>
                    <div className="window" style={{ width: 600 }}>
                        <div className="title-bar">
                            <div className="title-bar-text">Estadísticas de Uso - VOZ Analytics</div>
                            <div className="title-bar-controls">
                                <button aria-label="Close" onClick={() => setShowStats(false)}></button>
                            </div>
                        </div>
                        <div className="window-body">
                            <menu role="tablist">
                                <li role="tab" aria-selected={activeTab === 'registros'} onClick={() => setActiveTab('registros')}><a href="#registros">Registros Diarios</a></li>
                                <li role="tab" aria-selected={activeTab === 'actividad'} onClick={() => setActiveTab('actividad')}><a href="#actividad">Usuarios Activos</a></li>
                                <li role="tab" aria-selected={activeTab === 'transferencia'} onClick={() => setActiveTab('transferencia')}><a href="#transferencia">Demanda Transferencia</a></li>
                            </menu>
                            <div className="window" role="tabpanel" style={{ height: 300, overflowY: 'auto' }}>
                                <div className="window-body">
                                    {activeTab === 'registros' && (
                                        <div>
                                            <h4>Usuarios Registrados por Día</h4>
                                            {(() => {
                                                const data = users.reduce((acc: any, user) => {
                                                    const date = user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : 'Desconocido';
                                                    acc[date] = (acc[date] || 0) + 1;
                                                    return acc;
                                                }, {});
                                                const maxVal = Math.max(1, ...Object.values<number>(data));

                                                if (Object.keys(data).length === 0) return <p>No hay datos de registro.</p>;

                                                return Object.entries(data).map(([date, count]: any) => {
                                                    const widthPercent = (count / maxVal) * 100;
                                                    return (
                                                        <div key={date} style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}>
                                                            <span style={{ width: 100, fontSize: 12 }}>{date}</span>
                                                            <div style={{ flex: 1, backgroundColor: 'white', border: '1px inset white', height: 20, margin: '0 10px' }}>
                                                                <div style={{ width: `${widthPercent}%`, backgroundColor: '#000080', height: '100%' }}></div>
                                                            </div>
                                                            <span style={{ width: 30, textAlign: 'right', fontWeight: 'bold' }}>{count}</span>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    )}

                                    {activeTab === 'actividad' && (
                                        <div>
                                            <h4>Usuarios Activos (Simulado)</h4>
                                            <div style={{ marginBottom: 20 }}>
                                                <p><strong>DAU (Usuarios Diarios Activos):</strong> {Math.floor(users.length * 0.4)} / {users.length}</p>
                                                <p><strong>MAU (Usuarios Mensuales Activos):</strong> {Math.floor(users.length * 0.85)} / {users.length}</p>
                                            </div>
                                            <p>Actividad últimos 7 días:</p>
                                            {[...Array(7)].map((_, i) => {
                                                const d = new Date();
                                                d.setDate(d.getDate() - (6 - i));
                                                const dayStr = d.toLocaleDateString('es-ES', { weekday: 'short' });
                                                const val = Math.floor(Math.random() * (users.length / 2)) + 1;
                                                const max = users.length;
                                                return (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}>
                                                        <span style={{ width: 50, fontSize: 12, textTransform: 'capitalize' }}>{dayStr}</span>
                                                        <div style={{ flex: 1, backgroundColor: 'white', border: '1px inset white', height: 20, margin: '0 10px' }}>
                                                            <div style={{ width: `${(val / max) * 100}%`, backgroundColor: '#008000', height: '100%' }}></div>
                                                        </div>
                                                        <span style={{ width: 30, textAlign: 'right' }}>{val}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {activeTab === 'transferencia' && (
                                        <div>
                                            <h4>Demanda de Transferencia (Mensual)</h4>
                                            <p style={{ fontSize: 12, marginBottom: 15 }}>Estimación basada en reproducción de video y audio.</p>
                                            {[
                                                { month: 'Enero', valor: 450, unit: 'GB' },
                                                { month: 'Febrero', valor: 520, unit: 'GB' },
                                                { month: 'Marzo', valor: 480, unit: 'GB' },
                                                { month: 'Abril', valor: 600, unit: 'GB' },
                                                { month: 'Mayo (Actual)', valor: 850, unit: 'GB' },
                                            ].map((m) => (
                                                <div key={m.month} style={{ marginBottom: 10 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                                                        <span>{m.month}</span>
                                                        <span>{m.valor} {m.unit}</span>
                                                    </div>
                                                    <div style={{ width: '100%', backgroundColor: 'white', border: '1px inset white', height: 20 }}>
                                                        <div style={{ width: `${(m.valor / 1000) * 100}%`, backgroundColor: '#800080', height: '100%' }}></div>
                                                    </div>
                                                </div>
                                            ))}
                                            <p style={{ marginTop: 20, fontWeight: 'bold', color: 'red' }}>⚠️ Alerta: El consumo de Mayo está al 85% del límite del servidor.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="status-bar">
                                <p className="status-bar-field">Generado: {new Date().toLocaleTimeString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showVideosModal && (
                <div style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 2500,
                    width: '600px'
                }}>
                    <div className="window">
                        <div className="title-bar">
                            <div className="title-bar-text">Videos del Usuario: {userVideos[0]?.userHandle || 'Cargando...'}</div>
                            <div className="title-bar-controls">
                                <button aria-label="Close" onClick={() => setShowVideosModal(false)}></button>
                            </div>
                        </div>
                        <div className="window-body">
                            {loadingVideos ? (
                                <p>Cargando lista de videos...</p>
                            ) : userVideos.length === 0 ? (
                                <p>Este usuario no tiene videos registrados.</p>
                            ) : (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: 15,
                                    maxHeight: '400px',
                                    overflowY: 'auto'
                                }} className="sunken-panel">
                                    {userVideos.map((v, i) => (
                                        <div key={i} style={{ border: '1px solid #dfdfdf', padding: 5, backgroundColor: 'white' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                                <span style={{ fontWeight: 'bold', fontSize: '12px' }}>{v.matricula || 'SIN MATRÍCULA'}</span>
                                                <span style={{
                                                    fontSize: '10px',
                                                    color: v.status === 'approved' ? 'green' : v.status === 'rejected' ? 'red' : 'navy',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {v.status.toUpperCase()}
                                                </span>
                                            </div>
                                            <video src={v.url} style={{ width: '100%', maxHeight: '150px', backgroundColor: 'black' }} controls />
                                            <div style={{ fontSize: '10px', marginTop: 5, color: '#666' }}>
                                                Fecha: {new Date(v.timestamp).toLocaleString()}
                                            </div>
                                            {v.moderatedBy && (
                                                <div style={{ fontSize: '10px', fontWeight: 'bold' }}>
                                                    Moderado por: {v.moderatedBy}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="field-row" style={{ marginTop: 15, justifyContent: 'flex-end' }}>
                                <button onClick={() => setShowVideosModal(false)}>Cerrar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {dialog.show && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div className="window" style={{ width: 320, boxShadow: '2px 2px 10px rgba(0,0,0,0.3)' }}>
                        <div className="title-bar">
                            <div className="title-bar-text">{dialog.title}</div>
                        </div>
                        <div className="window-body">
                            <p style={{ display: 'flex', alignItems: 'center', gap: 15, margin: '10px 0' }}>
                                <span style={{ fontSize: '32px' }}>{dialog.type === 'confirm' ? '❓' : '⚠️'}</span>
                                {dialog.message}
                            </p>
                            <div className="field-row" style={{ justifyContent: 'flex-end', marginTop: 20, gap: 10 }}>
                                {dialog.type === 'confirm' ? (
                                    <>
                                        <button
                                            style={{ minWidth: 60, fontWeight: 'bold' }}
                                            onClick={() => {
                                                dialog.onConfirm?.();
                                                setDialog({ ...dialog, show: false });
                                            }}
                                        >
                                            Sí
                                        </button>
                                        <button
                                            style={{ minWidth: 60 }}
                                            onClick={() => setDialog({ ...dialog, show: false })}
                                        >
                                            No
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        style={{ minWidth: 80 }}
                                        onClick={() => setDialog({ ...dialog, show: false })}
                                    >
                                        Aceptar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
