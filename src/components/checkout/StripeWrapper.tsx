
'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { ReactNode } from 'react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function StripeWrapper({ clientSecret, children }: { clientSecret: string, children: ReactNode }) {
    const options = {
        // clientSecret, // Removed to prevent Link upsell in CardElement
        locale: 'es' as const,
        appearance: {
            theme: 'stripe' as const,
        },
    };

    return (
        <Elements stripe={stripePromise} options={options}>
            {children}
        </Elements>
    );
}
