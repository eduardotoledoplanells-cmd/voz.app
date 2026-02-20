import { NextResponse } from 'next/server';
import { User } from '@/types';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';

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
        const { token, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json(
                { message: 'Token y contraseña requeridos' },
                { status: 400 }
            );
        }

        const users = await getUsers();
        const userIndex = users.findIndex(u =>
            u.resetToken === token &&
            u.resetTokenExpiry &&
            u.resetTokenExpiry > Date.now()
        );

        if (userIndex === -1) {
            return NextResponse.json(
                { message: 'Token inválido o expirado' },
                { status: 400 }
            );
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user and clear token
        users[userIndex].password = hashedPassword;
        users[userIndex].resetToken = undefined;
        users[userIndex].resetTokenExpiry = undefined;

        await saveUsers(users);

        return NextResponse.json({
            success: true,
            message: 'Contraseña actualizada correctamente'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
