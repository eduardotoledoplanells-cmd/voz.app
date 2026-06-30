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
        return NextResponse.json({ streamUrl: cached.streamUrl, cached: true });
    }

    try {
        const liveServiceUrl = process.env.LIVE_SERVICE_URL || 'http://localhost:5005';
        const dotnetUrl = `${liveServiceUrl}/api/extract?url=${encodeURIComponent(targetUrl)}`;
        const response = await fetch(dotnetUrl, { method: 'GET' });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            return NextResponse.json({ error: errData.error || 'Directo Offline' }, { status: response.status });
        }

        const data = await response.json();
        
        streamCache.set(targetUrl, {
            streamUrl: data.streamUrl,
            expiresAt: now + (15 * 60 * 1000)
        });

        return NextResponse.json({ streamUrl: data.streamUrl, cached: false });
    } catch (error) {
        console.error('Error contactando al servicio .NET de Live:', error);
        return NextResponse.json({ error: 'Error interno de comunicación con el servicio Live' }, { status: 500 });
    }
}
