import { NextResponse } from 'next/server';
import { getLogs, addLog } from '@/lib/db';
import { validateEmployee } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

// VULN-03 FIX: Both GET and POST now require authenticated employee
export async function GET(request: Request) {
    try {
        const auth = await validateEmployee(request, 0);
        if (!auth.isValid) {
            return NextResponse.json({ error: auth.errorText }, { status: auth.errorStatus });
        }

        const logs = await getLogs();
        return NextResponse.json(logs);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        // SECURITY: Only authenticated employees can write to audit log
        const auth = await validateEmployee(request, 0);
        if (!auth.isValid) {
            return NextResponse.json({ error: auth.errorText }, { status: auth.errorStatus });
        }

        const body = await request.json();
        const { employeeName, action, details } = body;

        if (!employeeName || !action) {
            return NextResponse.json({ error: 'Missing employeeName or action' }, { status: 400 });
        }

        // Force the employeeName to match the authenticated employee to prevent spoofing
        const trustedEmployeeName = `[${auth.employee?.worker_number || '???'}] ${auth.employee?.username}`;

        const newLog = await addLog({
            id: uuidv4(),
            employeeName: trustedEmployeeName, // ← use authenticated name, not client-provided
            action,
            timestamp: new Date().toISOString(),
            details: details || ''
        });

        return NextResponse.json(newLog);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create log' }, { status: 500 });
    }
}
