"use client";
import { useState } from 'react';
import BottomNav from '../components/BottomNav';

export default function UploadPage() {
    const [title, setTitle] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState('');

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setStatus('Subiendo...');
        // Simulador de subida (luego se conecta con Supabase Storage)
        setTimeout(() => {
            setStatus('¡Subido con éxito!');
        }, 2000);
    };

    return (
        <div style={{ backgroundColor: '#000', color: 'white', height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px' }}>
                <h2>Subir a VOZ</h2>
                <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '400px', marginTop: '20px' }}>
                    <input 
                        type="file" 
                        accept="video/*,audio/*"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        style={{ padding: '10px', backgroundColor: '#222', borderRadius: '5px' }}
                    />
                    <input 
                        type="text" 
                        placeholder="Escribe una descripción..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        style={{ padding: '10px', borderRadius: '5px', border: 'none', backgroundColor: '#222', color: 'white' }}
                    />
                    <button 
                        type="submit" 
                        disabled={!file}
                        style={{ padding: '15px', backgroundColor: '#8E2DE2', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold' }}
                    >
                        Publicar
                    </button>
                    {status && <div style={{ marginTop: '10px', textAlign: 'center', color: '#4CAF50' }}>{status}</div>}
                </form>
            </div>
            <BottomNav />
        </div>
    );
}
