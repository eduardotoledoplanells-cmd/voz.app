import { NextResponse } from 'next/server';
import { User } from '@/types';
import { readFile } from 'fs/promises';
import path from 'path';
import { getUserRole } from '@/lib/auth-config';
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

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { message: 'Faltan datos requeridos' },
                { status: 400 }
            );
        }

        const users = await getUsers();
        const user = users.find(u => u.email === email);

        if (!user) {
            return NextResponse.json(
                { message: 'Credenciales inválidas' },
                { status: 401 }
            );
        }

        // Verify password with bcrypt
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return NextResponse.json(
                { message: 'Credenciales inválidas' },
                { status: 401 }
            );
        }

        if (user.verified === false) {
            return NextResponse.json(
                { message: 'Por favor verifica tu correo electrónico para iniciar sesión.' },
                { status: 403 }
            );
        }

        // Return user without password
        // Return user without password and with role
        const userWithRole = {
            ...user,
            role: user.role || getUserRole(user.email)
        };
        const { password: _, ...userWithoutPassword } = userWithRole;

        return NextResponse.json(userWithoutPassword);
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { message: 'Error al iniciar sesión' },
            { status: 500 }
        );
    }
}
