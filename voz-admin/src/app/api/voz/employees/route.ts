import { NextResponse } from 'next/server';
import { getEmployees, addEmployee, updateEmployee, deleteEmployee, addLog, Employee } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { validateEmployee } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const auth = await validateEmployee(request, 1); // Min role 1 (Director) to get employee list
        if (!auth.isValid) {
            return NextResponse.json({ error: auth.errorText }, { status: auth.errorStatus });
        }
        const employees = await getEmployees();
        return NextResponse.json(employees);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const auth = await validateEmployee(request, 1); // Min role 1 (Director) to create employee
        if (!auth.isValid) {
            return NextResponse.json({ error: auth.errorText }, { status: auth.errorStatus });
        }

        const body = await request.json();
        const { username, role, password } = body;

        if (!username || !role) {
            return NextResponse.json({ error: 'Missing username or role' }, { status: 400 });
        }

        // HASH the password with bcrypt
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password || '123', salt);

        const employees = await getEmployees();

        // AUTO-GENERATE workerNumber with Gap Filling
        let nextNum = 1;
        const sortedNums = employees
            .map((e: any) => parseInt(e.worker_number))
            .filter((n: any) => !isNaN(n))
            .sort((a: number, b: number) => a - b);

        for (const num of sortedNums) {
            if (num === nextNum) {
                nextNum++;
            } else if (num > nextNum) {
                break;
            }
        }
        const nextNumber = nextNum.toString().padStart(3, '0');

        const newEmployee: any = {
            id: uuidv4(),
            username,
            worker_number: nextNumber,
            password: hashedPassword, // Store the hashed password
            role: parseInt(role) as any,
            lastLogin: 'Nunca',
            active: true
        };

        const created = await addEmployee(newEmployee);
        if (!created) {
            return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
        }

        // Register Log
        await addLog({
            id: 'log-' + Date.now(),
            employeeName: 'Sistema HR',
            action: `Nuevo Empleado: ${username}`,
            timestamp: new Date().toISOString(),
            details: `Asignado número: ${nextNumber}, Rol: ${role}`
        });

        return NextResponse.json(created);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

        // Skip auth checks only if self-updating lastLogin or lastLogout (non-administrative actions)
        const isSelfUpdate = Object.keys(updates).every(k => k === 'lastLogin' || k === 'lastLogout');
        if (!isSelfUpdate) {
            const auth = await validateEmployee(request, 1); // Min role 1 (Director) to update employee data
            if (!auth.isValid) {
                return NextResponse.json({ error: auth.errorText }, { status: auth.errorStatus });
            }
        }

        // Hash password if being updated
        if (updates.password) {
            const salt = await bcrypt.genSalt(10);
            updates.password = await bcrypt.hash(updates.password, salt);
        }

        const updated = await updateEmployee(id, updates);
        if (!updated) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

        // Log Logout
        if (updates.lastLogout) {
            await addLog({
                id: 'log-' + Date.now(),
                employeeName: updated.username,
                action: 'Cierre de Sesión',
                timestamp: new Date().toISOString(),
                details: `Fin de jornada laboral. Hora: ${new Date().toLocaleTimeString()}`
            });
        }

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const auth = await validateEmployee(request, 1); // Min role 1 (Director) to delete employee
        if (!auth.isValid) {
            return NextResponse.json({ error: auth.errorText }, { status: auth.errorStatus });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

        const success = await deleteEmployee(id);
        if (!success) return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 });
    }
}


