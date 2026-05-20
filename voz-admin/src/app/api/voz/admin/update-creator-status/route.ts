import { NextResponse } from 'next/server';
import { validateEmployee } from '@/lib/auth';
import { updateCreator, deleteCreatorCompletely, addLog } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        // Validate employee authentication (requires Director role = 1)
        const auth = await validateEmployee(request, 1);
        if (!auth.isValid) {
            return NextResponse.json({ success: false, error: auth.errorText }, { status: auth.errorStatus });
        }

        const body = await request.json();
        const { id, status } = body;

        if (!id || !status) {
            return NextResponse.json({ success: false, error: 'Faltan parámetros obligatorios (id o status).' }, { status: 400 });
        }

        const employeeName = `[${auth.employee?.worker_number || '???'}] ${auth.employee?.username}`;

        if (status === 'deleted') {
            const success = await deleteCreatorCompletely(id, employeeName);
            if (!success) {
                return NextResponse.json({ success: false, error: 'No se pudo eliminar al creador.' }, { status: 404 });
            }
            return NextResponse.json({ success: true, status: 'deleted', id });
        }

        if (!['active', 'under_review', 'suspended'].includes(status)) {
            return NextResponse.json({ success: false, error: 'Estado del creador no válido.' }, { status: 400 });
        }

        const updated = await updateCreator(id, { status }, employeeName);
        if (!updated) {
            return NextResponse.json({ success: false, error: 'Creador no encontrado.' }, { status: 404 });
        }

        // Save audit log
        await addLog({
            id: 'log-' + Date.now(),
            employeeName,
            action: 'UPDATE_CREATOR_STATUS',
            timestamp: new Date().toISOString(),
            details: `ID del Creador: ${id}, Nuevo Estado: ${status}`
        });

        return NextResponse.json({ success: true, creator: updated });

    } catch (e: any) {
        console.error('API update-creator-status error:', e);
        return NextResponse.json({ success: false, error: e.message || 'Error interno al actualizar estado del creador.' }, { status: 500 });
    }
}
