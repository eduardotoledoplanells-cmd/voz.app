import { NextResponse } from 'next/server';
import { getLogs, addLog } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
    try {
        const logs = await getLogs();
        // Logs are already ordered by timestamp descending in getLogs()
        return NextResponse.json(logs);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { employeeName, action, details } = body;

        if (!employeeName || !action) {
            return NextResponse.json({ error: 'Missing employeeName or action' }, { status: 400 });
        }

        const newLog = await addLog({
            id: uuidv4(),
            employeeName,
            action,
            timestamp: new Date().toISOString(),
            details: details || ''
        });

        return NextResponse.json(newLog);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create log' }, { status: 500 });
    }
}
