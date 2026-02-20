'use client';
import { useState, useEffect, useRef } from 'react';
import '98.css';

interface ModerationItem {
    id: string;
    matricula?: string;
    type: 'video' | 'audio' | 'text' | 'image';
    url: string;
    userHandle: string;
    reportedBy?: string;
    content?: string;
    reportReason?: string;
    timestamp: string;
    status: 'pending' | 'approved' | 'rejected';
    moderatedBy?: string;
}

export default function VozModerationPage() {
    const [queue, setQueue] = useState<ModerationItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
    const [loading, setLoading] = useState(true);

    // Productivity System States
    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    const [workMode, setWorkMode] = useState<'work' | 'rest' | 'lunch' | 'off'>('off');
    const [timeLeft, setTimeLeft] = useState(0); // seconds
    const [reviewedInCycle, setReviewedInCycle] = useState(0);
    const [totalToday, setTotalToday] = useState(0);
    const [canAction, setCanAction] = useState(false);
    const [videoTimeLeft, setVideoTimeLeft] = useState(30);
    const [isLunchRequested, setIsLunchRequested] = useState(false);
    const [isInactive, setIsInactive] = useState(false);
    const [lastActivity, setLastActivity] = useState<number>(0);
    const [confirmModal, setConfirmModal] = useState<{
        title: string;
        message: string;
        buttons: { label: string; onClick: () => void; isDefault?: boolean; style?: any }[]
    } | null>(null);
    const [currentShift, setCurrentShift] = useState<string>('');
    const [inactiveSeconds, setInactiveSeconds] = useState(0);
    const alertAudioRef = useRef<HTMLAudioElement | null>(null);
    const clickAudioRef = useRef<HTMLAudioElement | null>(null);
    const [audioUnlocked, setAudioUnlocked] = useState(false);
    const [viewMode, setViewMode] = useState<'moderation' | 'supervision'>('moderation');
    const [moderatorsStats, setModeratorsStats] = useState<any[]>([]);
    const [selectedModeratorHistory, setSelectedModeratorHistory] = useState<any[]>([]);
    const [currentRole, setCurrentRole] = useState<number>(0);

    // Función para desbloquear el audio con la primera interacción del usuario
    const unlockAudio = () => {
        if (!audioUnlocked) {
            if (alertAudioRef.current) {
                alertAudioRef.current.play().then(() => {
                    alertAudioRef.current?.pause();
                    alertAudioRef.current!.currentTime = 0;
                }).catch(() => { });
            }
            if (clickAudioRef.current) {
                clickAudioRef.current.play().then(() => {
                    clickAudioRef.current?.pause();
                    clickAudioRef.current!.currentTime = 0;
                }).catch(() => { });
            }
            setAudioUnlocked(true);
            console.log("Audio Context Unlocked 🔓");
        }
    };

    // Definición de turnos (9 horas cada uno: 8h trabajo + 1h comida)
    const SHIFTS = [
        { name: 'Mañana', start: 8 * 60, end: 17 * 60, lunch: [13 * 60, 14 * 60] },
        { name: 'Tarde', start: 16 * 60, end: 25 * 60, lunch: [21 * 60, 22 * 60] }, // 25:00 = 01:00
        { name: 'Noche', start: 0 * 60, end: 9 * 60, lunch: [5 * 60, 6 * 60] }
    ];

    useEffect(() => {
        if (!currentTime) setCurrentTime(new Date());
        if (!lastActivity) setLastActivity(Date.now());

        const employee = JSON.parse(localStorage.getItem('vozEmployee') || '{}');
        setCurrentRole(employee.role || 0);

        const timer = setInterval(() => {
            const now = new Date();
            setCurrentTime(now);

            // Si está trabajando y está inactivo, acumulamos segundos de inactividad
            if (isInactive && workMode === 'work') {
                setInactiveSeconds(prev => prev + 1);
            }

            updateWorkStatus(now);
        }, 1000);

        // Detección de actividad
        const handleActivity = () => {
            setLastActivity(Date.now());
            if (isInactive) setIsInactive(false);
        };

        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('scroll', handleActivity);
        window.addEventListener('click', handleActivity);

        const activityInterval = setInterval(() => {
            if (Date.now() - lastActivity > 120000 && workMode === 'work' && !isInactive) {
                setIsInactive(true);
                window.dispatchEvent(new CustomEvent('voz-inactivity-active', { detail: { active: true } }));
                // Registrar inactividad en el servidor
                const employee = JSON.parse(localStorage.getItem('vozEmployee') || '{}');
                fetch('/api/voz/moderation', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        employeeName: employee.username,
                        inactivityAlert: true
                    })
                });
            }
        }, 1000);

        return () => {
            clearInterval(timer);
            clearInterval(activityInterval);
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('scroll', handleActivity);
            window.removeEventListener('click', handleActivity);
        };
    }, [isLunchRequested, lastActivity, isInactive, workMode]);

    // Control de audio de alarma
    useEffect(() => {
        if (isInactive && workMode === 'work') {
            if (alertAudioRef.current && audioUnlocked) {
                alertAudioRef.current.play().catch(e => console.warn("Error playing alert:", e));
            }
        } else {
            if (alertAudioRef.current) {
                alertAudioRef.current.pause();
                alertAudioRef.current.currentTime = 0;
            }
        }
    }, [isInactive, workMode, audioUnlocked]);

    // Lógica de cronograma de trabajo
    const updateWorkStatus = (now: Date) => {
        const hour = now.getHours();
        const min = now.getMinutes();
        const totalMin = hour * 60 + min + now.getSeconds() / 60;

        // Buscar turno activo (teniendo en cuenta el solapamiento de la Tarde hasta la 1:00)
        let finalShift = SHIFTS.find(s => {
            if (s.name === 'Tarde' && totalMin < 1 * 60) return true; // Caso especial 00:00-01:00
            return totalMin >= s.start && totalMin < s.end;
        });

        if (!finalShift) {
            setWorkMode('off');
            setTimeLeft(0);
            setCurrentShift('');
            return;
        }

        setCurrentShift(finalShift.name);
        let normalizedMin = totalMin;
        if (finalShift.name === 'Tarde' && totalMin < 1 * 60) normalizedMin += 24 * 60;

        // 2. Comida
        const inLunchRange = (normalizedMin >= finalShift.lunch[0] && normalizedMin < finalShift.lunch[1]);
        if (inLunchRange || isLunchRequested) {
            setWorkMode('lunch');
            setTimeLeft(isLunchRequested ? 3600 : (finalShift.lunch[1] - normalizedMin) * 60 - now.getSeconds());
            return;
        }

        // 3. Ciclos (50 work / 10 rest)
        // Restamos los minutos de inactividad para que el "reloj de trabajo" se congele/atrase
        const minsSinceStart = (normalizedMin - finalShift.start) - (inactiveSeconds / 60);
        const cyclePosition = minsSinceStart % 60;

        if (cyclePosition < 50) {
            if (workMode !== 'work') {
                setWorkMode('work');
                setReviewedInCycle(0);
            }
            // El tiempo restante se calcula en base a la posición del ciclo que ya incluye la pausa
            const secondsLeftInWork = (50 - cyclePosition) * 60;
            setTimeLeft(Math.max(0, Math.floor(secondsLeftInWork)));
        } else {
            setWorkMode('rest');
            const secondsLeftInRest = (60 - cyclePosition) * 60;
            setTimeLeft(Math.max(0, Math.floor(secondsLeftInRest)));
        }
    };

    // Reiniciar cronómetro al cambiar de item
    useEffect(() => {
        if (selectedItem?.type === 'video') {
            setVideoTimeLeft(30);
            setCanAction(false);
        } else {
            setVideoTimeLeft(0);
            setCanAction(true);
        }
    }, [selectedItem?.id]);

    // Descuento de tiempo (solo si está activo y trabajando)
    useEffect(() => {
        let vTimer: any;
        if (workMode === 'work' && selectedItem?.type === 'video' && !isInactive && !canAction) {
            vTimer = setInterval(() => {
                setVideoTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(vTimer);
                        setCanAction(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(vTimer);
    }, [workMode, isInactive, selectedItem?.id, canAction]);

    // Alerta sonora permanente SR001 durante inactividad
    // Alerta sonora permanente SR001 durante inactividad (CONTROL HTML AUDIO)
    useEffect(() => {
        if (isInactive && workMode === 'work') {
            if (alertAudioRef.current) {
                // Intentar reproducir. Si falla (autoplay policy), el usuario "desbloqueará" al interactuar
                alertAudioRef.current.play().catch(e => console.error("Error reproduciendo alarma:", e));
            }
        } else {
            if (alertAudioRef.current) {
                alertAudioRef.current.pause();
                alertAudioRef.current.currentTime = 0;
            }
        }
    }, [isInactive, workMode]);

    // Alerta sonora al final del descanso
    useEffect(() => {
        if ((workMode === 'rest' || workMode === 'lunch') && timeLeft <= 60 && timeLeft > 0) {
            const shouldPlay =
                (timeLeft > 30 && timeLeft % 10 === 0) || // 60, 50, 40
                (timeLeft <= 30 && timeLeft > 10 && timeLeft % 5 === 0) || // 30, 25, 20, 15
                (timeLeft <= 10); // 10, 9, 8, 7, 6, 5, 4, 3, 2, 1

            if (shouldPlay) {
                if (clickAudioRef.current) {
                    clickAudioRef.current.play().catch(e => console.error("Error playing click:", e));
                }
            }
        }
    }, [timeLeft, workMode]);

    useEffect(() => {
        fetchQueue();
    }, []);

    const fetchQueue = () => {
        setLoading(true);
        const employee = JSON.parse(localStorage.getItem('vozEmployee') || '{}');
        const employeeName = `[${employee.workerNumber || '???'}] ${employee.username || 'unknown'}`;

        fetch(`/api/voz/moderation?employee=${encodeURIComponent(employeeName)}`)
            .then(res => res.json())
            .then(data => {
                setQueue(data);
                if (data.length > 0 && !selectedItem) {
                    setSelectedItem(data[0]);
                } else if (data.length === 0) {
                    setSelectedItem(null);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    const fetchModeratorsStats = () => {
        setLoading(true);
        fetch('/api/voz/moderation/stats')
            .then(res => res.json())
            .then(data => {
                setModeratorsStats(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    const handleViewModeratorHistory = (modName: string) => {
        setLoading(true);
        fetch(`/api/voz/moderation/stats?employeeName=${encodeURIComponent(modName)}`)
            .then(res => res.json())
            .then(data => {
                setSelectedModeratorHistory(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    const handleAction = (status: 'approved' | 'rejected', skipPenalty: boolean = false) => {
        if (!selectedItem) return;

        const employee = JSON.parse(localStorage.getItem('vozEmployee') || '{}');

        fetch('/api/voz/moderation', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: selectedItem.id,
                status,
                employeeName: `[${employee.workerNumber || '???'}] ${employee.username}`,
                cycleVideos: reviewedInCycle + 1,
                totalVideos: totalToday + 1,
                skipPenalty
            })
        })
            .then(() => {
                setReviewedInCycle(prev => prev + 1);
                setTotalToday(prev => prev + 1);
                // Eliminar el item procesado del estado local inmediatamente
                const updatedQueue = queue.filter(item => item.id !== selectedItem.id);
                setQueue(updatedQueue);

                const nextIndex = queue.findIndex(item => item.id === selectedItem.id) + 1;
                const nextItem = nextIndex < queue.length ? (queue[nextIndex].id !== selectedItem.id ? queue[nextIndex] : null) : (updatedQueue.length > 0 ? updatedQueue[0] : null);

                // Si el siguiente es el mismo (no debería) o se acabó la lista
                setSelectedItem(nextItem);
                fetchQueue();
            });
    };

    const handleSkip = () => {
        const nextIndex = queue.findIndex(item => item.id === selectedItem?.id) + 1;
        if (nextIndex < queue.length) {
            setSelectedItem(queue[nextIndex]);
        } else if (queue.length > 0) {
            setSelectedItem(queue[0]);
        }
    };

    return (
        <div
            onClick={unlockAudio} // Capturar primer clic para desbloquear audio
            style={{ padding: 10, display: 'flex', flexDirection: 'column', height: '90vh', gap: 10 }}
        >
            {/* Dashboard de Productividad */}
            <div className="window" style={{ marginBottom: 5 }}>
                <div className="title-bar">
                    <div className="title-bar-text">Panel de Moderación - VOZ {currentShift && `[Turno de ${currentShift}]`}</div>
                </div>
                {currentRole === 1 && (
                    <menu role="tablist" style={{ margin: '5px 5px 0 5px' }}>
                        <li role="tab" aria-selected={viewMode === 'moderation'} onClick={() => setViewMode('moderation')}>
                            <a href="#moderation">Cola de Trabajo</a>
                        </li>
                        <li role="tab" aria-selected={viewMode === 'supervision'} onClick={() => {
                            setViewMode('supervision');
                            fetchModeratorsStats();
                        }}>
                            <a href="#supervision">🔍 Supervisión Director</a>
                        </li>
                    </menu>
                )}
                <div className="window-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 15px' }}>
                    <div style={{ display: 'flex', gap: 20 }}>
                        <div className="status-bar" style={{ padding: '2px 10px', minWidth: 200 }}>
                            <p className="status-bar-field">Estado:
                                <span style={{
                                    marginLeft: 5,
                                    fontWeight: 'bold',
                                    color: workMode === 'work' ? 'green' : workMode === 'rest' ? 'orange' : 'red'
                                }}>
                                    {workMode === 'work' ? 'TRABAJANDO' : workMode === 'rest' ? 'DESCANSANDO' : workMode === 'lunch' ? 'COMIDA' : 'FUERA DE HORARIO'}
                                </span>
                            </p>
                        </div>
                        <div className="status-bar" style={{ padding: '2px 10px', minWidth: 150 }}>
                            <p className="status-bar-field">Tiempo restante: <b>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</b></p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
                        <div style={{ fontSize: '12px' }}>
                            Ciclo: <b>{reviewedInCycle} / 90</b> vídeos
                        </div>
                        <div style={{ fontSize: '12px' }}>
                            Jornada: <b>{totalToday} / 630</b> vídeos
                        </div>
                        <button
                            disabled={workMode !== 'work' || isLunchRequested}
                            onClick={() => {
                                setConfirmModal({
                                    title: 'Confirmar Pausa para Comer',
                                    message: '¿Quieres solicitar tu hora de comida ahora? El sistema se bloqueará por 60 minutos.',
                                    buttons: [
                                        { label: 'Aceptar', onClick: () => setIsLunchRequested(true), isDefault: true },
                                        { label: 'Cancelar', onClick: () => setConfirmModal(null) }
                                    ]
                                });
                            }}
                        >
                            Solicitar Comida
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flex: 1, position: 'relative' }}>
                {/* Overlay de Bloqueo por Pausa/Comida */}
                {workMode !== 'work' && (
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(192, 192, 192, 0.95)',
                        zIndex: 100,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        border: '2px inset white'
                    }}>
                        <img
                            src={workMode === 'rest' ? "https://win98icons.alexmeub.com/icons/png/clock_timer-1.png" : "https://win98icons.alexmeub.com/icons/png/key_padlock-1.png"}
                            style={{ width: 64, marginBottom: 20 }}
                        />
                        <h2 style={{ margin: 0 }}>
                            {workMode === 'rest' ? 'Tiempo de Descanso Activo' : workMode === 'lunch' ? 'Hora de Comida / Pausa' : 'Fuera del Horario Laboral'}
                        </h2>
                        <p style={{ maxWidth: 400, marginTop: 10 }}>
                            {workMode === 'rest' ? 'Por favor, descansa 10 minutos para mantener la concentración. La moderación se reactivará automáticamente.' :
                                workMode === 'lunch' ? 'Buen provecho. El sistema se desbloqueará al finalizar tu hora de descanso.' :
                                    'El horario de moderación es de 08:00 a 17:00. Vuelve mañana para continuar.'}
                        </p>
                        <div style={{ marginTop: 20, fontSize: '24px', fontWeight: 'bold' }} className="status-bar">
                            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                        </div>
                    </div>
                )}

                {/* Overlay de Inactividad */}
                {isInactive && workMode === 'work' && (
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(255, 0, 0, 0.7)',
                        backdropFilter: 'blur(10px)',
                        zIndex: 200,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        animation: 'blink 1s infinite alternate'
                    }}>
                        <style>{`
                            @keyframes blink {
                                from { background-color: rgba(255, 0, 0, 0.4); }
                                to { background-color: rgba(255, 0, 0, 0.7); }
                            }
                        `}</style>
                        <div className="window" style={{ width: 400 }}>
                            <div className="title-bar">
                                <div className="title-bar-text">¡ALERTA DE SEGURIDAD!</div>
                            </div>
                            <div className="window-body" style={{ textAlign: 'center' }}>
                                <img src="https://win98icons.alexmeub.com/icons/png/msg_warning-0.png" style={{ width: 48, marginBottom: 15 }} />
                                <h3 style={{ color: 'red' }}>DETECTADA INACTIVIDAD</h3>
                                <p>Se ha detectado una pausa prolongada en la moderación.</p>
                                <p style={{ fontSize: '11px', fontStyle: 'italic' }}>Este evento ha sido registrado para supervisión.</p>
                                <div style={{ marginTop: 20 }}>
                                    <button
                                        style={{ padding: '5px 20px', fontWeight: 'bold' }}
                                        onClick={() => {
                                            setIsInactive(false);
                                            window.dispatchEvent(new CustomEvent('voz-inactivity-active', { detail: { active: false } }));
                                            // Al hacer click aquí, forzamos parar cualquier audio de alerta
                                            if (alertAudioRef.current) {
                                                alertAudioRef.current.pause();
                                                alertAudioRef.current.currentTime = 0;
                                            }
                                        }}
                                    >
                                        ESTOY AQUÍ / REANUDAR TRABAJO
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Lista de Cola de Denuncias */}
                <div style={{ width: '300px', display: 'flex', flexDirection: 'column' }}>
                    <fieldset style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <legend>Denuncias Pendientes ({queue.length})</legend>
                        <div className="sunken-panel" style={{ flex: 1, backgroundColor: 'white', overflowY: 'auto' }}>
                            <ul className="tree-view">
                                {loading ? (
                                    <li>Cargando reportes...</li>
                                ) : queue.length === 0 ? (
                                    <li>No hay denuncias pendientes</li>
                                ) : (
                                    queue.map(item => (
                                        <li
                                            key={item.id}
                                            onClick={() => setSelectedItem(item)}
                                            style={{
                                                cursor: 'pointer',
                                                backgroundColor: selectedItem?.id === item.id ? 'navy' : 'transparent',
                                                color: selectedItem?.id === item.id ? 'white' : 'black',
                                                padding: '4px 8px',
                                                borderBottom: '1px solid #dfdfdf'
                                            }}
                                        >
                                            <div style={{ fontWeight: 'bold' }}>{item.type === 'video' ? '📹 Video' : '🔊 Audio'}</div>
                                            <div style={{ fontSize: '0.8em', opacity: selectedItem?.id === item.id ? 0.9 : 0.7 }}>
                                                Por: {item.userHandle}
                                            </div>
                                        </li>
                                    ))
                                )}
                            </ul>
                        </div>
                    </fieldset>
                </div>

                {/* Área de Visualización */}
                {viewMode === 'moderation' && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div className="window" style={{ flex: 1, marginBottom: 10, display: 'flex', flexDirection: 'column' }}>
                            <div className="title-bar">
                                <div className="title-bar-text">
                                    Visualizador de Denuncias: {selectedItem ? `${selectedItem.type.toUpperCase()} de ${selectedItem.userHandle}` : 'Nada seleccionado'}
                                </div>
                            </div>
                            <div className="window-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 10 }}>
                                {selectedItem ? (
                                    <>
                                        <div style={{ marginBottom: 10, padding: 5, background: '#ffcccc', border: '1px solid red', fontWeight: 'bold', color: '#b30000' }}>
                                            🚩 Motivo del Reporte: {selectedItem.reportReason || 'No especificado'}
                                        </div>
                                        <div className="sunken-panel" style={{ flex: 1, background: 'black', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                                            {selectedItem.type === 'video' ? (
                                                <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
                                                    <video
                                                        key={selectedItem.url}
                                                        src={selectedItem.url}
                                                        autoPlay
                                                        style={{ maxWidth: '100%', maxHeight: '100%', pointerEvents: 'none' }}
                                                        onContextMenu={(e) => e.preventDefault()}
                                                    />
                                                    {!canAction && (
                                                        <div style={{
                                                            position: 'absolute',
                                                            bottom: 10,
                                                            right: 10,
                                                            background: 'rgba(0,0,0,0.7)',
                                                            color: 'white',
                                                            padding: '5px 10px',
                                                            fontSize: '14px',
                                                            fontFamily: 'monospace'
                                                        }}>
                                                            Analizando... {videoTimeLeft}s
                                                        </div>
                                                    )}
                                                </div>
                                            ) : selectedItem.type === 'audio' ? (
                                                <div style={{ textAlign: 'center' }}>
                                                    <img src="https://win98icons.alexmeub.com/icons/png/sndvol32-1.png" alt="Audio" style={{ width: 64, marginBottom: 20 }} />
                                                    <audio
                                                        key={selectedItem.url}
                                                        src={selectedItem.url}
                                                        controls
                                                        autoPlay
                                                        style={{ width: '300px' }}
                                                    />
                                                </div>
                                            ) : (
                                                <p style={{ color: 'white' }}>Tipo de contenido no soportado: {selectedItem.type}</p>
                                            )}
                                        </div>
                                        <div className="status-bar" style={{ marginTop: 10 }}>
                                            <p className="status-bar-field">Matrícula: {selectedItem.matricula || 'VOZ-NEW'}</p>
                                            <p className="status-bar-field">ID: {selectedItem.id}</p>
                                            <p className="status-bar-field">Usuario: {selectedItem.userHandle}</p>
                                            <p className="status-bar-field">Fecha: {new Date(selectedItem.timestamp).toLocaleString()}</p>
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#c0c0c0' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <img src="https://win98icons.alexmeub.com/icons/png/shield_cool-1.png" alt="Moderacion" style={{ width: 64, marginBottom: 10 }} />
                                            <p>Selecciona una denuncia de la cola para revisarla.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="field-row" style={{ justifyContent: 'center', gap: 20 }}>
                            <button
                                disabled={!selectedItem || !canAction}
                                onClick={() => {
                                    setConfirmModal({
                                        title: 'Rechazar Contenido',
                                        message: `¿Qué acción deseas tomar para el contenido de ${selectedItem?.userHandle}?`,
                                        buttons: [
                                            {
                                                label: 'Rechazar y Penalizar',
                                                onClick: () => handleAction('rejected', false),
                                                style: { color: 'red', fontWeight: 'bold' }
                                            },
                                            {
                                                label: 'Rechazar y Aceptar',
                                                onClick: () => handleAction('rejected', true),
                                                style: { fontWeight: 'bold' }
                                            },
                                            {
                                                label: 'Cancelar',
                                                onClick: () => setConfirmModal(null)
                                            }
                                        ]
                                    });
                                }}
                                style={{ minWidth: 150, fontWeight: 'bold', color: 'red' }}
                            >
                                {canAction ? '🗑️ RECHAZAR / PENALIZAR' : `ESPERE (${videoTimeLeft}s)`}
                            </button>
                            <button
                                disabled={!selectedItem || !canAction}
                                onClick={() => handleAction('approved')}
                                style={{ minWidth: 120, fontWeight: 'bold', color: 'green' }}
                            >
                                {canAction ? '🛡️ APROBAR / MANTENER' : '...'}
                            </button>
                            <button
                                disabled={queue.length <= 1 || !canAction}
                                onClick={handleSkip}
                                style={{ minWidth: 80 }}
                            >
                                Saltar
                            </button>
                        </div>
                    </div>
                )}

                {/* VISTA DE SUPERVISIÓN (DIRECTOR) */}
                {viewMode === 'supervision' && currentRole === 1 && (
                    <div style={{ flex: 1, display: 'flex', gap: 10 }}>
                        <div style={{ width: '250px', display: 'flex', flexDirection: 'column' }}>
                            <fieldset style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <legend>Moderadores Activos</legend>
                                <div className="sunken-panel" style={{ flex: 1, backgroundColor: 'white', overflowY: 'auto' }}>
                                    <ul className="tree-view">
                                        {moderatorsStats.length === 0 ? <li style={{ padding: 5 }}>No hay datos</li> : (
                                            moderatorsStats.map((mod, i) => (
                                                <li key={i}
                                                    style={{ cursor: 'pointer', padding: '5px' }}
                                                    onClick={() => handleViewModeratorHistory(mod.employeeName)}
                                                >
                                                    {mod.employeeName} <b>[{mod.total}]</b>
                                                </li>
                                            ))
                                        )}
                                    </ul>
                                </div>
                            </fieldset>
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <fieldset style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <legend>Auditoría de Contenidos Procesados</legend>
                                <div className="sunken-panel" style={{ flex: 1, backgroundColor: 'white', overflowY: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', borderBottom: '1px solid black' }}>
                                                <th style={{ padding: 5 }}>Matrícula</th>
                                                <th style={{ padding: 5 }}>Acción</th>
                                                <th style={{ padding: 5 }}>Usuario</th>
                                                <th style={{ padding: 5 }}>Matrícula</th>
                                                <th style={{ padding: 5 }}>Prueba</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedModeratorHistory.length === 0 ? (
                                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 20, color: 'gray' }}>Selecciona un moderador para ver sus acciones</td></tr>
                                            ) : (
                                                selectedModeratorHistory.map((item, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                                                        <td style={{ padding: 5, fontWeight: 'bold' }}>{item.matricula || '---'}</td>
                                                        <td style={{ padding: 5, color: item.status === 'approved' ? 'green' : 'red', fontWeight: 'bold' }}>
                                                            {item.status.toUpperCase()}
                                                        </td>
                                                        <td style={{ padding: 5 }}>{item.userHandle}</td>
                                                        <td style={{ padding: 5, fontSize: '11px' }}>{new Date(item.timestamp).toLocaleString()}</td>
                                                        <td style={{ padding: 5 }}>
                                                            <button onClick={() => window.open(item.url, '_blank')} style={{ minWidth: 40, padding: 0 }}>🎥 Ver</button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </fieldset>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Confirmación Estilo Win98 */}
            {confirmModal && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    zIndex: 1000,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <div className="window" style={{ width: 400 }}>
                        <div className="title-bar">
                            <div className="title-bar-text">{confirmModal.title}</div>
                            <div className="title-bar-controls">
                                <button aria-label="Close" onClick={() => setConfirmModal(null)} />
                            </div>
                        </div>
                        <div className="window-body">
                            <div style={{ display: 'flex', gap: 15, alignItems: 'center', padding: '10px 0' }}>
                                <img src="https://win98icons.alexmeub.com/icons/png/msg_question-0.png" style={{ width: 32 }} />
                                <p style={{ margin: 0 }}>{confirmModal.message}</p>
                            </div>
                            <div className="field-row" style={{ justifyContent: 'flex-end', marginTop: 20, gap: 10 }}>
                                {confirmModal.buttons && confirmModal.buttons.map((btn, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            btn.onClick();
                                            setConfirmModal(null);
                                        }}
                                        style={{ minWidth: 80, ...btn.style }}
                                        className={btn.isDefault ? 'default' : ''}
                                    >
                                        {btn.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Elemento de Audio Oculto para Alarma SR001 */}
            <audio ref={alertAudioRef} src="/Sonidos/SR001.wav" loop preload="auto" style={{ display: 'none' }} />
            {/* Elemento de Audio Oculto para Click de Descanso */}
            <audio ref={clickAudioRef} src="/Sonidos/CLick.wav" preload="auto" style={{ display: 'none' }} />
        </div>
    );
}
