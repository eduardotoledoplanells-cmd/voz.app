import { NextResponse } from 'next/server';
import { validateEmployee } from '@/lib/auth';
import { processCreatorVerification, addLog } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        // Validate employee authentication (requires Director role = 1)
        const auth = await validateEmployee(request, 1);
        if (!auth.isValid) {
            return NextResponse.json({ success: false, error: auth.errorText }, { status: auth.errorStatus });
        }

        const body = await request.json();
        const { userId, status, reason } = body;

        if (!userId || !status) {
            return NextResponse.json({ success: false, error: 'Faltan parámetros obligatorios (userId o status).' }, { status: 400 });
        }

        if (status !== 'approved' && status !== 'rejected') {
            return NextResponse.json({ success: false, error: 'El estado debe ser approved o rejected.' }, { status: 400 });
        }

        // Perform KYC/verification processing
        const success = await processCreatorVerification(userId, status, reason);

        if (!success) {
            return NextResponse.json({ success: false, error: 'Error procesando la verificación del creador.' }, { status: 400 });
        }

        // Save internal audit log
        await addLog({
            id: 'log-' + Date.now(),
            employeeName: `[${auth.employee?.worker_number || '???'}] ${auth.employee?.username}`,
            action: 'PROCESS_KYC',
            timestamp: new Date().toISOString(),
            details: `KYC ${status.toUpperCase()} para el usuario ID: ${userId}. Motivo: ${reason || 'N/A'}`
        });

        return NextResponse.json({ success: true, message: `KYC procesado como ${status} correctamente.` });

    } catch (e: any) {
        console.error('API approve-kyc error:', e);
        return NextResponse.json({ success: false, error: e.message || 'Error interno al procesar KYC.' }, { status: 500 });
    }
}
