'use client';
import { useState, useEffect } from 'react';
import '98.css';

export default function VozUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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
            fetch(`/api/voz/users?id=${id}`, { method: 'DELETE' })
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
            body: JSON.stringify({ id: userId, name: newName })
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
            body: JSON.stringify({ id: userId, status: newStatus })
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

    const handleReputationChange = (userId: string, newRep: number) => {
        if (isNaN(newRep)) return;
        fetch('/api/voz/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: userId, reputation: newRep })
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
            </div>

            <div className="sunken-panel" style={{ flex: 1, width: '100%', backgroundColor: 'white' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid black' }}>
                            <th style={{ padding: '5px' }}>ID</th>
                            <th style={{ padding: '5px' }}>Nombre</th>
                            <th style={{ padding: '5px' }}>Estado</th>
                            <th style={{ padding: '5px' }}>Reputación</th>
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
                                <td style={{ padding: '5px', display: 'flex', gap: 5 }}>
                                    <button style={{ minWidth: 80 }} onClick={() => setSelectedUser(u)}>Perfil</button>
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
                            <div className="title-bar-text">Ajustes de Usuario: {selectedUser.name}</div>
                            <div className="title-bar-controls">
                                <button aria-label="Close" onClick={() => setSelectedUser(null)}></button>
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
                                            value={selectedUser.name}
                                            onChange={(e) => handleNameChange(selectedUser.id, e.target.value)}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.85rem' }}><b>ID:</b> {String(selectedUser.id || '')}</p>
                                    <p style={{ margin: 0, fontSize: '0.85rem' }}><b>Email:</b> {String(selectedUser.email || '')}</p>
                                    <div className="field-row" style={{ marginTop: 10 }}>
                                        <label><b>Estado:</b></label>
                                        <select
                                            value={selectedUser.status}
                                            onChange={(e) => handleStatusChange(selectedUser.id, e.target.value)}
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
                                        value={selectedUser.reputation}
                                        onChange={(e) => handleReputationChange(selectedUser.id, parseInt(e.target.value))}
                                        style={{ width: '80px', textAlign: 'center' }}
                                    />
                                </div>
                            </fieldset>

                            <div className="field-row" style={{ marginTop: 15, justifyContent: 'flex-end' }}>
                                <button onClick={() => setSelectedUser(null)}>Cerrar</button>
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
