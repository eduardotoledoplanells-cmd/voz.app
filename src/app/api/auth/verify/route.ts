
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
        const { token } = await request.json();

        if (!token) {
            return NextResponse.json(
                { message: 'Token requerido' },
                { status: 400 }
            );
        }

        const users = await getUsers();
        const userIndex = users.findIndex(u => u.verificationToken === token);

        if (userIndex === -1) {
            return NextResponse.json(
                { message: 'Token inválido o expirado' },
                { status: 400 }
            );
        }

        const user = users[userIndex];

        // Ensure token is not expired (check date)
        if (user.verificationTokenExpiry && user.verificationTokenExpiry < Date.now()) {
            return NextResponse.json(
                { message: 'El token ha expirado. Regístrate de nuevo.' },
                { status: 400 }
            );
        }

        // Verify user
        users[userIndex] = {
            ...user,
            verified: true,
            verificationToken: undefined,
            verificationTokenExpiry: undefined
        };

        await saveUsers(users);

        return NextResponse.json({ message: 'Cuenta verificada con éxito' });

    } catch (error) {
        console.error('Verification error:', error);
        return NextResponse.json(
            { message: 'Error en la verificación' },
            { status: 500 }
        );
    }
}
