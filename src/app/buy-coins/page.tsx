"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';

const COIN_PACKS = [
    { id: 'p2', name: 'Pack 2', coins: 10, price: 12.10, image: null },
    { id: 'p3', name: 'Pack 3', coins: 20, price: 24.20, image: null },
    { id: 'p4', name: 'Pack 4', coins: 50, price: 60.50, image: null },
    { id: 'ps', name: 'Super Pack Especial', coins: 100, price: 121.00, image: null, isSuper: true },
    { id: 'pVIP', name: 'VIP Ultra Pack', coins: 500, price: 605.00, image: null, isSuper: true },
];

function BuyCoinsContent() {
    const searchParams = useSearchParams();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isBuyingPack, setIsBuyingPack] = useState(false);
    
    // Stripe states
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [stripePromise, setStripePromise] = useState<any>(null);
    const [showStripeCheckout, setShowStripeCheckout] = useState(false);

    useEffect(() => {
        const token = searchParams.get('token');
        const uid = searchParams.get('uid');
        const success = searchParams.get('success');

        if (success === 'true') {
            // El usuario ya pagó exitosamente y Stripe lo redirigió aquí.
            // Opcionalmente podemos recargar su saldo aquí si queremos.
        }

        // Auto-login lógico:
        if (uid || token) {
            // Simulación de auto-login leyendo de la base de datos con ese UID o Token.
            // Para producción, se debe validar el token contra Firebase.
            const userId = uid || token;
            if (userId) {
                fetch(`/api/voz/users/profile?id=${encodeURIComponent(userId)}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            setUser(data.user);
                            localStorage.setItem('user', JSON.stringify(data.user));
                        }
                        setLoading(false);
                    })
                    .catch(() => {
                        // Fallback a localStorage si falla
                        checkLocalStorage();
                    });
                return;
            }
        } else {
            checkLocalStorage();
        }
    }, [searchParams]);

    const checkLocalStorage = () => {
        const stored = localStorage.getItem('user');
        if (stored) {
            setUser(JSON.parse(stored));
        }
        setLoading(false);
    };

    const handleBuyPack = async (pack: any) => {
        if (!user) {
            alert('Por favor inicia sesión para comprar monedas.');
            return;
        }
        setIsBuyingPack(true);
        try {
            const res = await fetch('/api/stripe/create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    packId: pack.id,
                    userId: user.id,
                    userHandle: user.handle || user.name,
                    redirectUrl: window.location.origin + '/buy-coins'
                })
            });
            const data = await res.json();
            if (data.clientSecret && data.publishableKey) {
                setStripePromise(loadStripe(data.publishableKey));
                setClientSecret(data.clientSecret);
                setShowStripeCheckout(true);
            } else if (data.clientSecret) {
                setStripePromise(loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''));
                setClientSecret(data.clientSecret);
                setShowStripeCheckout(true);
            } else if (data.url) {
                window.location.href = data.url;
            } else {
                alert(data.error || 'Error al iniciar la compra.');
            }
        } catch (e) {
            alert('Error de conexión.');
        } finally {
            setIsBuyingPack(false);
        }
    };

    const returnToApp = () => {
        // Deep link back to the app (custom scheme, e.g. vozapp://wallet o intent://)
        // También podemos usar window.close() si es un webview
        window.location.href = 'vozapp://wallet';
        
        // Timeout en caso de que no tengan la app o no funcione el deep link
        setTimeout(() => {
            alert('Puedes cerrar esta ventana para volver a la app.');
        }, 1500);
    };

    if (loading) {
        return <div style={{ backgroundColor: '#000', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>Cargando...</div>;
    }

    const isSuccess = searchParams.get('success') === 'true';

    return (
        <div style={{ backgroundColor: '#000', color: 'white', minHeight: '100vh', width: '100vw', padding: '20px', display: 'flex', flexDirection: 'column' }}>
            {/* Header Tipo App */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <button onClick={returnToApp} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>✕</button>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Tienda de Monedas</h2>
                <div style={{ width: '24px' }}></div> {/* Spacer */}
            </div>

            {isSuccess ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ fontSize: '80px', marginBottom: '20px' }}>🎉</div>
                    <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '15px' }}>¡Compra Exitosa!</h3>
                    <p style={{ color: 'gray', marginBottom: '30px', padding: '0 20px' }}>Tus monedas han sido añadidas a tu cuenta. Ya puedes cerrar esta pantalla.</p>
                    <button onClick={returnToApp} style={{ backgroundColor: '#8E2DE2', color: 'white', border: 'none', padding: '15px 30px', borderRadius: '25px', fontSize: '18px', fontWeight: 'bold', width: '100%', maxWidth: '300px' }}>
                        Volver a la App
                    </button>
                </div>
            ) : (
                <>
                    {/* User Balance Card */}
                    <div style={{ backgroundColor: '#111', borderRadius: '15px', padding: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #222' }}>
                        <div>
                            <div style={{ color: '#888', fontSize: '14px', marginBottom: '5px' }}>Tu saldo actual</div>
                            <div style={{ color: '#FFD700', fontSize: '28px', fontWeight: 'bold' }}>{Number(user?.walletBalance || user?.wallet_balance || 0).toFixed(2)} 🪙</div>
                        </div>
                    </div>

                    {/* Tienda */}
                    <h3 style={{ fontSize: '16px', color: '#888', textTransform: 'uppercase', marginBottom: '15px' }}>Paquetes de Monedas</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {COIN_PACKS.map(pack => (
                            <div key={pack.id} style={{ 
                                backgroundColor: pack.isSuper ? 'rgba(142, 45, 226, 0.1)' : '#111', 
                                border: pack.isSuper ? '1px solid #8E2DE2' : '1px solid #222',
                                borderRadius: '15px', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: pack.isSuper ? '#8E2DE2' : '#222', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: '15px', fontSize: '20px' }}>
                                        {pack.isSuper ? '💎' : '🪙'}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '16px', color: 'white' }}>{pack.name}</div>
                                        <div style={{ color: '#FFD700', fontWeight: 'bold', fontSize: '14px', marginTop: '2px' }}>{pack.coins} Monedas</div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleBuyPack(pack)} 
                                    disabled={isBuyingPack}
                                    style={{ 
                                        backgroundColor: pack.isSuper ? '#8E2DE2' : '#333', 
                                        color: 'white', border: 'none', padding: '10px 15px', borderRadius: '10px', fontWeight: 'bold', cursor: isBuyingPack ? 'default' : 'pointer',
                                        opacity: isBuyingPack ? 0.6 : 1
                                    }}
                                >
                                    {pack.price.toFixed(2)} €
                                </button>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Sub-modal Stripe Checkout */}
            {showStripeCheckout && clientSecret && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 11000,
                    display: 'flex', flexDirection: 'column', alignItems: 'center'
                }}>
                    <div style={{ width: '100%', maxWidth: '500px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderBottom: '1px solid #222' }}>
                        <h3 style={{ color: 'white', margin: 0, fontSize: '16px' }}>Pago Seguro</h3>
                        <button onClick={() => { setShowStripeCheckout(false); setClientSecret(null); }} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                    </div>
                    <div style={{ width: '100%', maxWidth: '500px', flex: 1, overflowY: 'auto', padding: '15px' }}>
                        <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
                            <EmbeddedCheckout />
                        </EmbeddedCheckoutProvider>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function BuyCoinsPage() {
    return (
        <Suspense fallback={<div style={{ backgroundColor: '#000', height: '100vh', width: '100vw' }}></div>}>
            <BuyCoinsContent />
        </Suspense>
    );
}
