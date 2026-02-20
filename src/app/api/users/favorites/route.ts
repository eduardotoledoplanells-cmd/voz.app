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

export async function POST(request: Request) {
    try {
        const { userId, productId } = await request.json();

        if (!userId || !productId) {
            return NextResponse.json(
                { message: 'Faltan datos requeridos' },
                { status: 400 }
            );
        }

        const users = await getUsers();
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            return NextResponse.json(
                { message: 'Usuario no encontrado' },
                { status: 404 }
            );
        }

        const user = users[userIndex];
        const favorites = user.favorites || [];

        // Check if already in favorites to toggle
        const existingIndex = favorites.indexOf(productId);
        let action = '';

        if (existingIndex > -1) {
            // Remove
            favorites.splice(existingIndex, 1);
            action = 'removed';
        } else {
            // Add
            favorites.push(productId);
            action = 'added';
        }

        users[userIndex].favorites = favorites;
        await saveUsers(users);

        const { password: _, ...userWithoutPassword } = users[userIndex];
        return NextResponse.json({
            user: userWithoutPassword,
            action,
            message: action === 'added' ? 'Añadido a favoritos' : 'Eliminado de favoritos'
        });

    } catch (error) {
        console.error('Favorites update error:', error);
        return NextResponse.json(
            { message: 'Error al actualizar favoritos' },
            { status: 500 }
        );
    }
}
