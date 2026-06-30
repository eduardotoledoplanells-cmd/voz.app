import { NextResponse } from 'next/server';

const streamCache = new Map<string, { streamUrl: string, expiresAt: number }>();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
        return NextResponse.json({ error: 'URL requerida' }, { status: 400 });
    }

    const now = Date.now();
    const cached = streamCache.get(targetUrl);

    if (cached && cached.expiresAt > now + (5 * 60 * 1000)) {
        return NextResponse.json({ streamUrl: cached.streamUrl, is_live: true, cached: true });
    }

    try {
        const liveServiceUrl = process.env.LIVE_SERVICE_URL || 'http://localhost:5005';
        const dotnetUrl = `${liveServiceUrl}/api/extract?url=${encodeURIComponent(targetUrl)}`;

        let response: Response;
        try {
            response = await fetch(dotnetUrl, {
                method: 'GET',
                signal: AbortSignal.timeout(30000), // 30s timeout para yt-dlp
            });
        } catch (fetchError: unknown) {
            // Error de red o timeout — el microservicio no está accesible
            const msg = fetchError instanceof Error ? fetchError.message : 'Timeout';
            console.error('[Live API] Error de red al contactar microservicio:', msg);
            return NextResponse.json(
                { error: 'Servicio de directos temporalmente no disponible', is_live: false },
                { status: 503 }
            );
        }

        // 404 = canal offline (respuesta controlada del microservicio)
        if (response.status === 404) {
            return NextResponse.json({ is_live: false, error: 'El canal no está en directo' }, { status: 200 });
        }

        // Cualquier otro error del microservicio (4xx / 5xx)
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            console.error(`[Live API] Microservicio devolvió ${response.status}:`, errData);
            return NextResponse.json(
                { error: errData.error || 'Error al obtener el stream', is_live: false },
                { status: 503 }
            );
        }

        const data = await response.json();

        streamCache.set(targetUrl, {
            streamUrl: data.streamUrl,
            expiresAt: now + (15 * 60 * 1000),
        });

        return NextResponse.json({ streamUrl: data.streamUrl, is_live: true, cached: false });

    } catch (error: unknown) {
        // Captura de seguridad para cualquier error JS inesperado
        const msg = error instanceof Error ? error.message : 'Error desconocido';
        console.error('[Live API] Error inesperado:', msg);
        return NextResponse.json(
            { error: 'Error interno del servidor de directos', is_live: false },
            { status: 500 }
        );
    }
}
