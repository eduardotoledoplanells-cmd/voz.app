import { NextResponse } from 'next/server';
import { User } from '@/types';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

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
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { message: 'Email requerido' },
                { status: 400 }
            );
        }

        const users = await getUsers();
        const userIndex = users.findIndex(u => u.email === email);

        // Security: Always return "success" even if user doesn't exist
        // to prevent email enumeration
        if (userIndex === -1) {
            return NextResponse.json({
                success: true,
                message: 'Si el email existe, recibirás instrucciones.'
            });
        }

        // Generate token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour

        // Update user
        users[userIndex].resetToken = resetToken;
        users[userIndex].resetTokenExpiry = resetTokenExpiry;

        await saveUsers(users);

        // Simulate sending email
        console.log('=== PASSWORD RESET EMAIL ===');
        console.log(`To: ${email}`);
        console.log(`Reset Link: ${new URL(request.url).origin}/reset-password?token=${resetToken}`);
        console.log('============================');

        return NextResponse.json({
            success: true,
            message: 'Si el email existe, recibirás instrucciones.'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
