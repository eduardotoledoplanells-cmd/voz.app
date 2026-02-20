import { NextResponse } from 'next/server';
import { getDB, saveDB, Employee, addLog } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// Helper to get employees
function getEmployees() {
    const db = getDB();
    return db.employees || [];
}

export async function GET() {
    try {
        return NextResponse.json(getEmployees());
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

        const data = getDB();
        if (!data.employees) data.employees = [];

        // AUTO-GENERATE workerNumber with Gap Filling
        let nextNum = 1;
        const sortedNums = data.employees
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

        const newEmployee: Employee = {
            id: uuidv4(),
            username,
            workerNumber: nextNumber,
            password: password || '123',
            role: parseInt(role) as any,
            lastLogin: 'Nunca',
            active: true
        };

        data.employees.push(newEmployee);
        saveDB(data);

        // Register Log
        addLog({
            id: 'log-' + Date.now(),
            employeeName: 'Sistema HR',
            action: `Nuevo Empleado: ${username}`,
            timestamp: new Date().toISOString(),
            details: `Asignado número: ${nextNumber}, Rol: ${role}`
        });

        return NextResponse.json(newEmployee);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

        const data = getDB();
        const employee = (data.employees || []).find((e: any) => e.id === id);

        if (employee) {
            // Register Log BEFORE deleting
            addLog({
                id: 'log-' + Date.now(),
                employeeName: 'Sistema HR',
                action: `Eliminación de Empleado: ${employee.username}`,
                timestamp: new Date().toISOString(),
                details: `Número de empleado liberado: ${employee.workerNumber}. Motivo: Baja del sistema.`
            });

            data.employees = data.employees.filter((e: any) => e.id !== id);
            saveDB(data);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

        const data = getDB();
        const index = (data.employees || []).findIndex((e: any) => e.id === id);
        if (index === -1) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

        data.employees[index] = { ...data.employees[index], ...updates };

        // Log Logout
        if (updates.lastLogout) {
            addLog({
                id: 'log-' + Date.now(),
                employeeName: data.employees[index].username,
                action: 'Cierre de Sesión',
                timestamp: new Date().toISOString(),
                details: `Fin de jornada laboral. Hora: ${new Date().toLocaleTimeString()}`
            });
        }

        saveDB(data);

        return NextResponse.json(data.employees[index]);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
    }
}
