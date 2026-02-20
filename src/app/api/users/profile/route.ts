import { NextResponse } from 'next/server';
import { User } from '@/types';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

const USERS_FILE = path.join(process.cwd(), 'src', 'data', 'users.json');

async function getUsers(): Promise<User[]> {
    try {
        const data = await readFile(USERS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

async function saveUsers(users: User[]) {
    await writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

export async function PUT(request: Request) {
    try {
        const { id, address, marketingConsent } = await request.json();

        if (!id || !address) {
            return NextResponse.json(
                { message: 'Faltan datos requeridos' },
                { status: 400 }
            );
        }

        const users = await getUsers();
        const userIndex = users.findIndex(u => u.id === id);

        if (userIndex === -1) {
            return NextResponse.json(
                { message: 'Usuario no encontrado' },
                { status: 404 }
            );
        }

        users[userIndex].address = address;
        if (marketingConsent !== undefined) {
            users[userIndex].marketingConsent = marketingConsent;
        }
        await saveUsers(users);

        const { password: _, ...userWithoutPassword } = users[userIndex];
        return NextResponse.json(userWithoutPassword);
    } catch (error) {
        console.error('Profile update error:', error);
        return NextResponse.json(
            { message: 'Error al actualizar perfil' },
            { status: 500 }
        );
    }
}
