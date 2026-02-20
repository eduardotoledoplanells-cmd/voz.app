'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import CategorySelector from '@/components/admin/CategorySelector';
import SellerSelector from '@/components/admin/SellerSelector';
import MediaGallery from '@/components/admin/MediaGallery';
import { Product } from '@/types';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [product, setProduct] = useState<Product | null>(null);
    // Unified items state
    const [items, setItems] = useState<(string | File)[]>([]);

    const [isOnSale, setIsOnSale] = useState(false);
    const [salePrice, setSalePrice] = useState<number | undefined>();
    const [selectedSeller, setSelectedSeller] = useState<string | undefined>();
    const [generating, setGenerating] = useState(false);

    // Gallery State
    const [showGallery, setShowGallery] = useState(false);

    // DnD State
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

    useEffect(() => {
        fetch(`/api/products/${id}`)
            .then(res => {
                if (!res.ok) throw new Error('Product not found');
                return res.json();
            })
            .then(data => {
                setProduct(data);
                setItems(data.images || []);
                setIsOnSale(data.isOnSale || false);
                setSalePrice(data.salePrice);
                setSelectedSeller(data.sellerId);
            })
            .catch(() => router.push('/admin/products'));
    }, [id, router]);

    const handleNewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            const totalImages = items.length + newFiles.length;

            if (totalImages > 15) {
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
        const remainingSlots = 15 - items.length;

        if (selectedUrls.length > remainingSlots) {
            alert(`Solo puedes añadir ${remainingSlots} imágenes más.`);
            const allowed = selectedUrls.slice(0, remainingSlots);
            setItems([...items, ...allowed]);
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
                // Manually update textarea value since it is uncontrolled (defaultValue)
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
            alert('Debes tener al menos una imagen.');
            setLoading(false);
            return;
        }

        if (!selectedSeller) {
            alert('Debes seleccionar un vendedor responsable.');
            setLoading(false);
            return;
        }

        // Append all items under the same key to preserve order
        items.forEach((item) => {
            formData.append('product_images', item);
        });

        // Append Offer fields
        formData.set('isOnSale', isOnSale.toString());
        if (isOnSale && salePrice) {
            formData.set('salePrice', salePrice.toString());
        }

        if (selectedSeller) {
            formData.set('sellerId', selectedSeller);
        }

        await fetch(`/api/products/${id}`, {
            method: 'PUT',
            body: formData,
        });

        setLoading(false);
        router.push('/admin/products');
        router.refresh();
    }

    if (!product) return <div>Cargando...</div>;

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', background: 'white', padding: '30px', borderRadius: '8px' }}>
            <h1 style={{ marginBottom: '20px' }}>Editar Producto</h1>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Título</label>
                    <input name="title" defaultValue={product.title} required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Precio (€)</label>
                        <input name="price" type="number" step="0.01" defaultValue={product.price} required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Grado</label>
                        <select name="grade" defaultValue={product.grade} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
                            <option value="A">A - Como nuevo</option>
                            <option value="B">B - Buen estado</option>
                            <option value="C">C - Usado</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Precio de Compra (€)</label>
                        <input name="buyPrice" type="number" step="0.01" defaultValue={product.buyPrice} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f0fdf4', borderColor: '#86efac' }} placeholder="Opcional" />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Stock</label>
                        <input name="stock" type="number" min="0" defaultValue={product.stock || 0} required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
                    </div>
                </div>

                <div>
                    <CategorySelector initialCategoryName={product.category} />
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
                        defaultValue={product.description}
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
                            <input
                                name="salePrice"
                                type="number"
                                step="0.01"
                                value={salePrice || ''}
                                onChange={(e) => setSalePrice(Number(e.target.value))}
                                required={isOnSale}
                                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
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
                            defaultChecked={product.isFeatured}
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
                            defaultChecked={product.limitOnePerCustomer}
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
                    <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Imágenes (Mínimo 1, Máximo 15)</label>
                    <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '10px' }}>Arrastra las imágenes para ordenarlas</p>

                    {/* Unified Image List */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
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
                                        border: item instanceof File ? '2px solid #2196F3' : '2px solid #4CAF50'
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
                                    {index + 1} - {item instanceof File ? 'Nueva' : 'Existente'}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        <button
                            type="button"
                            onClick={() => {
                                // Only pass strings (existing urls) to gallery checks, or just empty?
                                // Gallery selection usually adds URLs.
                                setShowGallery(true)
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
                            🖼️ Seleccionar añadir de Galería
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
                            ⬆️ Añadir desde equipo
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleNewImageChange}
                                style={{ display: 'none' }}
                            />
                        </label>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: '#666' }}>
                        Total: {items.length} / 15 imágenes
                    </p>
                </div>

                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ marginTop: '10px' }}
                >
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </form>

            {showGallery && (
                <GalleryModal
                    onClose={() => setShowGallery(false)}
                    onConfirm={handleGallerySelect}
                />
            )}
        </div>
    );
}

function GalleryModal({ onClose, onConfirm }: { onClose: () => void, onConfirm: (urls: string[]) => void }) {
    const [selected, setSelected] = useState<string[]>([]);
    // Prevent scrolling background
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    return (
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
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
                    >
                        &times;
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', minHeight: '300px' }}>
                    <MediaGallery
                        selectionMode={true}
                        onSelect={(selection: string[]) => setSelected(selection)}
                    />
                </div>

                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            padding: '8px 16px',
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
                        onClick={() => onConfirm(selected)}
                        style={{
                            padding: '8px 16px',
                            background: '#6366f1',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Añadir Seleccionadas ({selected.length})
                    </button>
                </div>
            </div>
        </div>
    );
}
