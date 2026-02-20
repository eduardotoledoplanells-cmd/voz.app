import { NextResponse } from 'next/server';
import { User } from '@/types';
import { readFile } from 'fs/promises';
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

export async function POST(request: Request) {
    try {
        const { subject, message } = await request.json();

        if (!subject || !message) {
            return NextResponse.json(
                { message: 'Faltan datos requeridos' },
                { status: 400 }
            );
        }

        const users = await getUsers();

        // Filter users who have given marketing consent
        const recipients = users.filter(user => user.marketingConsent);

        if (recipients.length === 0) {
            return NextResponse.json(
                { message: 'No hay destinatarios con consentimiento de marketing' },
                { status: 400 }
            );
        }

        // Simulate sending emails (in production, use SendGrid, AWS SES, etc.)
        console.log('=== SENDING MARKETING EMAIL ===');
        console.log('Subject:', subject);
        console.log('Message:', message);
        console.log('Recipients:', recipients.length);
        console.log('Emails:', recipients.map(u => u.email).join(', '));
        console.log('===============================');

        // In production, you would send actual emails here
        // Example with SendGrid:
        // await sendgrid.send({
        //     to: recipients.map(u => u.email),
        //     from: 'noreply@yourstore.com',
        //     subject: subject,
        //     html: message
        // });

        return NextResponse.json({
            success: true,
            recipientCount: recipients.length,
            message: `Email enviado a ${recipients.length} cliente(s)`
        });
    } catch (error) {
        console.error('Email marketing error:', error);
        return NextResponse.json(
            { message: 'Error al enviar emails' },
            { status: 500 }
        );
    }
}
