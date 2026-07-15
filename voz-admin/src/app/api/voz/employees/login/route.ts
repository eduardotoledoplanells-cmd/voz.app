import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
        }

        // Query the employees table for username
        const { data: allEmployees, error } = await supabaseAdmin.from('employees').select('*');
        if (error || !allEmployees) {
            return NextResponse.json({ error: 'Error al conectar con la base de datos de empleados' }, { status: 500 });
        }

        // Case-insensitive username match
        const employee = allEmployees.find((e: any) => e.username.toLowerCase() === username.trim().toLowerCase());

        if (!employee) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 });
        }

        if (!employee.active) {
            return NextResponse.json({ error: 'Cuenta inactiva' }, { status: 403 });
        }

        // Verify password
        let isPasswordValid = false;
        if (employee.password.startsWith('$2b$')) {
            isPasswordValid = await bcrypt.compare(password, employee.password);
        } else {
            isPasswordValid = (password === employee.password);
        }

        if (!isPasswordValid) {
            return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
        }

        return NextResponse.json({
            success: true,
            employee: {
                id: employee.id,
                username: employee.username,
                role: employee.role,
                worker_number: employee.worker_number || '???'
            }
        });
    } catch (e: any) {
        console.error('Error in login API:', e);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
