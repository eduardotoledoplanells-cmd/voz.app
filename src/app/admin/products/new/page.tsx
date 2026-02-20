'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CategorySelector from '@/components/admin/CategorySelector';
import SellerSelector from '@/components/admin/SellerSelector';
import MediaGallery from '@/components/admin/MediaGallery';

export default function NewProductPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    // Unified state for items (Files or URLs)
    const [items, setItems] = useState<(File | string)[]>([]);
    const [showGallery, setShowGallery] = useState(false);
    const [isOnSale, setIsOnSale] = useState(false);
    const [selectedSeller, setSelectedSeller] = useState<string | undefined>();
    const [generating, setGenerating] = useState(false);
    const [tempSelected, setTempSelected] = useState<string[]>([]);

    // DnD State
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            if (items.length + newFiles.length > 15) {
                alert('Máximo 15 imágenes permitidas');
                return;
            }
            setItems([...items, ...newFiles]);
        }
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleGallerySelect = (selectedUrls: string[]) => {
        const maxRemote = 15 - items.length;
        if (selectedUrls.length > maxRemote) {
            alert(`Solo puedes tener ${maxRemote} imágenes más.`);
            setItems([...items, ...selectedUrls.slice(0, maxRemote)]);
        } else {
            setItems([...items, ...selectedUrls]);
        }
        setShowGallery(false);
    };

    // DnD Handlers
    const handleDragStart = (index: number) => {
        setDraggedItemIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedItemIndex === null || draggedItemIndex === index) return;

        const newItems = [...items];
        const draggedItem = newItems[draggedItemIndex];
        newItems.splice(draggedItemIndex, 1);
        newItems.splice(index, 0, draggedItem);

        setItems(newItems);
        setDraggedItemIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedItemIndex(null);
    };

    const generateDescription = async () => {
        const titleInput = document.querySelector('input[name="title"]') as HTMLInputElement;
        const title = titleInput?.value;

        if (!title) {
            alert('Por favor escribe un título primero');
            return;
        }

        setGenerating(true);
        try {
            const res = await fetch('/api/products/generate-description', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title })
            });
            const data = await res.json();

            if (data.description) {
                const textarea = document.querySelector('textarea[name="description"]') as HTMLTextAreaElement;
                if (textarea) textarea.value = data.description;
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al generar descripción');
        } finally {
            setGenerating(false);
        }
    };

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        if (items.length === 0) {
            alert('Debes añadir al menos una imagen.');
            setLoading(false);
            return;
        }

        if (!selectedSeller) {
            alert('Debes seleccionar un vendedor responsable.');
            setLoading(false);
            return;
        }

        // Append items in order with a special key convention
        items.forEach((item, index) => {
            if (item instanceof File) {
                // Prefix with 'newImage_' keeps existing backend logic for Files partialy happy, 
                // but we need to ensure order. 
                // Better strategy: Append all to 'orderedImage' and handle types in backend.
                // But native FormData doesn't support mixed types easily in one array info without parsing.
                // Strategy: 
                // 1. Files: 'file_OrderIndex' -> File
                // 2. URLs: 'url_OrderIndex' -> string
                // Backend will sort by index.
                // ACTUALLY: Let's stick to the plan: single 'orderedImage' might be tricky if keys must be unique or processed specifically.
                // EASIEST: Append them sequentially. key: 'orderedImages[]'.
                // But FormData values are either string or File.

                // Let's use specific keys that preserve order implicitly by iteration, OR explicit indices.
                // Plan: Append 'item_type[]' and 'item_value[]'? No, files need to be files.

                // Revised Plan for backend:
                // Iterate entries. If key is 'product_image', it's an item.
                formData.append('product_images', item);
            } else {
                formData.append('product_images', item);
            }
        });

        if (selectedSeller) {
            formData.set('sellerId', selectedSeller);
        }

        await fetch('/api/products', {
            method: 'POST',
            body: formData,
        });

        setLoading(false);
        router.push('/admin/products');
        router.refresh();
    }

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', background: 'white', padding: '30px', borderRadius: '8px' }}>
            <h1 style={{ marginBottom: '20px' }}>Añadir Nuevo Producto</h1>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Título</label>
                    <input name="title" required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Precio de Venta (€)</label>
                        <input name="price" type="number" step="0.01" required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Grado</label>
                        <select name="grade" style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
                            <option value="A">A - Como nuevo</option>
                            <option value="B">B - Buen estado</option>
                            <option value="C">C - Usado</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Precio de Compra (€)</label>
                        <input name="buyPrice" type="number" step="0.01" style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f0fdf4', borderColor: '#86efac' }} placeholder="Opcional" />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Stock</label>
                        <input name="stock" type="number" min="0" defaultValue="1" required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
                    </div>
                </div>

                <div>
                    <CategorySelector />
                </div>

                <div>
                    <SellerSelector
                        value={selectedSeller}
                        onChange={setSelectedSeller}
                    />
                </div>

                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                        <label style={{ display: 'block', fontWeight: 'bold' }}>Descripción</label>
                        <button
                            type="button"
                            onClick={generateDescription}
                            disabled={generating}
                            style={{
                                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                                color: 'white',
                                border: 'none',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '0.8rem',
                                cursor: generating ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                opacity: generating ? 0.7 : 1
                            }}
                        >
                            {generating ? '✨ Generando...' : '✨ Autocompletar con IA'}
                        </button>
                    </div>
                    <textarea
                        name="description"
                        rows={4}
                        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical' }}
                    />
                </div>

                {/* Offer Section */}
                <div style={{ padding: '15px', background: '#f9f9f9', borderRadius: '4px', border: '1px solid #eee' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <input
                            type="checkbox"
                            id="isOnSale"
                            checked={isOnSale}
                            onChange={(e) => setIsOnSale(e.target.checked)}
                            style={{ width: '20px', height: '20px' }}
                        />
                        <label htmlFor="isOnSale" style={{ fontWeight: 'bold', cursor: 'pointer' }}>¿Está en oferta?</label>
                    </div>

                    {isOnSale && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Precio de Oferta (€)</label>
                            <input name="salePrice" type="number" step="0.01" required={isOnSale} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
                        </div>
                    )}
                </div>

                {/* Featured Section */}
                <div style={{ padding: '15px', background: '#fff3cd', borderRadius: '4px', border: '1px solid #ffc107' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                            type="checkbox"
                            id="isFeatured"
                            name="isFeatured"
                            style={{ width: '20px', height: '20px' }}
                        />
                        <label htmlFor="isFeatured" style={{ fontWeight: 'bold', cursor: 'pointer' }}>⭐ Mostrar en Destacados</label>
                    </div>
                </div>

                {/* Stock and Limits Section */}
                <div style={{ padding: '15px', background: '#e3f2fd', borderRadius: '4px', border: '1px solid #2196F3' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                            type="checkbox"
                            id="limitOnePerCustomer"
                            name="limitOnePerCustomer"
                            style={{ width: '20px', height: '20px' }}
                        />
                        <label htmlFor="limitOnePerCustomer" style={{ fontWeight: 'bold', cursor: 'pointer' }}>
                            🛡️ Limitar a 1 unidad por cliente
                        </label>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px', marginLeft: '30px' }}>
                        Evita que un cliente compre todo el stock de este producto
                    </p>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Imágenes (Mínimo 1, Máximo 15)</label>
                    <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '10px' }}>Arrastra las imágenes para ordenarlas</p>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        <button
                            type="button"
                            onClick={() => {
                                // Filter out files, only URLs for gallery selection
                                const currentUrls = items.filter(i => typeof i === 'string') as string[];
                                setTempSelected(currentUrls);
                                setShowGallery(true);
                            }}
                            className="btn"
                            style={{
                                background: '#6366f1',
                                color: 'white',
                                padding: '8px 15px',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                            }}
                        >
                            🖼️ Seleccionar de Galería
                        </button>
                        <label
                            className="btn"
                            style={{
                                background: '#e0e7ff',
                                color: '#4338ca',
                                padding: '8px 15px',
                                border: '1px solid #c7d2fe',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                            }}
                        >
                            ⬆️ Subir desde equipo
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                                style={{ display: 'none' }}
                            />
                        </label>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {items.map((item, index) => (
                            <div
                                key={`item-${index}`}
                                draggable
                                onDragStart={() => handleDragStart(index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragEnd={handleDragEnd}
                                style={{
                                    position: 'relative',
                                    width: '100px',
                                    height: '100px',
                                    opacity: draggedItemIndex === index ? 0.5 : 1,
                                    cursor: 'move',
                                    transition: 'all 0.2s ease',
                                    transform: draggedItemIndex === index ? 'scale(1.05)' : 'scale(1)'
                                }}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={item instanceof File ? URL.createObjectURL(item) : item}
                                    alt={`Preview ${index}`}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        borderRadius: '4px',
                                        border: item instanceof File ? '2px solid #2196F3' : '2px solid #6366f1'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => removeItem(index)}
                                    style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', borderRadius: '50%', width: '20px', height: '20px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    X
                                </button>
                                <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '10px', textAlign: 'center' }}>
                                    {index + 1} - {item instanceof File ? 'Local' : 'Galería'}
                                </span>
                            </div>
                        ))}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
                        {items.length} / 15 imágenes seleccionadas
                    </p>
                </div>

                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ marginTop: '10px' }}
                >
                    {loading ? 'Guardando...' : 'Guardar Producto'}
                </button>
            </form >

            {showGallery && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        width: '90%',
                        maxWidth: '800px',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h2>Seleccionar Imágenes</h2>
                            <button
                                type="button"
                                onClick={() => setShowGallery(false)}
                                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
                            >
                                &times;
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', minHeight: '300px' }}>
                            <MediaGallery
                                selectionMode={true}
                                initialSelection={items.filter(i => typeof i === 'string') as string[]}
                                maxSelection={15 - items.length}
                                onSelect={(selection) => setTempSelected(selection)}
                            />
                        </div>

                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid #eee' }}>
                            <button
                                type="button"
                                onClick={() => setShowGallery(false)}
                                style={{
                                    padding: '10px 20px',
                                    border: '1px solid #ddd',
                                    background: 'white',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={() => handleGallerySelect(tempSelected)}
                                style={{
                                    padding: '10px 20px',
                                    background: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Confirmar Selección ({tempSelected.length})
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
