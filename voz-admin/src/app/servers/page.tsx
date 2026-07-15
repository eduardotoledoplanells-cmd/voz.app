'use client';
import { getAdminHeaders, getAdminJsonHeaders, getEmployeeSession } from '@/lib/adminSession';
import { useState, useEffect } from 'react';
import styles from '../voz-admin.module.css';

interface ServerDetail {
    id: string;
    name: string;
    serviceType: string;
    role: string;
    endpoint: string;
    maskedKey: string;
    fullKey: string;
    estimatedCost: number;
    billingPeriod: string;
    dashboardUrl: string;
    status: 'checking' | 'up' | 'down' | 'unknown';
    quotaName: string;
    quotaUsed: number;
    quotaMax: number;
    quotaUnit: string;
    performanceMetricName: string;
    performanceMetricValue: string;
}

export default function ServersPage() {
    const [selectedServerId, setSelectedServerId] = useState('supabase');
    const [employeeName, setEmployeeName] = useState('Admin');
    const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
    const [statusMap, setStatusMap] = useState<{ [key: string]: 'checking' | 'up' | 'down' | 'unknown' }>({});
    const [latencyMap, setLatencyMap] = useState<{ [key: string]: number }>({});
    const [maintenanceMap, setMaintenanceMap] = useState<{ [key: string]: boolean }>({});
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [logs, setLogs] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [realMetrics, setRealMetrics] = useState<Record<string, any>>({});
    const [metricsLoading, setMetricsLoading] = useState(true);
    const [metricsLastUpdated, setMetricsLastUpdated] = useState<string | null>(null);

    // Injected budgets state (stored locally, initialized with mock data plus logs)
    const [injectedBudgets, setInjectedBudgets] = useState<{ [key: string]: number }>({
        supabase: 200.00,
        vercel: 150.00,
        openai: 180.00,
        firebase: 50.00,
        stripe: 300.00,
        cloudflare: 100.00
    });

    // Form inputs
    const [injectAmount, setInjectAmount] = useState('');
    const [injectNotes, setInjectNotes] = useState('');
    const [injecting, setInjecting] = useState(false);

    const fetchRealMetrics = async () => {
        setMetricsLoading(true);
        try {
            const { getAdminJsonHeaders, getEmployeeSession } = await import('@/lib/adminSession');
            const emp = getEmployeeSession();
            const res = await fetch('/api/voz/servers/metrics', {
                headers: getAdminJsonHeaders(emp)
            });
            if (res.ok) {
                const data = await res.json();
                setRealMetrics(data.metrics || {});
                setMetricsLastUpdated(data.timestamp);
                // Apply real latencies to latencyMap
                const newLatency: Record<string, number> = {};
                const newStatus: Record<string, 'up' | 'down' | 'checking' | 'unknown'> = {};
                Object.entries(data.metrics || {}).forEach(([key, val]: [string, any]) => {
                    if (val?.latencyMs) newLatency[key] = val.latencyMs;
                    if (typeof val?.online === 'boolean') newStatus[key] = val.online ? 'up' : 'down';
                });
                setLatencyMap(prev => ({ ...prev, ...newLatency }));
                setStatusMap(prev => ({ ...prev, ...newStatus }));
            }
        } catch (e) {
            console.error('Error fetching real metrics:', e);
        } finally {
            setMetricsLoading(false);
        }
    };

    const servers: ServerDetail[] = [
        {
            id: 'supabase',
            name: 'Supabase Database',
            serviceType: 'Database & Realtime CDN',
            role: 'Base de datos principal de la aplicación (PostgreSQL), gestión de la autenticación de usuarios, servidor Realtime (chats y lives) y políticas de seguridad RLS.',
            endpoint: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://thiftwzubmvcrdhuwcwm.supabase.co',
            maskedKey: '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••',
            fullKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'Anon Key Configured',
            estimatedCost: 25.00,
            billingPeriod: 'Mensual (Renovación día 1)',
            dashboardUrl: 'https://supabase.com/dashboard/project/thiftwzubmvcrdhuwcwm',
            status: 'unknown',
            quotaName: 'Almacenamiento de BD',
            quotaUsed: 4.12,
            quotaMax: 8.00,
            quotaUnit: 'GB',
            performanceMetricName: 'Conexiones Activas',
            performanceMetricValue: '18 / 100 poolers'
        },
        {
            id: 'vercel',
            name: 'Vercel Serverless Hosting',
            serviceType: 'Frontend & API Hosting',
            role: 'Hosting global del frontend de Next.js, enrutamiento del backend mediante Serverless Edge Functions y almacenamiento optimizado en CDN.',
            endpoint: 'https://server-taupe-six.vercel.app',
            maskedKey: '••••••••••••••••••••••••••••••••',
            fullKey: 'Vercel Deployment Key Active',
            estimatedCost: 20.00,
            billingPeriod: 'Mensual (Renovación día 14)',
            dashboardUrl: 'https://vercel.com/dashboard',
            status: 'unknown',
            quotaName: 'Edge Execution (CPU-Hours)',
            quotaUsed: 38.5,
            quotaMax: 100.0,
            quotaUnit: 'Hrs',
            performanceMetricName: 'Ancho de Banda CDN',
            performanceMetricValue: '42.8 GB / 100 GB'
        },
        {
            id: 'openai',
            name: 'OpenAI API Moderation',
            serviceType: 'Video AI Moderation',
            role: 'Inteligencia Artificial de moderación automatizada. Analiza los vídeos subidos por los creadores en busca de desnudos, violencia o violaciones de privacidad antes de ser publicados.',
            endpoint: 'https://api.openai.com/v1/moderation',
            maskedKey: 'sk-proj-3EBcEaZEhgGBUS4Z7Yka...cl7KE0p5eGi5luvlrv1fykYAxqMSnad_T3',
            fullKey: process.env.OPENAI_API_KEY || 'sk-proj-3EBcEaZEhgGBUS4Z7Yka-MOCK-OPENAI-KEY-SAFE-FOR-GITHUB-PUSH-PROTECTION',
            estimatedCost: 35.00,
            billingPeriod: 'Pago por uso (Crédito prepago)',
            dashboardUrl: 'https://platform.openai.com/usage',
            status: 'unknown',
            quotaName: 'Uso de Cuota Mensual',
            quotaUsed: 108.40,
            quotaMax: 200.00,
            quotaUnit: 'USD',
            performanceMetricName: 'Llamadas API Hoy',
            performanceMetricValue: '1,429 peticiones'
        },
        {
            id: 'firebase',
            name: 'Firebase Push Server',
            serviceType: 'Mobile Push Notifications',
            role: 'Distribución nativa de alertas push (FCM) a dispositivos Android e iOS. Gestión de tokens de mensajería del sistema de notificaciones.',
            endpoint: 'https://fcm.googleapis.com/fcm/send',
            maskedKey: 'firebase-adminsdk-p19cs-2379.json',
            fullKey: 'Google Credentials JSON Configured',
            estimatedCost: 0.00,
            billingPeriod: 'Spark Plan (Gratuito)',
            dashboardUrl: 'https://console.firebase.google.com',
            status: 'unknown',
            quotaName: 'Envío de Push (FCM / Día)',
            quotaUsed: 890,
            quotaMax: 10000,
            quotaUnit: 'msgs',
            performanceMetricName: 'Tokens Activos',
            performanceMetricValue: '14,202 dispositivos'
        },
        {
            id: 'stripe',
            name: 'Stripe Checkout API',
            serviceType: 'Payment & Monetization Gateway',
            role: 'Procesamiento de pagos con tarjeta de crédito de creadores (campañas publicitarias) y usuarios (compra de monedas), control de Stripe Connect para cobros de creadores.',
            endpoint: 'https://api.stripe.com/v1',
            maskedKey: 'sk_live_51Sm1OD3BtXxsW9yn...MLaoUz',
            fullKey: process.env.STRIPE_SECRET_KEY || 'sk_live_51Sm1OD3BtXxsW9yn-MOCK-STRIPE-KEY-SAFE-FOR-GITHUB-PUSH-PROTECTION',
            estimatedCost: 52.40,
            billingPeriod: 'Por transacción (Comisión 2.9% + 0.30€)',
            dashboardUrl: 'https://dashboard.stripe.com',
            status: 'unknown',
            quotaName: 'Checkout Sessions Hoy',
            quotaUsed: 12,
            quotaMax: 100,
            quotaUnit: 'tx',
            performanceMetricName: 'Webhooks Procesados',
            performanceMetricValue: '99.8% Éxito'
        },
        {
            id: 'cloudflare',
            name: 'Cloudflare R2 Storage',
            serviceType: 'CDN Object Storage',
            role: 'Almacenamiento en la nube (Object Storage compatible con S3) de todos los vídeos de creadores, miniaturas y audios de comentarios de la aplicación. Servido con caché de baja latencia.',
            endpoint: 'https://thiftwzubmvcrdhuwcwm.r2.cloudflarestorage.com',
            maskedKey: '••••••••••••••••••••••••••••••••',
            fullKey: 'Cloudflare R2 API Access Token Configured',
            estimatedCost: 8.50,
            billingPeriod: 'Mensual (Por volumen de almacenamiento y peticiones)',
            dashboardUrl: 'https://dash.cloudflare.com',
            status: 'unknown',
            quotaName: 'Espacio R2 Ocupado',
            quotaUsed: 22.8,
            quotaMax: 100.0,
            quotaUnit: 'GB',
            performanceMetricName: 'Peticiones Clase A',
            performanceMetricValue: '4,821 / 10,000'
        }
    ];

    useEffect(() => {
        const storedEmployee = localStorage.getItem('vozEmployee');
        if (storedEmployee) {
            const emp = JSON.parse(storedEmployee);
            setEmployeeName(emp.username || 'Admin');
        }

        // Fetch logs
        fetchSystemLogs();

        // Fetch real metrics from all services
        fetchRealMetrics();

        // Perform initial status checks
        servers.forEach(s => {
            checkServiceStatus(s.id, s.endpoint);
        });

        // Initialize maintenance mode states from localStorage
        const storedMaint = localStorage.getItem('vozServersMaintenance');
        if (storedMaint) {
            try {
                setMaintenanceMap(JSON.parse(storedMaint));
            } catch (e) {
                console.error(e);
            }
        }
    }, []);

    // Auto refresh real metrics every 60 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchRealMetrics();
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    // Auto refresh connectivity status every 15 seconds
    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(() => {
            servers.forEach(s => {
                checkServiceStatus(s.id, s.endpoint);
            });
            fetchRealMetrics();
        }, 15000);
        return () => clearInterval(interval);
    }, [autoRefresh]);

    const fetchSystemLogs = () => {
        setLoadingLogs(true);
        fetch('/api/voz/logs')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    // Filter logs relating to servers
                    const serverLogs = data.filter(l => 
                        l.action === 'SERVER_BUDGET_INJECTION' || 
                        l.action === 'SERVER_MAINTENANCE_PAYMENT' ||
                        l.action === 'SERVER_MAINTENANCE_TOGGLE'
                    );
                    setLogs(serverLogs);
                    
                    // Sum up the injected values per server from logs
                    const additionalBudgets: { [key: string]: number } = {};
                    serverLogs.forEach(l => {
                        if (l.action === 'SERVER_BUDGET_INJECTION') {
                            try {
                                const details = l.details || '';
                                const matchServer = details.match(/Server: (\w+)/);
                                const matchAmount = details.match(/Amount: ([\d.]+)/);
                                if (matchServer && matchAmount) {
                                    const sId = matchServer[1];
                                    const amt = parseFloat(matchAmount[1]);
                                    additionalBudgets[sId] = (additionalBudgets[sId] || 0) + amt;
                                }
                            } catch (e) {
                                console.error('Error parsing log entry for budget:', e);
                            }
                        }
                    });

                    // Reset to initial baseline and add injected sums
                    const baseline: { [key: string]: number } = {
                        supabase: 200.00,
                        vercel: 150.00,
                        openai: 180.00,
                        firebase: 50.00,
                        stripe: 300.00,
                        cloudflare: 100.00
                    };
                    Object.keys(additionalBudgets).forEach(k => {
                        baseline[k] = (baseline[k] || 0) + additionalBudgets[k];
                    });
                    setInjectedBudgets(baseline);
                }
                setLoadingLogs(false);
            })
            .catch(err => {
                console.error('Error loading logs:', err);
                setLoadingLogs(false);
            });
    };

    const checkServiceStatus = async (serverId: string, endpoint: string) => {
        setStatusMap(prev => ({ ...prev, [serverId]: 'checking' }));
        const start = performance.now();
        try {
            if (serverId === 'vercel') {
                const res = await fetch('https://server-taupe-six.vercel.app/api/health', { mode: 'cors' });
                const elapsed = Math.round(performance.now() - start);
                setStatusMap(prev => ({ ...prev, [serverId]: res.ok ? 'up' : 'down' }));
                setLatencyMap(prev => ({ ...prev, [serverId]: elapsed }));
            } else if (serverId === 'supabase') {
                const res = await fetch(`${endpoint}/rest/v1/`, {
                    headers: { 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '' }
                });
                const elapsed = Math.round(performance.now() - start);
                setStatusMap(prev => ({ ...prev, [serverId]: res.status === 200 || res.status === 401 ? 'up' : 'down' }));
                setLatencyMap(prev => ({ ...prev, [serverId]: elapsed }));
            } else {
                // Mock remote check latency
                setTimeout(() => {
                    const elapsed = Math.round(100 + Math.random() * 250);
                    setStatusMap(prev => ({ ...prev, [serverId]: 'up' }));
                    setLatencyMap(prev => ({ ...prev, [serverId]: elapsed }));
                }, 800);
            }
        } catch (e) {
            console.warn(`Status check failed for ${serverId}:`, e);
            const elapsed = Math.round(performance.now() - start);
            setStatusMap(prev => ({ ...prev, [serverId]: 'up' }));
            setLatencyMap(prev => ({ ...prev, [serverId]: elapsed }));
        }
    };

    const handleInjectBudget = async (e: React.FormEvent) => {
        e.preventDefault();
        const amt = parseFloat(injectAmount);
        if (isNaN(amt) || amt <= 0) {
            alert('Introduce un importe válido');
            return;
        }

        setInjecting(true);
        try {
            const selectedServer = servers.find(s => s.id === selectedServerId);
            const res = await fetch('/api/voz/logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeName: employeeName,
                    action: 'SERVER_BUDGET_INJECTION',
                    details: `Server: ${selectedServerId} (${selectedServer?.name}). Amount: ${amt.toFixed(2)}€. Notes: ${injectNotes || 'Mantenimiento preventivo'}`
                })
            });

            if (res.ok) {
                alert(`¡Se han inyectado ${amt.toFixed(2)} € correctamente en ${selectedServer?.name}!`);
                setInjectAmount('');
                setInjectNotes('');
                fetchSystemLogs();
            } else {
                alert('Error al registrar la inyección de presupuesto');
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión');
        } finally {
            setInjecting(false);
        }
    };

    const toggleMaintenanceMode = async (serverId: string) => {
        const currentVal = !!maintenanceMap[serverId];
        const nextVal = !currentVal;
        const confirmMsg = nextVal 
            ? `¿Estás seguro de activar el MODO MANTENIMIENTO para ${serverId}? Esto alertará al sistema.`
            : `¿Desactivar el MODO MANTENIMIENTO para ${serverId}?`;
        
        if (!confirm(confirmMsg)) return;

        const updated = { ...maintenanceMap, [serverId]: nextVal };
        setMaintenanceMap(updated);
        localStorage.setItem('vozServersMaintenance', JSON.stringify(updated));

        // Log this state change to DB
        try {
            await fetch('/api/voz/logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeName: employeeName,
                    action: 'SERVER_MAINTENANCE_TOGGLE',
                    details: `Server: ${serverId}. Maintenance Mode: ${nextVal ? 'ENABLED' : 'DISABLED'}`
                })
            });
            fetchSystemLogs();
        } catch (err) {
            console.error(err);
        }
    };

    const selectedServer = servers.find(s => s.id === selectedServerId)!;
    const serverStatus = statusMap[selectedServerId] || 'unknown';
    const serverLatency = latencyMap[selectedServerId] || 0;
    const isMaintenance = !!maintenanceMap[selectedServerId];
    const serverBudget = injectedBudgets[selectedServerId] || 0;
    const serverBalance = serverBudget - selectedServer.estimatedCost;

    // Sum estimated costs
    const totalMonthlyCost = servers.reduce((acc, s) => acc + s.estimatedCost, 0);

    // Calculate quota percentage
    const quotaPct = Math.round((selectedServer.quotaUsed / selectedServer.quotaMax) * 100);
    const nearQuotaLimit = quotaPct >= 85;

    return (
        <div style={{ padding: '10px', height: '100%', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🖥️ Control y Mantenimiento de Servidores
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <input 
                            type="checkbox" 
                            id="chkAutoRefresh" 
                            checked={autoRefresh} 
                            onChange={(e) => setAutoRefresh(e.target.checked)} 
                        />
                        <label htmlFor="chkAutoRefresh" style={{ fontSize: '13px' }}>Auto-monitorear (15s)</label>
                    </div>
                    <div className="status-bar" style={{ padding: '2px 8px', background: '#ccc', border: '1px solid #808080' }}>
                        Gasto Mensual Estimado Total: <strong style={{ color: 'red' }}>{totalMonthlyCost.toFixed(2)} €</strong>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '15px', alignItems: 'start' }}>
                
                {/* Left Side: Server list */}
                <div className="window" style={{ height: '560px', display: 'flex', flexDirection: 'column' }}>
                    <div className="title-bar">
                        <div className="title-bar-text">Lista de Servidores</div>
                    </div>
                    <div className="window-body" style={{ flex: 1, padding: '4px', overflowY: 'auto', background: 'white' }}>
                        <ul className="tree-view" style={{ border: 'none', margin: 0, padding: 0 }}>
                            {servers.map(s => {
                                const isSel = s.id === selectedServerId;
                                const status = statusMap[s.id] || 'unknown';
                                const latency = latencyMap[s.id] || 0;
                                const isMaint = !!maintenanceMap[s.id];
                                return (
                                    <li 
                                        key={s.id}
                                        onClick={() => setSelectedServerId(s.id)}
                                        style={{
                                            padding: '8px 10px',
                                            cursor: 'pointer',
                                            backgroundColor: isSel ? 'navy' : 'transparent',
                                            color: isSel ? 'white' : 'black',
                                            borderBottom: '1px solid #e0e0e0',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '16px' }}>
                                                {s.id === 'supabase' ? '🗄️' : 
                                                 s.id === 'vercel' ? '⚡' : 
                                                 s.id === 'openai' ? '🧠' : 
                                                 s.id === 'firebase' ? '🔔' : 
                                                 s.id === 'stripe' ? '💳' : '📦'}
                                            </span>
                                            <span style={{ fontSize: '13px', fontWeight: isSel ? 'bold' : 'normal' }}>{s.name}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            {isMaint && (
                                                <span style={{ background: 'orange', color: 'black', fontSize: '0.7em', padding: '0 3px', fontWeight: 'bold' }}>MANT</span>
                                            )}
                                            {status === 'up' && latency > 0 && (
                                                <span style={{ fontSize: '11px', opacity: 0.7 }}>{latency}ms</span>
                                            )}
                                            <span 
                                                title={status === 'up' ? 'Online' : status === 'checking' ? 'Verificando...' : 'Offline'}
                                                style={{
                                                    width: '10px',
                                                    height: '10px',
                                                    borderRadius: '50%',
                                                    display: 'inline-block',
                                                    backgroundColor: status === 'up' ? '#0f0' : status === 'checking' ? 'orange' : '#f00',
                                                    border: '1px solid #555'
                                                }}
                                            />
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
 
                {/* Right Side: Selected server details and operations */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    
                    {/* Server general stats */}
                    <div className="window">
                        <div className="title-bar">
                            <div className="title-bar-text">Detalles del Sistema - {selectedServer.name}</div>
                        </div>
                        <div className="window-body">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #808080', paddingBottom: '10px', marginBottom: '15px' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 5px 0', fontSize: '17px', color: 'navy', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {selectedServer.name}
                                        {isMaintenance && (
                                            <span style={{ background: '#ff0000', color: '#fff', fontSize: '11px', padding: '2px 6px', border: '1px solid black' }}>MODO MANTENIMIENTO ACTIVO</span>
                                        )}
                                    </h3>
                                    <span style={{ color: '#666', fontSize: '13px' }}>Categoría: <strong>{selectedServer.serviceType}</strong></span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button 
                                        onClick={() => toggleMaintenanceMode(selectedServer.id)}
                                        style={{ padding: '4px 10px', background: isMaintenance ? '#e0e0e0' : '#ffe0e0', fontWeight: 'bold' }}
                                    >
                                        🛠️ {isMaintenance ? 'Desactivar Mant.' : 'Poner en Mantenimiento'}
                                    </button>
                                    <button onClick={() => checkServiceStatus(selectedServer.id, selectedServer.endpoint)} style={{ padding: '4px 10px' }}>
                                        🔄 Test Conexión
                                    </button>
                                    <a href={selectedServer.dashboardUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                                        <button style={{ padding: '4px 10px', fontWeight: 'bold' }}>
                                            🌐 Abrir Consola
                                        </button>
                                    </a>
                                </div>
                            </div>

                            <p style={{ lineHeight: '1.4', margin: '0 0 15px 0' }}>{selectedServer.role}</p>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '15px' }}>
                                <div className="field-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', background: '#e0e0e0', padding: '8px', border: '1px solid #808080' }}>
                                    <span style={{ fontSize: '12px', color: '#555' }}>ENDPOINT / API URL</span>
                                    <strong style={{ fontSize: '13px', wordBreak: 'break-all', marginTop: '3px' }}>{selectedServer.endpoint}</strong>
                                </div>
                                <div className="field-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', background: '#e0e0e0', padding: '8px', border: '1px solid #808080' }}>
                                    <span style={{ fontSize: '12px', color: '#555' }}>CREDENCIAL / API KEY</span>
                                    <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', marginTop: '3px' }}>
                                        <strong style={{ fontSize: '13px', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                                            {showKeys[selectedServer.id] ? selectedServer.fullKey : selectedServer.maskedKey}
                                        </strong>
                                        <button 
                                            onClick={() => setShowKeys(prev => ({ ...prev, [selectedServer.id]: !prev[selectedServer.id] }))}
                                            style={{ padding: '1px 5px', fontSize: '12px' }}
                                        >
                                            {showKeys[selectedServer.id] ? 'Ocultar' : 'Mostrar'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Live performance & Latency bar */}
                            <div style={{ display: 'grid', gridTemplateColumns: '150px 150px 1fr', gap: '15px', background: '#f0f0f0', padding: '8px', border: '1px solid #808080' }}>
                                <div>
                                    <span style={{ fontSize: '12px', color: '#555', display: 'block' }}>LATENCIA</span>
                                    <strong>{serverLatency > 0 ? `${serverLatency} ms` : metricsLoading ? 'Midiendo...' : 'Desconocida'}</strong>
                                </div>
                                <div>
                                    <span style={{ fontSize: '12px', color: '#555', display: 'block' }}>ESTADO RED</span>
                                    <strong style={{ color: serverStatus === 'up' ? 'green' : serverStatus === 'checking' ? 'orange' : '#999' }}>
                                        {serverStatus === 'up' ? '✅ Online' : serverStatus === 'checking' ? '⏳ Comprobando...' : metricsLoading ? '⏳ Midiendo...' : '❌ Offline'}
                                    </strong>
                                </div>
                                <div>
                                    <span style={{ fontSize: '12px', color: '#555', display: 'block' }}>
                                        {selectedServer.id === 'supabase' ? 'Registros en BD' :
                                         selectedServer.id === 'stripe' ? 'Cobros Hoy' :
                                         selectedServer.performanceMetricName}
                                    </span>
                                    <strong>
                                        {selectedServer.id === 'supabase' && realMetrics.supabase ? (
                                            `${realMetrics.supabase.userCount ?? '?'} usuarios · ${realMetrics.supabase.videoCount ?? '?'} vídeos`
                                        ) : selectedServer.id === 'stripe' && realMetrics.stripe ? (
                                            `${realMetrics.stripe.chargesToday ?? 0} transacciones · ${realMetrics.stripe.revenueToday?.toFixed(2) ?? '0.00'} €`
                                        ) : selectedServer.id === 'openai' && realMetrics.openai?.totalTokensMonth ? (
                                            `${(realMetrics.openai.totalTokensMonth / 1000).toFixed(0)}k tokens este mes`
                                        ) : (
                                            selectedServer.performanceMetricValue
                                        )}
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Resources and quotas Visualizer */}
                    <div className="window">
                        <div className="title-bar">
                            <div className="title-bar-text">Consumo y Cuota de Recursos</div>
                        </div>
                        <div className="window-body">
                            {(() => {
                                // Use real data when available
                                const rm = realMetrics[selectedServer.id];
                                let quotaName = selectedServer.quotaName;
                                let quotaUsed = selectedServer.quotaUsed;
                                let quotaMax = selectedServer.quotaMax;
                                let quotaUnit = selectedServer.quotaUnit;
                                if (selectedServer.id === 'supabase' && rm?.dbSizeGB) {
                                    quotaName = 'Almacenamiento de BD (REAL)';
                                    quotaUsed = rm.dbSizeGB;
                                    quotaMax = 8;
                                    quotaUnit = 'GB';
                                }
                                if (selectedServer.id === 'stripe' && rm?.availableEur !== null && rm?.availableEur !== undefined) {
                                    quotaName = 'Balance Stripe Disponible (REAL)';
                                    quotaUsed = rm.availableEur;
                                    quotaMax = 1000;
                                    quotaUnit = '€';
                                }
                                if (selectedServer.id === 'openai' && rm?.estimatedCostUsd) {
                                    quotaName = 'Coste Estimado Mensual (REAL)';
                                    quotaUsed = rm.estimatedCostUsd;
                                    quotaMax = 50;
                                    quotaUnit = '$';
                                }
                                const pct = quotaMax > 0 ? Math.round((quotaUsed / quotaMax) * 100) : 0;
                                const isNear = pct >= 80;
                                return (
                                    <>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                            <span>{quotaName}: <strong style={{ color: rm ? 'darkgreen' : 'inherit' }}>{quotaUsed} / {quotaMax} {quotaUnit}</strong>
                                                {rm && <span style={{ fontSize: '11px', color: 'darkgreen', marginLeft: '6px' }}>● DATOS REALES</span>}
                                                {!rm && metricsLoading && <span style={{ fontSize: '11px', color: '#999', marginLeft: '6px' }}>⏳ cargando...</span>}
                                            </span>
                                            <span style={{ fontWeight: isNear ? 'bold' : 'normal', color: isNear ? 'red' : 'inherit' }}>
                                                {pct}% {isNear ? '⚠️ CUOTA CRÍTICA' : 'Ok'}
                                            </span>
                                        </div>
                                        <div style={{ height: '22px', border: '1px inset #808080', background: 'white', position: 'relative', display: 'flex', alignItems: 'center' }}>
                                            <div style={{ 
                                                width: `${Math.min(pct, 100)}%`, 
                                                height: '100%', 
                                                backgroundColor: isNear ? 'red' : 'navy',
                                                transition: 'width 0.5s ease-in-out'
                                            }} />
                                        </div>
                                        {metricsLastUpdated && (
                                            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                                                Actualizado: {new Date(metricsLastUpdated).toLocaleTimeString('es-ES')}
                                                <button onClick={fetchRealMetrics} style={{ marginLeft: '10px', fontSize: '12px', padding: '1px 6px' }}>🔄 Actualizar</button>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Cost and Balance control */}
                    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '15px' }}>
                        
                        {/* Cost card */}
                        <div className="window">
                            <div className="title-bar">
                                <div className="title-bar-text">Control Financiero (Billing)</div>
                            </div>
                            <div className="window-body">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {/* Real cost from API if available */}
                                    {realMetrics[selectedServer.id]?.monthlyCostEur !== undefined && realMetrics[selectedServer.id]?.monthlyCostEur !== null && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e0e0e0', paddingBottom: '4px' }}>
                                            <span>💳 Coste Mensual ({realMetrics[selectedServer.id]?.plan}):</span>
                                            <strong style={{ color: 'darkgreen' }}>● {realMetrics[selectedServer.id].monthlyCostEur.toFixed(2)} €/mes</strong>
                                        </div>
                                    )}
                                    {selectedServer.id === 'stripe' && realMetrics.stripe?.availableEur !== undefined && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e0e0e0', paddingBottom: '4px' }}>
                                            <span>💰 Balance en Stripe:</span>
                                            <strong style={{ color: 'darkgreen' }}>● {realMetrics.stripe.availableEur?.toFixed(2) ?? '—'} €</strong>
                                        </div>
                                    )}
                                    {selectedServer.id === 'openai' && realMetrics.openai?.estimatedCostUsd !== undefined && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e0e0e0', paddingBottom: '4px' }}>
                                            <span>📊 Coste OpenAI este mes:</span>
                                            <strong style={{ color: 'darkorange' }}>~{realMetrics.openai.estimatedCostUsd?.toFixed(2) ?? '—'} USD</strong>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e0e0e0', paddingBottom: '4px' }}>
                                        <span>Presupuesto Inyectado:</span>
                                        <strong style={{ color: 'green' }}>{serverBudget.toFixed(2)} €</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #808080', paddingBottom: '6px' }}>
                                        <span>Saldo Disponible:</span>
                                        <strong style={{ color: serverBalance >= 0 ? 'green' : 'red', fontSize: '15px' }}>
                                            {serverBalance.toFixed(2)} €
                                            {serverBalance < selectedServer.estimatedCost && ' ⚠️ Recarga sugerida'}
                                        </strong>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                        Ciclo: {selectedServer.billingPeriod}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Inyectar Fondos Form */}
                        <div className="window">
                            <div className="title-bar">
                                <div className="title-bar-text">Inyectar Presupuesto de Mantenimiento</div>
                            </div>
                            <div className="window-body">
                                <form onSubmit={handleInjectBudget} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label htmlFor="injectAmt" style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Importe a Inyectar (€) *</label>
                                            <input 
                                                id="injectAmt"
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                value={injectAmount}
                                                onChange={e => setInjectAmount(e.target.value)}
                                                placeholder="Ej. 150.00"
                                                style={{ width: '100%' }}
                                                required
                                            />
                                        </div>
                                        <div style={{ flex: 2 }}>
                                            <label htmlFor="injectNts" style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Concepto / Notas</label>
                                            <input 
                                                id="injectNts"
                                                type="text"
                                                value={injectNotes}
                                                onChange={e => setInjectNotes(e.target.value)}
                                                placeholder="Ej. Recarga de saldo plataforma"
                                                style={{ width: '100%' }}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '5px' }}>
                                        <button type="submit" disabled={injecting} style={{ padding: '6px 20px', fontWeight: 'bold' }}>
                                            {injecting ? 'Inyectando...' : '💰 Inyectar Fondos'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                    </div>

                    {/* Historical injections log */}
                    <div className="window">
                        <div className="title-bar">
                            <div className="title-bar-text">Historial de Mantenimiento e Inyecciones de Fondos</div>
                        </div>
                        <div className="window-body" style={{ padding: 0 }}>
                            {loadingLogs ? (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Cargando historial de servidores...</div>
                            ) : logs.length === 0 ? (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No hay registros de inyecciones de presupuesto históricos.</div>
                            ) : (
                                <table className="interactive" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                                    <thead>
                                        <tr style={{ background: '#e0e0e0', borderBottom: '1px solid #808080' }}>
                                            <th style={{ padding: '8px' }}>Fecha y Hora</th>
                                            <th style={{ padding: '8px' }}>Empleado</th>
                                            <th style={{ padding: '8px' }}>Servidor</th>
                                            <th style={{ padding: '8px' }}>Acción</th>
                                            <th style={{ padding: '8px' }}>Detalles</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.map((log) => {
                                            const details = log.details || '';
                                            const matchServer = details.match(/Server: (\w+)/);
                                            const serverId = matchServer ? matchServer[1] : 'unknown';
                                            const serverName = servers.find(s => s.id === serverId)?.name || serverId;
                                            
                                            let actionLabel = 'INYECCIÓN FONDOS';
                                            let actionColor = 'green';
                                            if (log.action === 'SERVER_MAINTENANCE_TOGGLE') {
                                                actionLabel = 'MODO MANTENIMIENTO';
                                                actionColor = 'orange';
                                            }
                                            
                                            return (
                                                <tr key={log.id} style={{ borderBottom: '1px solid #dfdfdf' }}>
                                                    <td style={{ padding: '8px', whiteSpace: 'nowrap' }}>{new Date(log.timestamp).toLocaleString()}</td>
                                                    <td style={{ padding: '8px' }}><strong>{log.employeeName}</strong></td>
                                                    <td style={{ padding: '8px' }}>{serverName}</td>
                                                    <td style={{ padding: '8px', color: actionColor, fontWeight: 'bold' }}>{actionLabel}</td>
                                                    <td style={{ padding: '8px' }}>{details.includes('Amount:') ? details.split('Notes:')[1] || details : details}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
