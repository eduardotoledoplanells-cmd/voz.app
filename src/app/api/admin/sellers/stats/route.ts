import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { User, Order, Product } from '@/types';

const USERS_FILE = path.join(process.cwd(), 'src', 'data', 'users.json');
const ORDERS_FILE = path.join(process.cwd(), 'src', 'data', 'orders.json');
const DB_FILE = path.join(process.cwd(), 'src', 'lib', 'db.json');

export const dynamic = 'force-dynamic';

async function getData() {
    try {
        const usersData = await readFile(USERS_FILE, 'utf-8');
        const ordersData = await readFile(ORDERS_FILE, 'utf-8');
        const dbData = await readFile(DB_FILE, 'utf-8');

        const users: User[] = JSON.parse(usersData);
        const orders: Order[] = JSON.parse(ordersData);
        const products: Product[] = JSON.parse(dbData).products;

        return { users, orders, products };
    } catch (error) {
        console.error('Error reading data:', error);
        return { users: [], orders: [], products: [] };
    }
}

export async function GET() {
    try {
        const { users, orders, products } = await getData();

        const admins = users.filter(u => u.role === 'admin');

        const stats = admins.map(admin => {
            // Calculate Revenue
            const adminOrders = orders.filter(o => o.sellerId === admin.id);
            const revenue = adminOrders.reduce((sum, o) => sum + (o.total || 0), 0);

            // Calculate Inventory Value
            // Products where this admin is the 'sellerId'
            // OR if generic assignment logic is needed later. For now, strict match.
            const adminProducts = products.filter(p => p.sellerId === admin.id);
            const inventoryValue = adminProducts.reduce((sum, p) => sum + (p.price * p.stock), 0);

            return {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                revenue,
                inventoryValue,
                productCount: adminProducts.length
            };
        });

        return NextResponse.json(stats);
    } catch (error) {
        return NextResponse.json(
            { message: 'Error fetching stats' },
            { status: 500 }
        );
    }
}
