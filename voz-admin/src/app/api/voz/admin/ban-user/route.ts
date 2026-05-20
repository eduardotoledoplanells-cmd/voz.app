import { NextResponse } from 'next/server';
import { validateEmployee } from '@/lib/auth';
import { banAppUserByHandle, addLog } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        // Validate employee authentication (requires Director role = 1)
        const auth = await validateEmployee(request, 1);
        if (!auth.isValid) {
            return NextResponse.json({ success: false, error: auth.errorText }, { status: auth.errorStatus });
        }

        const body = await request.json();
        const { handle } = body;

        if (!handle || typeof handle !== 'string' || !handle.trim()) {
            return NextResponse.json({ success: false, error: 'Identificador (handle) del usuario es obligatorio.' }, { status: 400 });
        }

        const cleanHandle = handle.trim();

        // 2. Perform the ban (user gets deleted, push logs, blacklisted)
        const success = await banAppUserByHandle(cleanHandle);

        if (!success) {
            return NextResponse.json({ success: false, error: 'No se pudo banear al usuario (usuario inexistente o denegado por protección).' }, { status: 400 });
        }

        // 3. Save internal audit log
        await addLog({
            id: 'log-' + Date.now(),
            employeeName: `[${auth.employee?.worker_number || '???'}] ${auth.employee?.username}`,
            action: 'BAN_USER',
            timestamp: new Date().toISOString(),
            details: `Usuario baneado permanentemente y eliminado de Auth/DB: ${cleanHandle}`
        });

        return NextResponse.json({ success: true, message: `Usuario ${cleanHandle} baneado correctamente.` });

    } catch (e: any) {
        console.error('API ban-user error:', e);
        return NextResponse.json({ success: false, error: e.message || 'Error interno al procesar el baneo.' }, { status: 500 });
    }
}
