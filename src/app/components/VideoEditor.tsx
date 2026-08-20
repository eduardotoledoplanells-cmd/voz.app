"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Music as MusicIcon, Zap, X, Search, Scissors, Volume2, VolumeX, Image as ImageIcon, Settings, RotateCcw } from 'lucide-react';
import { ALL_FILTERS } from '../constants/filters';
import { StableSlider } from './StableSlider';

interface VideoEditorProps {
    file: File;
    onApply: (settings: EditorSettings) => void;
    onCancel: () => void;
}

export interface EditorSettings {
    trimRange: [number, number]; // percentages 0-100
    selectedMusic: any | null;
    selectedFilter: any | null;
    filterIntensity: number;
    filterBrightness: number;
    isMuted: boolean;
    musicVolume: number;
    description: string;
}

export const VideoEditor: React.FC<VideoEditorProps> = ({ file, onApply, onCancel }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [trimRange, setTrimRange] = useState<[number, number]>([0, 100]);
    const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const [selectedMusic, setSelectedMusic] = useState<any>(null);
    const [selectedFilter, setSelectedFilter] = useState<any>(null);
    const [filterIntensity, setFilterIntensity] = useState(0.3);
    const [filterBrightness, setFilterBrightness] = useState(0.5);
    const [isMuted, setIsMuted] = useState(false);
    const [musicVolume, setMusicVolume] = useState(0.5);
    const [description, setDescription] = useState('');
    
    // activeModal can be: 'music', 'trim', 'filters', null
    const [activeModal, setActiveModal] = useState<'trim' | 'filters' | 'music' | null>(null);
    
    const [musicQuery, setMusicQuery] = useState('');
    const [musicResults, setMusicResults] = useState<any[]>([]);
    
    const [thumbnails, setThumbnails] = useState<string[]>([]);
    const [isExtracting, setIsExtracting] = useState(false);
    const [videoDuration, setVideoDuration] = useState(0);
    
    const previewUrl = useRef(URL.createObjectURL(file)).current;

    useEffect(() => {
        return () => URL.revokeObjectURL(previewUrl);
    }, [previewUrl]);

    useEffect(() => {
        let isCancelled = false;
        
        const extractFrames = async () => {
            setIsExtracting(true);
            const video = document.createElement('video');
            video.src = previewUrl;
            video.crossOrigin = "anonymous";
            video.muted = true;
            video.playsInline = true;
            
            await new Promise((resolve) => {
                video.onloadedmetadata = () => resolve(true);
            });
            
            if (isCancelled) return;
            const duration = video.duration;
            if (!duration || !isFinite(duration)) {
                setIsExtracting(false);
                return;
            }
            setVideoDuration(duration);
            
            const numFrames = 10;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const targetHeight = 50;
            const targetWidth = (video.videoWidth / video.videoHeight) * targetHeight || 50;
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            
            const frames: string[] = [];
            
            for (let i = 0; i < numFrames; i++) {
                if (isCancelled) return;
                const time = (duration / numFrames) * i;
                video.currentTime = time;
                
                await new Promise((resolve) => {
                    const handleSeeked = () => {
                        video.removeEventListener('seeked', handleSeeked);
                        resolve(true);
                    };
                    video.addEventListener('seeked', handleSeeked);
                });
                
                if (ctx) {
                    ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
                    frames.push(canvas.toDataURL('image/jpeg', 0.5));
                }
            }
            
            if (!isCancelled) {
                setThumbnails(frames);
                setIsExtracting(false);
            }
        };

        extractFrames();

        return () => {
            isCancelled = true;
        };
    }, [previewUrl]);

    const handlePointerDown = (e: React.PointerEvent, handle: 'start' | 'end') => {
        setIsDragging(handle);
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging || !trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        let x = e.clientX - rect.left;
        x = Math.max(0, Math.min(x, rect.width));
        const percentage = (x / rect.width) * 100;
        
        if (isDragging === 'start') {
            const newStart = Math.min(percentage, trimRange[1] - 5);
            setTrimRange([newStart, trimRange[1]]);
            if (videoRef.current && videoDuration) {
                videoRef.current.currentTime = (newStart / 100) * videoDuration;
            }
        } else {
            const newEnd = Math.max(percentage, trimRange[0] + 5);
            setTrimRange([trimRange[0], newEnd]);
            if (videoRef.current && videoDuration) {
                videoRef.current.currentTime = (newEnd / 100) * videoDuration;
            }
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDragging(null);
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) videoRef.current.pause();
            else videoRef.current.play();
            setIsPlaying(!isPlaying);
        }
    };

    const searchMusic = async () => {
        if (!musicQuery.trim()) return;
        try {
            const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(musicQuery)}&entity=song&limit=10`);
            const data = await response.json();
            setMusicResults(data.results.map((item: any) => ({
                id: item.trackId,
                title: item.trackName,
                artist: item.artistName,
                previewUrl: item.previewUrl,
                artwork: item.artworkUrl60
            })));
        } catch (e) {
            console.error('Error fetching music:', e);
        }
    };

    const getFilterStyle = () => {
        if (!selectedFilter || selectedFilter.id === 'none') return {};
        if (selectedFilter.id === 'bw') return { filter: 'grayscale(100%)' };
        if (selectedFilter.id === 'sepia') return { filter: 'sepia(100%)' };
        if (selectedFilter.id === 'vintage') return { filter: 'sepia(50%) contrast(1.2)' };
        
        return {
            boxShadow: `inset 0 0 0 9999px ${selectedFilter.color}`,
            filter: `brightness(${filterBrightness * 2}) contrast(${1 + filterIntensity})`
        };
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 1000000, display: 'flex', flexDirection: 'column' }}>
            {selectedMusic && <audio autoPlay src={selectedMusic.previewUrl} loop />}
            
            {/* Background Fullscreen Video */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '450px', height: '100dvh' }}>
                    <video
                        ref={videoRef}
                        src={previewUrl}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', ...getFilterStyle() }}
                        loop
                        muted={isMuted || !!selectedMusic}
                        onClick={togglePlay}
                    />
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', opacity: isPlaying ? 0 : 0.8 }}>
                        <Play size={64} color="white" fill="white" />
                    </div>

                    <style>{`
                        @media (min-width: 600px) {
                            .editor-sidebar {
                                left: -80px !important;
                            }
                        }
                        @media (max-width: 599px) {
                            .editor-sidebar {
                                left: 15px !important;
                            }
                        }
                    `}</style>

                    {/* Sidebar (Left, matching mobile app) */}
                    {!activeModal && (
                        <div className="editor-sidebar" style={{ position: 'absolute', top: '25%', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                            <button onClick={() => setActiveModal('music')} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '20px', backgroundColor: selectedMusic ? '#8E2DE2' : 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)', marginBottom: '4px' }}>
                                    <MusicIcon size={20} color="white" />
                                </div>
                                <span style={{ color: 'white', fontSize: '11px', fontWeight: '600', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>Música</span>
                            </button>

                            <button onClick={() => setIsMuted(!isMuted)} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '20px', backgroundColor: isMuted ? '#FF3B30' : 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)', marginBottom: '4px' }}>
                                    {isMuted ? <VolumeX size={20} color="white" /> : <Volume2 size={20} color="white" />}
                                </div>
                                <span style={{ color: 'white', fontSize: '11px', fontWeight: '600', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>{isMuted ? 'Sin audio' : 'Audio'}</span>
                            </button>

                            <button onClick={() => setActiveModal('trim')} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '20px', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)', marginBottom: '4px' }}>
                                    <Scissors size={20} color="white" />
                                </div>
                                <span style={{ color: 'white', fontSize: '11px', fontWeight: '600', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>Recortar</span>
                            </button>

                            <button onClick={() => setActiveModal('filters')} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '20px', backgroundColor: (selectedFilter && selectedFilter.id !== 'none') ? '#8E2DE2' : 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)', marginBottom: '4px' }}>
                                    <Settings size={20} color="white" />
                                </div>
                                <span style={{ color: 'white', fontSize: '11px', fontWeight: '600', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>Filtros</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Top Header Overlay */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', zIndex: 10, background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)' }}>
                <button onClick={onCancel} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
                    <X size={24} color="white" />
                </button>
                <div style={{ color: 'white', fontWeight: 'bold', fontSize: '16px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Editar Vídeo</div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
                        Borrador
                    </button>
                    <button 
                        onClick={() => onApply({ trimRange, selectedMusic, selectedFilter, filterIntensity, filterBrightness, isMuted, musicVolume, description })}
                        style={{ background: '#8E2DE2', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        Publicar
                    </button>
                </div>
            </div>

            {/* Currently Selected Music (Top Center) */}
            {selectedMusic && !activeModal && (
                <div style={{ position: 'absolute', top: '70px', left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 10, pointerEvents: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: '8px 16px', borderRadius: '20px', backdropFilter: 'blur(10px)', pointerEvents: 'auto' }}>
                        <MusicIcon size={14} color="#8E2DE2" style={{ marginRight: '8px' }} />
                        <span style={{ color: 'white', fontWeight: 'bold', fontSize: '14px', marginRight: '12px' }}>{selectedMusic.title}</span>
                    </div>
                </div>
            )}


            {/* Bottom Section: Description Input */}
            {!activeModal && (
                <div style={{ position: 'absolute', bottom: '0', left: 0, right: 0, padding: '20px', zIndex: 10, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '12px', padding: '10px 15px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <span style={{ color: 'white', fontWeight: 'bold', marginRight: '10px' }}>Texto:</span>
                        <input
                            type="text"
                            placeholder="Escribe una descripción..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            style={{ flex: 1, backgroundColor: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '15px' }}
                        />
                    </div>
                </div>
            )}

            {/* Modal Left Drawer (Filters/Music/Trim) */}
            {activeModal && (
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '100%', maxWidth: '400px', backgroundColor: '#111', borderTopRightRadius: '24px', borderBottomRightRadius: '24px', padding: '20px', zIndex: 20, display: 'flex', flexDirection: 'column', boxShadow: '4px 0 20px rgba(0,0,0,0.5)' }}>
                    
                    {/* Modal Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ fontWeight: 'bold', color: 'white', fontSize: '18px' }}>
                            {activeModal === 'filters' && 'Filtros'}
                            {activeModal === 'music' && 'Música'}
                            {activeModal === 'trim' && 'Recorte de vídeo'}
                        </div>
                        <button onClick={() => setActiveModal(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
                            <X size={16} color="white" />
                        </button>
                    </div>

                    {/* Modals Content */}
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        
                        {activeModal === 'filters' && (
                            <div style={{ display: 'flex', overflowX: 'auto', gap: '16px', paddingBottom: '10px', scrollbarWidth: 'none' }}>
                                {ALL_FILTERS.map((f: any) => (
                                    <div key={f.id} onClick={() => setSelectedFilter(f)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', minWidth: '60px' }}>
                                        <div style={{ width: '56px', height: '56px', borderRadius: '28px', backgroundColor: f.color === 'transparent' ? '#333' : f.color, border: selectedFilter?.id === f.id ? '3px solid white' : '3px solid transparent', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                            {f.icon === 'Zap' && <Zap color="white" size={24} />}
                                        </div>
                                        <span style={{ color: 'white', fontSize: '12px', marginTop: '6px', fontWeight: selectedFilter?.id === f.id ? 'bold' : 'normal' }}>{f.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeModal === 'music' && (
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                    <input 
                                        type="text" 
                                        value={musicQuery} 
                                        onChange={e => setMusicQuery(e.target.value)}
                                        placeholder="Buscar en iTunes..."
                                        style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none' }}
                                    />
                                    <button onClick={searchMusic} style={{ backgroundColor: '#8E2DE2', color: 'white', border: 'none', borderRadius: '12px', padding: '0 16px', cursor: 'pointer' }}><Search size={20}/></button>
                                </div>
                                <div style={{ flex: 1, overflowY: 'auto' }}>
                                    {musicResults.map((m: any) => (
                                        <div key={m.id} onClick={() => setSelectedMusic(m)} style={{ display: 'flex', alignItems: 'center', padding: '12px', backgroundColor: selectedMusic?.id === m.id ? 'rgba(142,45,226,0.2)' : 'transparent', borderRadius: '12px', cursor: 'pointer', marginBottom: '4px' }}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={m.artwork} alt="" style={{ width: '48px', height: '48px', borderRadius: '8px', marginRight: '16px' }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ color: 'white', fontWeight: 'bold', fontSize: '15px', marginBottom: '2px' }}>{m.title}</div>
                                                <div style={{ color: '#aaa', fontSize: '13px' }}>{m.artist}</div>
                                            </div>
                                            {selectedMusic?.id === m.id && <MusicIcon color="#8E2DE2" size={20} />}
                                        </div>
                                    ))}
                                </div>
                                {selectedMusic && (
                                    <div style={{ marginTop: '15px' }}>
                                        <div style={{ color: 'white', fontSize: '13px', marginBottom: '10px' }}>Volumen de la música: {Math.round(musicVolume * 100)}%</div>
                                        <input
                                            type="range"
                                            min="0" max="1" step="0.05"
                                            value={musicVolume}
                                            onChange={e => setMusicVolume(parseFloat(e.target.value))}
                                            style={{ width: '100%', marginBottom: '15px' }}
                                        />
                                        <button onClick={() => setSelectedMusic(null)} style={{ width: '100%', padding: '14px', backgroundColor: 'rgba(255,59,48,0.1)', color: '#FF3B30', border: '1px solid rgba(255,59,48,0.3)', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                                            Quitar Música
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeModal === 'trim' && (
                            <div style={{ padding: '30px 0 30px', display: 'flex', flexDirection: 'column' }}>
                                {isExtracting ? (
                                    <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
                                        Cargando fotogramas...
                                    </div>
                                ) : (
                                    <div ref={trackRef} style={{ position: 'relative', width: '100%', height: '50px', backgroundColor: '#333', borderRadius: '8px' }}>
                                        
                                        {/* Filmstrip Background */}
                                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', overflow: 'hidden', borderRadius: '8px' }}>
                                            {thumbnails.map((src, i) => (
                                                <img key={i} src={src} style={{ height: '100%', flex: 1, objectFit: 'cover' }} alt="" />
                                            ))}
                                        </div>
                                        
                                        {/* Dark overlay for unselected regions */}
                                        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${trimRange[0]}%`, backgroundColor: 'rgba(0,0,0,0.6)', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }} />
                                        <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: `${100 - trimRange[1]}%`, backgroundColor: 'rgba(0,0,0,0.6)', borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }} />
                                        
                                        {/* Highlighted border for selected region */}
                                        <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${trimRange[0]}%`, right: `${100 - trimRange[1]}%`, borderTop: '3px solid #8E2DE2', borderBottom: '3px solid #8E2DE2' }} />
                                        
                                        {/* Start Handle */}
                                        <div 
                                            onPointerDown={(e) => handlePointerDown(e, 'start')}
                                            onPointerMove={handlePointerMove}
                                            onPointerUp={handlePointerUp}
                                            onPointerCancel={handlePointerUp}
                                            style={{ position: 'absolute', top: 0, bottom: 0, left: `${trimRange[0]}%`, width: '20px', backgroundColor: '#8E2DE2', transform: 'translateX(-50%)', cursor: 'ew-resize', borderRadius: '6px', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', touchAction: 'none' }}
                                        >
                                            <div style={{ width: '2px', height: '16px', backgroundColor: 'white', borderRadius: '1px' }} />
                                            {isDragging === 'start' && (
                                                <div style={{ position: 'absolute', top: '-35px', backgroundColor: 'rgba(142,45,226,0.9)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                                                    {((trimRange[0] / 100) * videoDuration).toFixed(1)}s
                                                </div>
                                            )}
                                        </div>

                                        {/* End Handle */}
                                        <div 
                                            onPointerDown={(e) => handlePointerDown(e, 'end')}
                                            onPointerMove={handlePointerMove}
                                            onPointerUp={handlePointerUp}
                                            onPointerCancel={handlePointerUp}
                                            style={{ position: 'absolute', top: 0, bottom: 0, right: `${100 - trimRange[1]}%`, width: '20px', backgroundColor: '#8E2DE2', transform: 'translateX(50%)', cursor: 'ew-resize', borderRadius: '6px', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', touchAction: 'none' }}
                                        >
                                            <div style={{ width: '2px', height: '16px', backgroundColor: 'white', borderRadius: '1px' }} />
                                            {isDragging === 'end' && (
                                                <div style={{ position: 'absolute', top: '-35px', backgroundColor: 'rgba(142,45,226,0.9)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                                                    {((trimRange[1] / 100) * videoDuration).toFixed(1)}s
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                <div style={{ color: '#888', fontSize: '13px', marginTop: '20px', textAlign: 'center' }}>
                                    Arrastra los extremos para ajustar la duración.
                                </div>
                                <button 
                                    onClick={() => setActiveModal(null)}
                                    style={{ marginTop: '25px', width: '100%', padding: '14px', backgroundColor: '#8E2DE2', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                    Aceptar Recorte
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            )}
        </div>
    );
};

