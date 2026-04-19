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
    const [currentVideoUser, setCurrentVideoUser] = useState<string>('');
    const [withdrawals, setWithdrawals] = useState<any[]>([]);

    // Stats State
    const [showStats, setShowStats] = useState(false);
    const [statsData, setStatsData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('registros');

    // Strike Modal State
    const [showStrikeModal, setShowStrikeModal] = useState(false);
    const [strikeReason, setStrikeReason] = useState('');
    const [userToStrike, setUserToStrike] = useState<any>(null);

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
        setLoading(true);
        Promise.all([
            fetch('/api/voz/users').then(res => res.json()),
            fetch('/api/voz/stats').then(res => res.json()),
            fetch('/api/voz/wallet/withdrawals?t=' + Date.now()).then(res => res.json())
        ])
            .then(([usersData, statsRes, wRes]) => {
                if (Array.isArray(usersData)) {
                    setUsers(usersData);
                    setFilteredUsers(usersData);
                }
                if (statsRes && !statsRes.error) {
                    setStatsData(statsRes);
                }
                if (wRes && wRes.success) {
                    setWithdrawals(wRes.withdrawals);
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
        if (!tempUser || !selectedUser) return;

        const oldStrikes = selectedUser.strikes || 0;
        const newStrikes = tempUser.strikes || 0;
        const userHandle = tempUser.handle;

        fetch('/api/voz/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: tempUser.id,
                name: tempUser.name,
                handle: tempUser.handle,
                status: tempUser.status,
                strikes: tempUser.strikes,
                phone: tempUser.phone,
                employeeName: 'Admin'
            })
        })
            .then(res => res.json())
            .then(updatedUser => {
                if (updatedUser && !updatedUser.error) {
                    // Notify user if strikes changed
                    if (newStrikes !== oldStrikes) {
                        const cleanHandle = userHandle.replace('@', '');
                        const isIncrease = newStrikes > oldStrikes;
                        
                        fetch('/api/voz/notifications', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                recipientId: cleanHandle,
                                type: 'moderation',
                                title: 'VOZ',
                                message: isIncrease 
                                    ? `Has recibido una nueva penalización por incumplimiento de normas. Recuerda que al acumular 3 strikes serás baneado.`
                                    : `Una de tus penalizaciones ha sido retirada por el equipo de moderación. Gracias por cumplir las normas.`
                            })
                        }).catch(e => console.warn("Error notifying strike change:", e));
                    }

                    setSelectedUser(null);
                    setTempUser(null);
                    fetchUsers();
                }
            });
    };

    const handleViewVideos = (handle: string) => {
        setLoadingVideos(true);
        setShowVideosModal(true);
        setCurrentVideoUser(handle);
        fetch(`/api/voz/users?handle=${encodeURIComponent(handle)}`)
            .then(res => res.json())
            .then(data => {
                setUserVideos(data);
                setLoadingVideos(false);
            })
            .catch(() => setLoadingVideos(false));
    };

    const handleDeleteVideo = (videoId: string, userHandle: string) => {
        showConfirm('¿Seguro que quieres borrar este video del servidor permanentemente?', () => {
            fetch(`/api/voz/videos?id=${videoId}&userHandle=${encodeURIComponent(userHandle)}`, { method: 'DELETE' })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setUserVideos(current => current.filter(v => v.id !== videoId));
                        showAlert('Video eliminado exitosamente del servidor.', 'Éxito');
                        fetchUsers();
                    } else {
                        showAlert('Error al borrar el video.', 'Error');
                    }
                });
        }, 'Eliminar Video');
    };


    const handleGiveStrike = (user: any) => {
        setUserToStrike(user);
        setStrikeReason('Incumplimiento de normas'); // Default reason
        setShowStrikeModal(true);
    };

    const confirmStrike = () => {
        if (!userToStrike || !strikeReason) return;
        const targetHandle = userToStrike.handle;

        fetch('/api/voz/users/strike', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ handle: targetHandle, reason: strikeReason })
        })
            .then(res => res.json())
            .then(data => {
                setShowStrikeModal(false);
                if (data.success) {
                    showAlert('Strike aplicado y usuario notificado.', 'Éxito');
                    fetchUsers();
                } else {
                    showAlert('Error: ' + data.error, 'Error');
                }
            })
            .catch(err => {
                setShowStrikeModal(false);
                console.error('Strike error:', err);
                showAlert('Error de conexión', 'Error');
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
                                <td style={{ padding: '5px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: 'bold' }}>
                                            {u.name && u.name !== 'null' && u.name !== 'Sin nombre' ? u.name : (u.handle ? u.handle.replace('@', '') : 'Sin nombre')}
                                        </span>
                                        <span style={{ fontSize: '13px', color: '#444', fontWeight: '500' }}>{u.handle}</span>
                                    </div>
                                </td>
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
                                    <span style={{
                                        color: (u.strikes || 0) >= 3 ? 'red' : (u.strikes || 0) > 0 ? 'orange' : 'inherit',
                                        fontWeight: 'bold'
                                    }}>
                                        {u.strikes || 0}/3
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
                                        style={{ minWidth: 30, color: 'orange', fontWeight: 'bold' }}
                                        onClick={() => handleGiveStrike(u)}
                                        title="Dar Strike"
                                    >
                                        ⚡
                                    </button>
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
                                    <div className="field-row" style={{ marginTop: 5, marginBottom: 5 }}>
                                        <label><b>Handle:</b></label>
                                        <input
                                            type="text"
                                            value={tempUser?.handle || ''}
                                            onChange={(e) => setTempUser({ ...tempUser, handle: e.target.value })}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <p style={{ margin: 0, fontSize: '12px' }}><b>Email:</b> {String(tempUser?.email || '')}</p>
                                    <div className="field-row" style={{ marginTop: 5, marginBottom: 5 }}>
                                        <label><b>Teléfono:</b></label>
                                        <input
                                            type="text"
                                            value={tempUser?.phone || ''}
                                            onChange={(e) => setTempUser({ ...tempUser, phone: e.target.value })}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
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
                                <legend>Penalizaciones</legend>
                                <div className="field-row" style={{ justifyContent: 'center', gap: 10, marginTop: 5 }}>
                                    <label>Strikes Acumulados:</label>
                                    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                                        <input
                                            type="number"
                                            max={3}
                                            min={0}
                                            value={tempUser?.strikes || 0}
                                            onChange={(e) => setTempUser({ ...tempUser, strikes: parseInt(e.target.value) || 0 })}
                                            style={{ width: '60px', textAlign: 'center' }}
                                        />
                                        <button 
                                            style={{ minWidth: '30px', color: 'orange', fontWeight: 'bold' }}
                                            onClick={() => handleGiveStrike(tempUser)}
                                            title="Dar Strike Directo"
                                        >
                                            ⚡
                                        </button>
                                    </div>
                                </div>
                            </fieldset>

                            <fieldset style={{ marginTop: 15 }}>
                                <legend>Historial de Cobros (Sincronizado)</legend>
                                <div style={{ maxHeight: '120px', overflowY: 'auto', background: 'white', padding: 5, border: '1px solid #7f7f7f' }} className="sunken-panel">
                                    <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse', color: 'black' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>
                                                <th>Fecha</th>
                                                <th>Cant.</th>
                                                <th>Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {withdrawals
                                                .filter(w => w.user_handle === selectedUser?.handle)
                                                .map((w, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                    <td style={{ padding: '4px 0', fontSize: '13px' }}>{new Date(w.created_at).toLocaleDateString()}</td>
                                                    <td style={{ fontSize: '15px', fontWeight: 'bold', color: '#000' }}>{w.amount} 🪙</td>
                                                    <td style={{ 
                                                        fontSize: '13px',
                                                        fontWeight: 'bold',
                                                        color: w.status === 'pending' ? '#e65100' : w.status === 'approved' ? '#2e7d32' : '#c62828'
                                                    }}>
                                                        {w.status === 'pending' ? 'PENDIENTE' : 
                                                         w.status === 'approved' ? 'APROBADO' : 'RECHAZADO'}
                                                    </td>
                                                </tr>
                                                ))
                                            }
                                            {withdrawals.filter(w => w.user_handle === selectedUser?.handle).length === 0 && (
                                                <tr><td colSpan={3} style={{ textAlign: 'center', padding: 10, color: '#999' }}>Sin solicitudes registradas.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </fieldset>

                            <fieldset style={{ marginTop: 15 }}>
                                <legend>Evidencias de Infracción (Pruebas)</legend>
                                <div style={{ maxHeight: '150px', overflowY: 'auto', background: 'white', padding: 5 }} className="sunken-panel">
                                    {tempUser?.penalizedContent && tempUser.penalizedContent.length > 0 ? (
                                        tempUser.penalizedContent.map((item: any, i: number) => (
                                            <div key={i} style={{ borderBottom: '1px solid #dfdfdf', padding: '5px 0' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                                    <span style={{ color: 'red', fontWeight: 'bold' }}>Falta #{i + 1}</span>
                                                    <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                                                </div>
                                                <div style={{ fontSize: '12px', margin: '3px 0' }}><b>Motivo:</b> {item.reason}</div>
                                                {item.url && (
                                                    <>
                                                        <div style={{ background: '#000', display: 'flex', justifyContent: 'center', marginTop: 5 }}>
                                                            <video src={item.url} style={{ width: '100%', maxHeight: '100px' }} controls />
                                                        </div>
                                                        <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '10px', color: 'blue', textDecoration: 'underline' }}>
                                                            Ver video
                                                        </a>
                                                    </>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ padding: 10, textAlign: 'center', color: 'gray', fontSize: '11px' }}>
                                            No hay infracciones registradas.
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
                            <div className="title-bar-text">Estadísticas Reales - VOZ Analytics</div>
                            <div className="title-bar-controls">
                                <button aria-label="Close" onClick={() => setShowStats(false)}></button>
                            </div>
                        </div>
                        <div className="window-body">
                            {!statsData ? (
                                <p style={{ padding: 20 }}>Cargando analíticas desde Supabase...</p>
                            ) : (
                                <>
                                    <menu role="tablist">
                                        <li role="tab" aria-selected={activeTab === 'registros'} onClick={() => setActiveTab('registros')}><a href="#registros">Registros Diarios</a></li>
                                        <li role="tab" aria-selected={activeTab === 'actividad'} onClick={() => setActiveTab('actividad')}><a href="#actividad">Actividad Real</a></li>
                                        <li role="tab" aria-selected={activeTab === 'sistema'} onClick={() => setActiveTab('sistema')}><a href="#sistema">Infraestructura</a></li>
                                    </menu>
                                    <div className="window" role="tabpanel" style={{ height: 350, overflowY: 'auto' }}>
                                        <div className="window-body">
                                            {activeTab === 'registros' && (
                                                <div>
                                                    <h4>Histórico de Registros (Real)</h4>
                                                    {(() => {
                                                        const data = statsData.growth?.dailyRegistrations || {};
                                                        const entries = Object.entries(data).sort((a, b) => b[0].localeCompare(a[0]));
                                                        const maxVal = Math.max(1, ...Object.values<number>(data));

                                                        if (entries.length === 0) return <p>Esperando datos de tráfico...</p>;

                                                        return entries.map(([date, count]: any) => {
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
                                                    <h4>Usuarios Activos y Engagement</h4>
                                                    <div style={{ marginBottom: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                                        <div className="sunken-panel" style={{ padding: 10, background: '#dfdfdf' }}>
                                                            <div style={{ fontSize: 13 }}>ACTIVOS (24h)</div>
                                                            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#000080' }}>{statsData.totals?.activeUsers || 0}</div>
                                                        </div>
                                                        <div className="sunken-panel" style={{ padding: 10, background: '#dfdfdf' }}>
                                                            <div style={{ fontSize: 13 }}>CONTENIDO TOTAL</div>
                                                            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#008000' }}>{statsData.totals?.videos || 0}</div>
                                                        </div>
                                                    </div>

                                                    <p style={{ fontWeight: 'bold' }}>Top Videos por Visualizaciones:</p>
                                                    <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                                                        <thead>
                                                            <tr style={{ textAlign: 'left', borderBottom: '1px solid #000' }}>
                                                                <th>Creador</th>
                                                                <th>Descripción</th>
                                                                <th style={{ textAlign: 'right' }}>Views</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {statsData.videos?.map((v: any) => (
                                                                <tr key={v.id}>
                                                                    <td>{v.user}</td>
                                                                    <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.description}</td>
                                                                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{v.views}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}

                                            {activeTab === 'sistema' && (
                                                <div>
                                                    <h4>Estado del Servidor y Transferencia</h4>
                                                    <div style={{ marginBottom: 15 }}>
                                                        <p><strong>Ancho de Banda Estimado:</strong> {statsData.system?.bandwidthEstimate}</p>
                                                        <div style={{ width: '100%', backgroundColor: 'white', border: '1px inset white', height: 20 }}>
                                                            <div style={{ width: '45%', backgroundColor: '#800080', height: '100%' }}></div>
                                                        </div>
                                                    </div>
                                                    <div style={{ marginBottom: 15 }}>
                                                        <p><strong>Almacenamiento (Metadata + Thumbs):</strong> {statsData.system?.storageUsed}</p>
                                                        <div style={{ width: '100%', backgroundColor: 'white', border: '1px inset white', height: 20 }}>
                                                            <div style={{ width: '12%', backgroundColor: '#008080', height: '100%' }}></div>
                                                        </div>
                                                    </div>
                                                    <p style={{ fontSize: 11, color: '#666' }}>* Métricas calculadas en base a volumen de objetos en Supabase Storage.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                            <div className="status-bar">
                                <p className="status-bar-field">Sincronizado con Supabase</p>
                                <p className="status-bar-field" style={{ flex: 1, textAlign: 'right' }}>VozAdmin Shield v2.4</p>
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
                            <div className="title-bar-text">Videos del Usuario: {currentVideoUser || 'Cargando...'}</div>
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
                                                <span style={{ fontWeight: 'bold', fontSize: '10px', color: '#666' }}>ID: {String(v.id || '').substring(0, 8)}</span>
                                                <span style={{
                                                    fontSize: '10px',
                                                    color: (v.status === 'approved' || !v.status) ? 'green' : v.status === 'rejected' ? 'red' : 'navy',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {(v.status || 'PUBLICADO').toUpperCase()}
                                                </span>
                                            </div>
                                            <video src={v.videoUrl || v.url} style={{ width: '100%', maxHeight: '150px', backgroundColor: 'black' }} controls />
                                            <div style={{ fontSize: '10px', marginTop: 5, color: '#666' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>📅 {new Date(v.createdAt || v.timestamp).toLocaleDateString()}</span>
                                                    <span>👁️ {v.views || 0}</span>
                                                </div>
                                                <div style={{ marginTop: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontStyle: 'italic', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {v.description || 'Sin descripción'}
                                                    </span>
                                                    <button 
                                                        style={{ color: 'red', fontWeight: 'bold', minWidth: '60px' }}
                                                        onClick={() => handleDeleteVideo(v.id, currentVideoUser)}
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </div>
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

            {showStrikeModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 10000
                }}>
                    <div className="window" style={{ width: 400 }}>
                        <div className="title-bar">
                            <div className="title-bar-text">Dar Strike a {userToStrike?.handle}</div>
                        </div>
                        <div className="window-body">
                            <p>Indica el motivo de la penalización:</p>
                            <div className="field-row-stacked" style={{ width: '100%' }}>
                                <textarea 
                                    style={{ width: '100%', height: 80, resize: 'none' }}
                                    value={strikeReason}
                                    onChange={(e) => setStrikeReason(e.target.value)}
                                    placeholder="Ej: Contenido inapropiado, spam, lenguaje ofensivo..."
                                />
                            </div>
                            <div style={{ marginTop: 15, textAlign: 'center' }}>
                                <p style={{ color: 'red', fontSize: '12px' }}>
                                    ⚠️ Al dar 3 strikes el usuario será baneado automáticamente.
                                </p>
                            </div>
                            <div className="field-row" style={{ justifyContent: 'center', marginTop: 15, gap: 10 }}>
                                <button style={{ minWidth: 100, fontWeight: 'bold' }} onClick={confirmStrike}>Aplicar Strike</button>
                                <button style={{ minWidth: 80 }} onClick={() => setShowStrikeModal(false)}>Cancelar</button>
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
                                            Aceptar
                                        </button>
                                        <button
                                            style={{ minWidth: 60 }}
                                            onClick={() => setDialog({ ...dialog, show: false })}
                                        >
                                            Cancelar
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
