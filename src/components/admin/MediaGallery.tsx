'use client';

import { useState, useEffect } from 'react';
import styles from '@/app/admin/admin.module.css';

interface MediaFile {
    filename: string;
    url: string;
    type: 'image' | 'video';
    size: number;
    createdAt: string;
}

interface MediaGalleryProps {
    onSelect?: (files: string[]) => void;
    selectionMode?: boolean;
    initialSelection?: string[];
    maxSelection?: number;
}

export default function MediaGallery({
    onSelect,
    selectionMode = false,
    initialSelection = [],
    maxSelection = Infinity
}: MediaGalleryProps) {
    const [media, setMedia] = useState<MediaFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');
    const [dragActive, setDragActive] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set(initialSelection));

    useEffect(() => {
        loadMedia();
    }, []);

    // Effect to report selection changes if in selection mode without explicit confirmation button inside (optional)
    // For now we will rely on a parent "Confirm" button if used in a modal, or just local state.
    // If onSelect is provided and we want real-time updates:
    // useEffect(() => {
    //     if (onSelect) onSelect(Array.from(selectedFiles));
    // }, [selectedFiles, onSelect]);

    async function loadMedia() {
        try {
            const res = await fetch('/api/media');
            const data = await res.json();
            setMedia(data);
        } catch (error) {
            console.error('Error loading media:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleFileUpload(file: File) {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/media/upload', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            if (res.ok) {
                await loadMedia();
            } else {
                alert(data.error || 'Error al subir archivo');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Error al subir archivo');
        } finally {
            setUploading(false);
        }
    }

    async function handleDelete(url: string) {
        if (!confirm('¿Estás seguro de que quieres eliminar este archivo?')) {
            return;
        }

        try {
            const res = await fetch('/api/media', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            if (res.ok) {
                await loadMedia();
                setSelectedFiles(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(url);
                    return newSet;
                });
            } else {
                alert('Error al eliminar archivo');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Error al eliminar archivo');
        }
    }

    async function handleBulkDelete() {
        if (selectedFiles.size === 0) return;

        if (!confirm(`¿Estás seguro de que quieres eliminar ${selectedFiles.size} archivos?`)) {
            return;
        }

        try {
            const res = await fetch('/api/media', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ urls: Array.from(selectedFiles) })
            });

            if (res.ok) {
                await loadMedia();
                setSelectedFiles(new Set());
                alert('Archivos eliminados correctamente');
            } else {
                const data = await res.json();
                alert(data.error || (data.errors ? JSON.stringify(data.errors) : 'Error al eliminar archivos'));
            }
        } catch (error) {
            console.error('Bulk delete error:', error);
            alert('Error al eliminar archivos: ' + String(error));
        }
    }

    function toggleSelection(url: string) {
        const newSet = new Set(selectedFiles);
        if (newSet.has(url)) {
            newSet.delete(url);
        } else {
            if (selectionMode && newSet.size >= maxSelection) {
                alert(`Máximo ${maxSelection} archivos permitidos`);
                return;
            }
            newSet.add(url);
        }

        setSelectedFiles(newSet);
        if (onSelect) onSelect(Array.from(newSet));
    }

    function selectAll() {
        if (selectionMode && maxSelection < filteredMedia.length) {
            // Cannot select all if there is a limit
            return;
        }

        if (selectedFiles.size === filteredMedia.length) {
            const newSet = new Set<string>();
            setSelectedFiles(newSet);
            if (onSelect) onSelect([]);
        } else {
            const newSet = new Set(filteredMedia.map(m => m.url));
            setSelectedFiles(newSet);
            if (onSelect) onSelect(Array.from(newSet));
        }
    }

    function copyToClipboard(url: string) {
        const fullUrl = window.location.origin + url;
        navigator.clipboard.writeText(fullUrl);
    }

    function formatFileSize(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    };

    const filteredMedia = media.filter(m => filter === 'all' || m.type === filter);

    if (loading) {
        return <div>Cargando medios...</div>;
    }

    return (
        <div>
            <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: selectionMode ? '10px' : '20px' }}>
                {!selectionMode && <h1 className={styles.title}>Gestión de Medios</h1>}

                {!selectionMode && selectedFiles.size > 0 && (
                    <button
                        onClick={handleBulkDelete}
                        style={{
                            padding: '10px 20px',
                            background: '#d32f2f',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}
                    >
                        🗑️ Eliminar seleccionados ({selectedFiles.size})
                    </button>
                )}
            </div>

            {/* Upload Area */}
            <div className={styles.card} style={{ marginBottom: '20px' }}>
                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    style={{
                        border: dragActive ? '2px dashed var(--cex-red)' : '2px dashed #ddd',
                        borderRadius: '8px',
                        padding: selectionMode ? '20px' : '40px',
                        textAlign: 'center',
                        background: dragActive ? '#fff5f5' : '#f9f9f9',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                    onClick={() => document.getElementById('fileInput')?.click()}
                >
                    <input
                        id="fileInput"
                        type="file"
                        accept="image/*,video/*"
                        onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                                handleFileUpload(e.target.files[0]);
                            }
                        }}
                        style={{ display: 'none' }}
                    />
                    <div style={{ fontSize: selectionMode ? '32px' : '48px', marginBottom: '10px' }}>📁</div>
                    <p style={{ fontSize: selectionMode ? '1rem' : '1.1rem', marginBottom: '5px' }}>
                        {uploading ? 'Subiendo archivo...' : 'Arrastra archivos aquí o haz clic para seleccionar'}
                    </p>
                </div>
            </div>

            {/* Filter Buttons & Selection */}
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        type="button"
                        onClick={() => setFilter('all')}
                        style={{
                            padding: '6px 12px',
                            background: filter === 'all' ? 'var(--cex-red)' : '#f0f0f0',
                            color: filter === 'all' ? 'white' : '#333',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Todos
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter('image')}
                        style={{
                            padding: '6px 12px',
                            background: filter === 'image' ? 'var(--cex-red)' : '#f0f0f0',
                            color: filter === 'image' ? 'white' : '#333',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Imágenes
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter('video')}
                        style={{
                            padding: '6px 12px',
                            background: filter === 'video' ? 'var(--cex-red)' : '#f0f0f0',
                            color: filter === 'video' ? 'white' : '#333',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Videos
                    </button>
                </div>

                {!selectionMode && (
                    <button
                        type="button"
                        onClick={selectAll}
                        style={{
                            padding: '6px 12px',
                            background: 'transparent',
                            color: 'var(--cex-blue)',
                            border: '1px solid var(--cex-blue)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        {selectedFiles.size === filteredMedia.length && filteredMedia.length > 0 ? 'Deseleccionar todos' : 'Seleccionar todos'}
                    </button>
                )}
            </div>

            {/* Media Gallery */}
            <div className={styles.card}>
                {filteredMedia.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
                        No hay archivos multimedia
                    </p>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                        gap: '20px'
                    }}>
                        {filteredMedia.map((file) => {
                            const isSelected = selectedFiles.has(file.url);
                            return (
                                <div
                                    key={file.url}
                                    style={{
                                        border: isSelected ? '2px solid var(--cex-red)' : '1px solid #ddd',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        background: isSelected ? '#fff5f5' : 'white',
                                        position: 'relative',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => toggleSelection(file.url)}
                                >
                                    {/* Checkbox overlay */}
                                    <div style={{
                                        position: 'absolute',
                                        top: '10px',
                                        left: '10px',
                                        zIndex: 10,
                                        width: '24px',
                                        height: '24px',
                                        background: 'rgba(255,255,255,0.8)',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => { }} // Handled by parent click
                                            style={{
                                                width: '18px',
                                                height: '18px',
                                                cursor: 'pointer'
                                            }}
                                        />
                                    </div>

                                    {/* Preview */}
                                    <div style={{
                                        width: '100%',
                                        height: '120px',
                                        background: '#f5f5f5',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden'
                                    }}>
                                        {file.type === 'image' ? (
                                            <img
                                                src={file.url}
                                                alt={file.filename}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover'
                                                }}
                                            />
                                        ) : (
                                            <video
                                                src={file.url}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover'
                                                }}
                                            />
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div style={{ padding: '8px' }}>
                                        <p style={{
                                            fontSize: '0.75rem',
                                            marginBottom: '5px',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            fontWeight: isSelected ? 'bold' : 'normal'
                                        }} title={file.filename}>
                                            {file.filename.split('-').slice(1).join('-') || file.filename}
                                        </p>


                                        {/* Actions - Only in management mode */}
                                        {!selectionMode && (
                                            <div style={{ display: 'flex', gap: '5px' }} onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    type="button"
                                                    onClick={() => copyToClipboard(file.url)}
                                                    style={{
                                                        flex: 1,
                                                        padding: '2px 5px',
                                                        background: '#eeeeee',
                                                        color: '#333',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.7rem'
                                                    }}
                                                    title="Copiar link"
                                                >
                                                    🔗
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(file.url)}
                                                    style={{
                                                        padding: '2px 5px',
                                                        background: 'transparent',
                                                        color: '#f44336',
                                                        border: '1px solid #f44336',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.7rem'
                                                    }}
                                                    title="Eliminar"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
