'use client';

import { useSellCart } from '@/context/SellContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../sell.module.css';

export default function SellCheckoutPage() {
    const { sellItems, totalSellPrice, clearSellCart } = useSellCart();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const shippingCost = 5;
    const finalTotal = totalSellPrice + shippingCost;

    if (sellItems.length === 0) {
        router.push('/sell');
        return null;
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);

        const orderData = {
            id: Date.now().toString(),
            orderNumber: `ORD-${Date.now()}`,
            date: new Date().toISOString(),
            customerName: `${formData.get('firstName')} ${formData.get('lastName')}`,
            customerEmail: formData.get('email'),
            shippingAddress: {
                address: formData.get('address'),
                city: formData.get('city'),
                postalCode: formData.get('postalCode'),
                phone: '' // Add phone field if needed
            },
            items: sellItems.map(item => ({
                productId: item.id,
                title: item.title,
                quantity: 1, // Sell items are unique usually
                price: item.buyPrice
            })),
            subtotal: totalSellPrice,
            shippingCost: shippingCost,
            shippingCompany: 'Correos',
            total: finalTotal,
            paymentMethod: 'Bank Transfer',
            status: 'pending'
        };

        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Error al procesar el pedido');
            }

            alert('¡Venta confirmada! Te hemos enviado un email con la etiqueta de envío.');
            clearSellCart();
            router.push('/');
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.sellPage}>
            <h1>Finalizar Venta</h1>

            <div className={styles.cartGrid}>
                <div className={styles.formSection}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
                            <h2 style={{ marginTop: 0 }}>Tus datos para el pago</h2>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nombre</label>
                                    <input name="firstName" required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Apellidos</label>
                                    <input name="lastName" required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
                                </div>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email</label>
                                <input name="email" type="email" required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Dirección de Recogida</label>
                                <input name="address" required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Ciudad</label>
                                    <input name="city" required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Código Postal</label>
                                    <input name="postalCode" required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
                                </div>
                            </div>

                            <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                                <h3 style={{ marginTop: 0 }}>Método de Cobro</h3>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>IBAN</label>
                                    <input name="iban" required placeholder="ES00 0000 0000 0000 0000 0000 0000" style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className={`btn btn-primary ${styles.checkoutButton}`}
                            disabled={loading}
                        >
                            {loading ? 'Procesando...' : 'Confirmar Venta'}
                        </button>
                    </form>
                </div>

                <div className={styles.summary}>
                    <h2>Resumen</h2>
                    <div className={styles.itemsList} style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
                        {sellItems.map((item) => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '10px' }}>
                                <span style={{ flex: 1, paddingRight: '10px' }}>{item.title}</span>
                                <span style={{ fontWeight: 'bold' }}>€{item.buyPrice}</span>
                            </div>
                        ))}
                    </div>
                    <div className={styles.summaryRow} style={{ borderTop: '1px solid #ddd', paddingTop: '15px' }}>
                        <span>Subtotal:</span>
                        <span>€{totalSellPrice}</span>
                    </div>
                    <div className={styles.summaryRow}>
                        <span>Envío (Reembolsable):</span>
                        <span>€{shippingCost}</span>
                    </div>
                    <div className={styles.summaryRow} style={{ fontWeight: 'bold', fontSize: '1.2rem', marginTop: '10px' }}>
                        <span>Total a recibir:</span>
                        <span className={styles.totalPrice}>€{finalTotal}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
