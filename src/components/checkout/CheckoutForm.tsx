
'use client';

import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useState } from 'react';
import styles from './CheckoutForm.module.css';

export default function CheckoutForm({ total }: { total: number }) {
    const stripe = useStripe();
    const elements = useElements();
    const [message, setMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsLoading(true);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/checkout/success`,
            },
        });

        if (error.type === "card_error" || error.type === "validation_error") {
            setMessage(error.message || "Ocurrió un error inesperado");
        } else {
            setMessage("Ocurrió un error inesperado.");
        }

        setIsLoading(false);
    };

    return (
        <form id="payment-form" onSubmit={handleSubmit} className={styles.form}>
            <PaymentElement id="payment-element" options={{ layout: "tabs" }} />
            <button disabled={isLoading || !stripe || !elements} id="submit" className={styles.button}>
                <span id="button-text">
                    {isLoading ? <div className={styles.spinner} id="spinner"></div> : `Pagar €${total.toFixed(2)}`}
                </span>
            </button>
            {message && <div id="payment-message" className={styles.message}>{message}</div>}
        </form>
    );
}
