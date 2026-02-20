'use client';

import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import StripeWrapper from '@/components/checkout/StripeWrapper';
import UnifiedCheckoutForm from '@/components/checkout/UnifiedCheckoutForm';
import { useAuth } from '@/context/AuthContext';

export default function CheckoutPage() {
    const { items, total, clearCart } = useCart();
    const { user, updateUser } = useAuth();
    const router = useRouter();
    const [clientSecret, setClientSecret] = useState('');
    const [pointsToUse, setPointsToUse] = useState(0);

    const shippingCost = 4.95;
    const discount = pointsToUse / 1000; // 1000 ROBcoins = 1 Euro
    const finalTotal = Math.max(0, total + shippingCost - discount);

    useEffect(() => {
        if (items.length > 0) {
            // Initialize Payment Intent immediately
            fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items }),
            })
                .then((res) => res.json())
                .then((data) => setClientSecret(data.clientSecret))
                .catch((err) => console.error('Error creating payment intent:', err));
        } else {
            router.push('/cart');
        }
    }, [items, router]);

    if (items.length === 0) {
        return null;
    }

    const handleRedeemPoints = () => {
        if (!user || !user.points) return;
        // Logic: Use max points up to total value (1000 Coins = 1 Euro)
        const subtotalWithShipping = total + shippingCost;
        const maxPointsNeeded = Math.ceil(subtotalWithShipping * 1000); // 1000 points per Euro
        const pointsAvailable = user.points;

        let pointsRedeemed = pointsAvailable;
        if (pointsAvailable > maxPointsNeeded) {
            pointsRedeemed = maxPointsNeeded;
        }

        if (pointsToUse > 0) {
            setPointsToUse(0); // Toggle off
        } else {
            setPointsToUse(pointsRedeemed);
        }
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px' }}>
            <h1 style={{ marginBottom: '30px' }}>Finalizar Compra</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                {/* Left Column: Unified Form */}
                <div>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        {clientSecret ? (
                            <StripeWrapper clientSecret={clientSecret}>
                                <UnifiedCheckoutForm total={finalTotal} clientSecret={clientSecret} />
                            </StripeWrapper>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px' }}>Cargando formulario de pago...</div>
                        )}
                    </div>
                </div>

                {/* Right Column: Summary */}
                <div>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', position: 'sticky', top: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <h2 style={{ marginBottom: '20px' }}>Resumen del Pedido</h2>
                        <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px', paddingRight: '5px' }}>
                            {items.map(item => (
                                <div key={item.id} style={{ display: 'flex', gap: '10px', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                                    <div style={{ width: '60px', height: '60px', background: '#f9f9f9', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={item.images[0]} alt={item.title} style={{ maxWidth: '100%', maxHeight: '100%' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '5px' }}>{item.title}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#666' }}>Cant: {item.quantity}</div>
                                    </div>
                                    <div style={{ fontWeight: 'bold' }}>
                                        €{((item.isOnSale && item.salePrice ? item.salePrice : item.price) * item.quantity).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ borderTop: '2px solid #eee', paddingTop: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span>Subtotal</span>
                                <span>€{total.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span>Envío (Correos)</span>
                                <span>€{shippingCost.toFixed(2)}</span>
                            </div>

                            {/* ROBcoin Redemption - Desactivado temporalmente con Zona Arcade */}
                            {/* 
                            {user && user.points && user.points > 0 && (
                                <div style={{ marginBottom: '15px', padding: '10px', background: '#f8f9fa', borderRadius: '4px', border: '1px solid #ddd' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                        <span style={{ fontSize: '0.9rem' }}>Tienes {user.points} ROBcoins</span>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Valor: €{(user.points / 1000).toFixed(2)}</span>
                                    </div>
                                    <button
                                        onClick={handleRedeemPoints}
                                        style={{
                                            width: '100%',
                                            padding: '5px',
                                            background: pointsToUse > 0 ? '#ef4444' : '#22c55e',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {pointsToUse > 0 ? 'Quitar Descuento' : 'Canjear Puntos'}
                                    </button>
                                </div>
                            )}
                            */}

                            {pointsToUse > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#4caf50' }}>
                                    <span>Descuento (Puntos)</span>
                                    <span>-€{discount.toFixed(2)}</span>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.3rem', fontWeight: 'bold', marginTop: '15px', color: 'var(--cex-red)' }}>
                                <span>Total</span>
                                <span>€{finalTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
