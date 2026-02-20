import { NextResponse } from 'next/server';
import { User } from '@/types';
import { readFile } from 'fs/promises';
import path from 'path';

const USERS_FILE = path.join(process.cwd(), 'src', 'data', 'users.json');
const ORDERS_FILE = path.join(process.cwd(), 'src', 'data', 'orders.json');

async function getUsers(): Promise<User[]> {
    try {
        const data = await readFile(USERS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

async function getOrders() {
    try {
        const data = await readFile(ORDERS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

export async function GET() {
    try {
        const users = await getUsers();
        const orders = await getOrders();

        // Count orders per user
        const orderCounts: { [email: string]: number } = {};
        orders.forEach((order: any) => {
            orderCounts[order.customerEmail] = (orderCounts[order.customerEmail] || 0) + 1;
        });

        // Return users without passwords, with order counts
        const customersData = users.map(user => {
            const { password, ...userWithoutPassword } = user;
            return {
                ...userWithoutPassword,
                orderCount: orderCounts[user.email] || 0
            };
        });

        return NextResponse.json(customersData);
    } catch (error) {
        console.error('Customers GET error:', error);
        return NextResponse.json(
            { message: 'Error al obtener clientes' },
            { status: 500 }
        );
    }
}
