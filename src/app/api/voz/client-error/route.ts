import { NextResponse } from 'next/server';
import { logSystemAlert } from '@/lib/alerts';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            servicio,
            nivel = 'error',
            mensaje,
            stack,
            usuario,
            plataforma,
            version_app,
            pantalla,
            metadata,
            // Formato legado del ErrorBoundary antiguo
            errorMessage,
            componentStack,
            url,
            userHandle,
        } = body;

        // Compatibilidad con el formato legado (ErrorBoundary web)
        const mensajeFinal = mensaje || errorMessage;
        const servicioFinal = servicio || 'Frontend';
        const stackFinal = stack || componentStack;
        const usuarioFinal = usuario || userHandle || null;
        const metadataFinal = metadata || (url ? { url } : null);

        if (!mensajeFinal) {
            return NextResponse.json({ error: 'Missing mensaje/errorMessage' }, { status: 400 });
        }

        await logSystemAlert({
            servicio: servicioFinal,
            nivel: nivel as 'info' | 'warning' | 'error' | 'critical',
            error: {
                message: mensajeFinal,
                stack: stackFinal,
            },
            usuario: usuarioFinal,
            plataforma,
            version_app,
            pantalla,
            metadata: metadataFinal,
        });

        return NextResponse.json({ ok: true });
    } catch (err) {
        // No llamamos logSystemAlert aquí para evitar bucles infinitos
        console.error('[client-error endpoint] Exception:', err);
        return NextResponse.json({ ok: false }, { status: 500 });
    }
}
