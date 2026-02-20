import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { Order } from '@/types';

const ordersFilePath = path.join(process.cwd(), 'src', 'data', 'orders.json');

// Ensure orders file exists
async function ensureOrdersFile() {
    try {
        await fs.access(ordersFilePath);
    } catch {
        const dir = path.dirname(ordersFilePath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(ordersFilePath, JSON.stringify([], null, 2));
    }
}

export async function GET() {
    try {
        await ensureOrdersFile();
        const data = await fs.readFile(ordersFilePath, 'utf-8');
        const orders: Order[] = JSON.parse(data);
        return NextResponse.json(orders);
    } catch (error) {
        console.error('Error reading orders:', error);
        return NextResponse.json([], { status: 200 });
    }
}

import { getProductById, updateProduct } from '@/lib/db';

export async function POST(request: Request) {
    try {
        await ensureOrdersFile();
        const newOrder: Order = await request.json();

        // 1. Validate Stock
        for (const item of newOrder.items) {
            const product = getProductById(item.productId);
            if (!product) {
                return NextResponse.json({ error: `Producto no encontrado: ${item.title}` }, { status: 400 });
            }
            if (product.stock < item.quantity) {
                return NextResponse.json({ error: `Stock insuficiente para: ${item.title}` }, { status: 400 });
            }
        }

        // 2. Reduce Stock
        for (const item of newOrder.items) {
            const product = getProductById(item.productId);
            if (product) {
                updateProduct(product.id, { stock: product.stock - item.quantity });
            }
        }

        const data = await fs.readFile(ordersFilePath, 'utf-8');
        const orders: Order[] = JSON.parse(data);

        orders.push(newOrder);

        await fs.writeFile(ordersFilePath, JSON.stringify(orders, null, 2));

        return NextResponse.json({ success: true, order: newOrder });
    } catch (error) {
        console.error('Error creating order:', error);
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        await ensureOrdersFile();
        const { id, status, trackingNumber, invoiceRequested } = await request.json();

        const data = await fs.readFile(ordersFilePath, 'utf-8');
        const orders: Order[] = JSON.parse(data);

        const orderIndex = orders.findIndex(o => o.id === id);
        if (orderIndex !== -1) {
            const order = orders[orderIndex];
            const previousStatus = order.status;

            orders[orderIndex].status = status;
            if (trackingNumber !== undefined) {
                orders[orderIndex].trackingNumber = trackingNumber;
            }
            if (invoiceRequested !== undefined) {
                orders[orderIndex].invoiceRequested = invoiceRequested;
            }

            await fs.writeFile(ordersFilePath, JSON.stringify(orders, null, 2));

            // Send email if status changed to shipped and tracking number is provided
            if (status === 'shipped' && trackingNumber && previousStatus !== 'shipped') {
                try {
                    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/send-email`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: order.customerEmail,
                            orderNumber: order.orderNumber,
                            trackingNumber: trackingNumber,
                            shippingCompany: order.shippingCompany
                        })
                    });
                } catch (emailError) {
                    console.error('Error sending email:', emailError);
                    // Continue even if email fails
                }
            }

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    } catch (error) {
        console.error('Error updating order:', error);
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }
}
