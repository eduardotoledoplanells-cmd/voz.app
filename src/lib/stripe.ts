import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('STRIPE_SECRET_KEY is missing. Stripe cannot be initialized in production.');
    } else {
        console.warn('STRIPE_SECRET_KEY is missing. Using dummy key for development.');
    }
}

export const stripe = new Stripe(stripeSecretKey || 'sk_test_dummy', {
    apiVersion: '2025-01-27.acacia' as any, // Latest stable version
    appInfo: {
        name: 'VOZ-Server',
        version: '1.0.0',
    },
});
