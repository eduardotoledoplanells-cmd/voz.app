
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
    try {
        const { items, shipping } = await request.json();

        // Calculate total on server to prevent manipulation
        // In a real app, fetch prices from DB. Here we trust the client for simplicity but validate structure.
        // Ideally: const total = await calculateOrderAmount(items);

        // For this demo, we'll sum up the items passed (assuming they are correct)
        // BUT for security, we should really fetch from DB. 
        // Let's do a quick calculation based on the passed items for now, 
        // acknowledging this is a simplified implementation.

        const calculateOrderAmount = (items: any[]) => {
            const subtotal = items.reduce((acc: number, item: any) => {
                const price = item.isOnSale && item.salePrice ? item.salePrice : item.price;
                return acc + (price * item.quantity);
            }, 0);
            const shippingCost = 4.95;
            return Math.round((subtotal + shippingCost) * 100); // Amount in cents
        };

        const totalAmount = calculateOrderAmount(items);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: totalAmount,
            currency: 'eur',
            payment_method_types: ['card'],
            ...(shipping && {
                shipping: {
                    name: `${shipping.firstName} ${shipping.lastName}`,
                    address: {
                        line1: shipping.address,
                        city: shipping.city,
                        postal_code: shipping.postalCode,
                        country: 'ES',
                    },
                },
                metadata: {
                    customer_email: shipping.email,
                }
            })
        });

        return NextResponse.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
        console.error('Stripe error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
