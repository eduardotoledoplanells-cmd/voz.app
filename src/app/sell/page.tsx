'use client';

import { useSellCart } from '@/context/SellContext';
import Link from 'next/link';
import styles from './sell.module.css';
import { useState } from 'react';

import CustomOfferForm from '@/components/sell/CustomOfferForm';

export default function SellPage() {
    const { sellItems, removeFromSellCart, totalSellPrice, clearSellCart } = useSellCart();
    const [showPolicy, setShowPolicy] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const shippingCost = 5;
    const finalTotal = totalSellPrice + shippingCost;

    if (sellItems.length === 0) {
        return (
            <div className={styles.emptyCart}>
                <h1>Tu cesta de venta está vacía</h1>
                <p>¿Tienes cosas que ya no usas? ¡Véndenoslas!</p>
                <Link href="/" className="btn btn-primary" style={{ marginBottom: '2rem' }}>
                    Empezar a vender
                </Link>

                <div style={{ borderTop: '2px solid #e0e0e0', paddingTop: '2rem', marginTop: '2rem' }}>
                    <CustomOfferForm />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.sellPage}>
            <h1>Tu Cesta de Venta</h1>

            <div className={styles.cartGrid}>
                <div className={styles.itemsList}>
                    {sellItems.map((item) => (
                        <div key={item.id} className={styles.cartItem}>
                            <div className={styles.itemImage}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={item.images[0]} alt={item.title} />
                            </div>
                            <div className={styles.itemDetails}>
                                <h3>{item.title}</h3>
                                <p className={styles.category}>{item.category}</p>
                                {item.grade && <span className={styles.grade}>Grado {item.grade}</span>}
                            </div>
                            <div className={styles.itemPrice}>
                                <span className={styles.priceLabel}>Te pagamos:</span>
                                <span className={styles.price}>€{item.buyPrice}</span>
                            </div>
                            <button
                                onClick={() => removeFromSellCart(item.id)}
                                className={styles.removeButton}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>

                <div className={styles.summary}>
                    <h2>Resumen de Venta</h2>
                    <div className={styles.summaryRow}>
                        <span>Total artículos:</span>
                        <span>{sellItems.length}</span>
                    </div>
                    <div className={styles.summaryRow}>
                        <span>Subtotal:</span>
                        <span>€{totalSellPrice}</span>
                    </div>
                    <div className={styles.summaryRow}>
                        <span>Envío (Reembolsable):</span>
                        <span>€{shippingCost}</span>
                    </div>
                    <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                        <span>Total a recibir:</span>
                        <span className={styles.totalPrice}>€{finalTotal}</span>
                    </div>

                    <div style={{ margin: '20px 0', padding: '15px', background: '#fff', border: '1px solid #ddd', borderRadius: '4px' }}>
                        <button
                            onClick={() => setShowPolicy(!showPolicy)}
                            style={{ background: 'none', border: 'none', color: '#0070f3', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: '0.9rem', marginBottom: '10px' }}
                        >
                            Ver Política de Ventas
                        </button>

                        {showPolicy && (
                            <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '15px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
                                <p style={{ margin: '0 0 10px 0' }}>
                                    <strong>Envío:</strong> El importe de envío (5€) que pagas ahora se sumará al total y se te devolverá íntegramente una vez recibamos el paquete en nuestras instalaciones.
                                </p>
                                <p style={{ margin: '0 0 10px 0' }}>
                                    <strong>Estado:</strong> Si los artículos no están en las condiciones descritas o faltan partes, el valor de la compra podrá ser devaluado según nuestro criterio.
                                </p>
                                <p style={{ margin: 0 }}>
                                    <strong>Devoluciones:</strong> Si hay artículos que no queremos por su mal estado, estos serán devueltos y el cliente pagará el envío de devolución.
                                </p>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginTop: '10px' }}>
                            <input
                                type="checkbox"
                                id="terms"
                                checked={termsAccepted}
                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                style={{ marginTop: '3px' }}
                            />
                            <label htmlFor="terms" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
                                He leído y acepto la política de ventas y las condiciones de envío.
                            </label>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        {termsAccepted ? (
                            <Link href="/sell/checkout" className={`btn btn-primary ${styles.checkoutButton}`}>
                                Finalizar Venta
                            </Link>
                        ) : (
                            <button disabled className={`btn btn-primary ${styles.checkoutButton}`} style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                                Finalizar Venta
                            </button>
                        )}
                        <Link href="/" className={`btn btn-outline ${styles.continueButton}`}>
                            Seguir Vendiendo
                        </Link>
                        <button onClick={clearSellCart} className={styles.clearButton}>
                            Vaciar cesta
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
