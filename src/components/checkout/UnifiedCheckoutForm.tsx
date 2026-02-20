'use client';

import { CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useState, useEffect } from 'react';
import styles from './CheckoutForm.module.css';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import provincesData from '@/data/provinces.json';
import municipalitiesData from '@/data/municipalities.json';

export default function UnifiedCheckoutForm({ total, clientSecret }: { total: number, clientSecret: string }) {
    const stripe = useStripe();
    const elements = useElements();
    const { user } = useAuth();
    const { items, clearCart } = useCart();

    const [message, setMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // State for location selection
    const [selectedProvince, setSelectedProvince] = useState('');
    const [availableMunicipalities, setAvailableMunicipalities] = useState<typeof municipalitiesData>([]);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        address: '',
        city: '',
        postalCode: '',
        phone: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.name.split(' ')[0] || '',
                lastName: user.name.split(' ').slice(1).join(' ') || '',
                email: user.email || '',
                address: user.address?.street || '',
                city: user.address?.city || '',
                postalCode: user.address?.postalCode || '',
                phone: user.address?.phone || ''
            });
        }
    }, [user]);

    // Handle province change
    const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const provinceId = e.target.value;
        setSelectedProvince(provinceId);

        if (provinceId) {
            const filtered = municipalitiesData.filter(m => m.p === provinceId);
            setAvailableMunicipalities(filtered);
            setFormData(prev => ({ ...prev, city: '' })); // Reset city when province changes
        } else {
            setAvailableMunicipalities([]);
            setFormData(prev => ({ ...prev, city: '' }));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsLoading(true);

        // 1. Create Order in DB FIRST
        const now = new Date();
        const timestamp = Date.now();
        const orderCounter = String(timestamp).slice(-3);
        const newOrderId = timestamp.toString();
        const shippingCost = 4.95;

        // Get province name for the order record if needed, but we stand with city
        const provinceObj = provincesData.find(p => p.provincia_id === selectedProvince);

        const order = {
            id: newOrderId,
            orderNumber: `ORD-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${orderCounter}`,
            date: now.toISOString(),
            customerName: `${formData.firstName} ${formData.lastName}`,
            customerEmail: formData.email,
            shippingAddress: {
                address: formData.address, // We could append province here if needed
                city: formData.city, // Now contains municipality name
                postalCode: formData.postalCode,
                phone: formData.phone
            },
            items: items.map(item => ({
                productId: item.id,
                title: item.title,
                quantity: item.quantity,
                price: item.isOnSale && item.salePrice ? item.salePrice : item.price
            })),
            subtotal: total - shippingCost,
            shippingCost: shippingCost,
            shippingCompany: 'Correos',
            total: total,
            paymentMethod: 'Stripe',
            status: 'pending_payment'
        };

        try {
            // Create order first
            await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(order)
            });

            // 2. Update the payment intent with order ID (using the existing clientSecret)
            // Note: We can't update metadata after creation, so we'll use confirmCardPayment
            // and the webhook will use the order_id from the initial payment intent

            const cardElement = elements.getElement(CardNumberElement);
            if (!cardElement) {
                setIsLoading(false);
                return;
            }

            const { error } = await stripe.confirmCardPayment(
                clientSecret,
                {
                    payment_method: {
                        card: cardElement,
                        billing_details: {
                            name: `${formData.firstName} ${formData.lastName}`,
                            email: formData.email,
                            address: {
                                line1: formData.address,
                                city: formData.city,
                                postal_code: formData.postalCode,
                                state: provinceObj ? provinceObj.nombre : undefined, // Include state/province
                                country: 'ES',
                            },
                            phone: formData.phone
                        },
                    },
                }
            );

            if (error) {
                if (error.type === "card_error" || error.type === "validation_error") {
                    setMessage(error.message || "Ocurrió un error inesperado");
                } else {
                    setMessage("Ocurrió un error inesperado.");
                }
            } else {
                // Success
                clearCart();
                window.location.href = `/checkout/success?payment_intent=${order.id}&redirect_status=succeeded`;
            }
        } catch (err) {
            console.error('Error processing order:', err);
            setMessage('Error al procesar el pedido. Por favor inténtalo de nuevo.');
        }

        setIsLoading(false);
    };

    const inputStyle = {
        style: {
            base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                    color: '#aab7c4',
                },
                padding: '10px',
            },
            invalid: {
                color: '#9e2146',
            },
        },
    };

    return (
        <form id="payment-form" onSubmit={handleSubmit} className={styles.form}>
            <h2 style={{ marginBottom: '20px' }}>1. Información de Envío</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nombre</label>
                    <input name="firstName" required value={formData.firstName} onChange={handleChange} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Apellidos</label>
                    <input name="lastName" required value={formData.lastName} onChange={handleChange} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
                </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email</label>
                <input name="email" type="email" required value={formData.email} onChange={handleChange} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
            </div>

            <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Dirección</label>
                <input name="address" required value={formData.address} onChange={handleChange} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Provincia</label>
                    <select
                        name="province"
                        required
                        value={selectedProvince}
                        onChange={handleProvinceChange}
                        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', background: 'white' }}
                    >
                        <option value="">Selecciona Provincia</option>
                        {provincesData.map(province => (
                            <option key={province.provincia_id} value={province.provincia_id}>
                                {province.nombre}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Municipio</label>
                    <select
                        name="city"
                        required
                        value={formData.city}
                        onChange={handleChange}
                        disabled={!selectedProvince}
                        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', background: 'white', opacity: !selectedProvince ? 0.7 : 1 }}
                    >
                        <option value="">Selecciona Municipio</option>
                        {availableMunicipalities.map(municipality => (
                            <option key={municipality.id} value={municipality.n}>
                                {municipality.n}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Código Postal</label>
                    <input name="postalCode" required value={formData.postalCode} onChange={handleChange} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
                </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Teléfono</label>
                <input name="phone" type="tel" required value={formData.phone} onChange={handleChange} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
            </div>

            <h2 style={{ marginBottom: '20px' }}>2. Pago Seguro</h2>

            <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Número de Tarjeta</label>
                <div style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px', background: 'white' }}>
                    <CardNumberElement options={inputStyle} />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Fecha de Caducidad</label>
                    <div style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px', background: 'white' }}>
                        <CardExpiryElement options={inputStyle} />
                    </div>
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>CVC</label>
                    <div style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px', background: 'white' }}>
                        <CardCvcElement options={inputStyle} />
                    </div>
                </div>
            </div>

            <button disabled={isLoading || !stripe || !elements} id="submit" className={styles.button} style={{ marginTop: '30px' }}>
                <span id="button-text">
                    {isLoading ? <div className={styles.spinner} id="spinner"></div> : `Pagar €${total.toFixed(2)}`}
                </span>
            </button>
            {message && <div id="payment-message" className={styles.message}>{message}</div>}
        </form>
    );
}
