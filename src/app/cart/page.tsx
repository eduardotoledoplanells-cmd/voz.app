'use client';

import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CartPage() {
    const { items, removeFromCart, updateQuantity, total, clearCart } = useCart();
    const router = useRouter();

    if (items.length === 0) {
        return (
            <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px', textAlign: 'center' }}>
                <h1 style={{ marginBottom: '20px' }}>Tu Cesta está Vacía</h1>
                <p style={{ marginBottom: '30px', color: '#666' }}>No has añadido ningún producto todavía.</p>
                <Link href="/" style={{ padding: '12px 30px', background: 'var(--cex-red)', color: 'white', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold' }}>
                    Ir a la Tienda
                </Link>
            </div>
        );
    }

    const shippingCost = 4.95; // Default Correos rate
    const finalTotal = total + shippingCost;

    return (
        <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
            <h1 style={{ marginBottom: '30px' }}>Mi Cesta</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
                {/* Cart Items */}
                <div>
                    {items.map(item => {
                        const itemPrice = item.isOnSale && item.salePrice ? item.salePrice : item.price;

                        return (
                            <div key={item.id} style={{ display: 'flex', gap: '20px', padding: '20px', background: 'white', borderRadius: '8px', marginBottom: '15px' }}>
                                {/* Image */}
                                <div style={{ width: '100px', height: '100px', flexShrink: 0 }}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={item.images[0]}
                                        alt={item.title}
                                        style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }}
                                    />
                                </div>

                                {/* Details */}
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ marginBottom: '10px' }}>
                                        <Link href={`/product/${item.id}`} style={{ color: '#333', textDecoration: 'none' }}>
                                            {item.title}
                                        </Link>
                                    </h3>
                                    <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '10px' }}>
                                        {item.category} {item.grade && `• Grado ${item.grade}`}
                                    </p>

                                    {item.isOnSale && item.salePrice && (
                                        <div style={{ marginBottom: '10px' }}>
                                            <span style={{ textDecoration: 'line-through', color: '#999', marginRight: '10px' }}>€{item.price}</span>
                                            <span style={{ color: '#e60000', fontWeight: 'bold' }}>€{item.salePrice}</span>
                                            <span style={{ marginLeft: '10px', background: '#e60000', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                                                OFERTA
                                            </span>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                style={{ width: '30px', height: '30px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', borderRadius: '4px' }}
                                            >
                                                -
                                            </button>
                                            <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                style={{ width: '30px', height: '30px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', borderRadius: '4px' }}
                                            >
                                                +
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>

                                {/* Price */}
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--cex-red)' }}>
                                        €{(itemPrice * item.quantity).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        );
                    })}

                    <button
                        onClick={clearCart}
                        style={{ marginTop: '20px', color: '#666', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        Vaciar Cesta
                    </button>
                </div>

                {/* Summary */}
                <div>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', position: 'sticky', top: '20px' }}>
                        <h2 style={{ marginBottom: '20px' }}>Resumen del Pedido</h2>

                        <div style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span>Subtotal</span>
                                <span>€{total.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span>Envío (Correos)</span>
                                <span>€{shippingCost.toFixed(2)}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '1.3rem', fontWeight: 'bold' }}>
                            <span>Total</span>
                            <span style={{ color: 'var(--cex-red)' }}>€{finalTotal.toFixed(2)}</span>
                        </div>

                        <button
                            onClick={() => router.push('/checkout')}
                            style={{ width: '100%', padding: '15px', background: 'var(--cex-red)', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}
                        >
                            Proceder al Pago
                        </button>

                        <Link
                            href="/"
                            style={{ display: 'block', textAlign: 'center', color: 'var(--cex-red)', textDecoration: 'underline', marginTop: '15px' }}
                        >
                            Seguir Comprando
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
