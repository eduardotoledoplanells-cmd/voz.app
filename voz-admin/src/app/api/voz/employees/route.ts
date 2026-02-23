import { NextResponse } from 'next/server';
import { getEmployees, addEmployee, updateEmployee, addLog, Employee } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
    try {
        const employees = await getEmployees();
        return NextResponse.json(employees);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, role, password } = body;

        if (!username || !role) {
            return NextResponse.json({ error: 'Missing username or role' }, { status: 400 });
        }

        const employees = await getEmployees();

        // AUTO-GENERATE workerNumber with Gap Filling
        let nextNum = 1;
        const sortedNums = employees
            .map((e: any) => parseInt(e.workerNumber))
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
            workerNumber: nextNumber,
            password: password || '123',
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
