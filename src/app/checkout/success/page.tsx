'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

export default function CheckoutSuccessPage() {
    const { clearCart } = useCart();
    const searchParams = useSearchParams();
    const paymentIntent = searchParams.get('payment_intent');
    const redirectStatus = searchParams.get('redirect_status');
    const hasCleared = useRef(false);

    useEffect(() => {
        if (redirectStatus === 'succeeded' && !hasCleared.current) {
            hasCleared.current = true;
            clearCart();
            // Here we could also update the order status in the DB if we had the order ID
            // But for now, we rely on the initial creation as 'pending_payment' 
            // and assume success if they reach here with valid params.
            // A robust solution would use webhooks.
        }
    }, [redirectStatus, clearCart]);

    return (
        <div style={{ maxWidth: '800px', margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
            <div style={{ background: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>✅</div>
                <h1 style={{ color: '#4CAF50', marginBottom: '20px' }}>¡Pago Realizado con Éxito!</h1>
                <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '30px' }}>
                    Gracias por tu compra. Hemos recibido tu pedido correctamente.
                </p>

                {paymentIntent && (
                    <p style={{ fontSize: '0.9rem', color: '#999', marginBottom: '30px' }}>
                        ID de transacción: {paymentIntent}
                    </p>
                )}

                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                    <Link href="/" className="btn btn-primary">
                        Volver a la Tienda
                    </Link>
                    <Link href="/profile" className="btn btn-outline">
                        Ver mis Pedidos
                    </Link>
                </div>
            </div>
        </div>
    );
}
