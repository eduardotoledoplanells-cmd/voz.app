'use client';
import { useState } from 'react';
import styles from '../voz-admin.module.css';

export default function DatabasePage() {
    const [isLoading, setIsLoading] = useState(false);
    const [dbPassword, setDbPassword] = useState('');
    const [result, setResult] = useState<{ success?: boolean, message?: string, error?: string } | null>(null);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => {
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
    };

    const runMigration = async () => {
        setIsLoading(true);
        setResult(null);
        setLogs([]);
        addLog("Iniciando migración de base de datos...");

        try {
            const response = await fetch('/api/voz/db/migrate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dbPassword })
            });

            const data = await response.json();

            if (data.success) {
                addLog("✅ " + data.message);
                setResult({ success: true, message: data.message });
            } else {
                addLog("❌ Error: " + (data.error || "Desconocido"));
                setResult({ success: false, error: data.error });
            }
        } catch (error: any) {
            addLog("❌ Error de red: " + error.message);
            setResult({ success: false, error: "No se pudo comunicar con el servidor." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className="window" style={{ width: '100%', maxWidth: '600px', margin: '20px auto' }}>
                <div className="title-bar">
                    <div className="title-bar-text">Gestión de Base de Datos - Supabase</div>
                </div>
                <div className="window-body">
                    <p>Usa esta herramienta para inicializar las tablas necesarias de VOZ (Followers, Fans, etc.)</p>

                    <div className="field-row-stacked" style={{ marginBottom: '15px' }}>
                        <label htmlFor="dbPass">Contraseña de Base de Datos (PostgreSQL):</label>
                        <input
                            id="dbPass"
                            type="password"
                            value={dbPassword}
                            onChange={(e) => setDbPassword(e.target.value)}
                            placeholder="Dejar vacío para usar predeterminada"
                            style={{ width: '100%' }}
                        />
                        <p style={{ fontSize: '0.8em', color: '#666' }}>
                            Nota: Esta es la contraseña de PostgreSQL que configuraste en Supabase, no tu contraseña de cuenta.
                        </p>
                    </div>

                    <div className="field-row" style={{ justifyContent: 'center', gap: '10px' }}>
                        <button
                            onClick={runMigration}
                            disabled={isLoading}
                            style={{ minWidth: '150px' }}
                        >
                            {isLoading ? 'Procesando...' : '🚀 Inicializar Tablas'}
                        </button>
                    </div>

                    {logs.length > 0 && (
                        <div style={{ marginTop: '20px' }}>
                            <label>Progreso:</label>
                            <div style={{
                                background: '#000',
                                color: '#0f0',
                                padding: '10px',
                                fontFamily: 'monospace',
                                fontSize: '0.9em',
                                maxHeight: '200px',
                                overflowY: 'auto',
                                marginTop: '5px'
                            }}>
                                {logs.map((log, i) => <div key={i}>{log}</div>)}
                            </div>
                        </div>
                    )}

                    {result && (
                        <div style={{
                            marginTop: '20px',
                            padding: '10px',
                            border: `2px solid ${result.success ? 'green' : 'red'}`,
                            background: result.success ? '#e6ffe6' : '#ffe6e6'
                        }}>
                            <strong>{result.success ? '¡Éxito!' : 'Error'}</strong>
                            <p>{result.message || result.error}</p>
                            {!result.success && (
                                <div style={{ fontSize: '0.9em' }}>
                                    <p>Si el error persiste, asegúrate de:</p>
                                    <ul>
                                        <li>La contraseña es correcta.</li>
                                        <li>Tu proyecto de Supabase no está en pausa.</li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="window" style={{ width: '100%', maxWidth: '600px', margin: '20px auto' }}>
                <div className="title-bar">
                    <div className="title-bar-text">Esquema SQL Manual</div>
                </div>
                <div className="window-body">
                    <p>Si la automatización falla, copia este código y pégalo en el SQL Editor de Supabase:</p>
                    <textarea
                        readOnly
                        style={{ width: '100%', height: '150px', fontFamily: 'monospace', fontSize: '0.8em' }}
                        value={`CREATE TABLE IF NOT EXISTS user_follows (
    follower_handle TEXT NOT NULL,
    following_handle TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_handle, following_handle)
);

ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON user_follows FOR SELECT USING (true);
CREATE POLICY "All access for authenticated" ON user_follows FOR ALL USING (true);

NOTIFY pgrst, 'reload schema';`}
                    />
                </div>
            </div>
        </div>
    );
}
