import { NextResponse } from 'next/server';
import { getCreators, updateCreator, addCreator, deleteCreatorCompletely, processCreatorVerification } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}

function corsHeaders(response: NextResponse) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
}

export async function GET() {
    try {
        const creators = await getCreators();
        return corsHeaders(NextResponse.json(creators));
    } catch (error) {
        return corsHeaders(NextResponse.json({ error: 'Failed to fetch creators' }, { status: 500 }));
    }
}

export async function PATCH(request: Request) {
    return corsHeaders(NextResponse.json({ 
        error: 'Acceso no autorizado. Las modificaciones de creadores y verificaciones de KYC deben realizarse a través de la capa de comandos (/api/voz/admin/approve-kyc y /api/voz/admin/update-creator-status).' 
    }, { status: 403 }));
}
export async function POST(request: Request) {
    try {
        const body = await request.json();
        // Basic validation could be done here
        // We assume the body matches the Creator interface roughly

        console.log("POST /api/voz/creators - Creating Creator:", body.userHandle);

        const created = await addCreator(body, "App User (Self-Activation)");
        return corsHeaders(NextResponse.json(created));
    } catch (error) {
        console.error("POST /api/voz/creators - ERROR:", error);
        return corsHeaders(NextResponse.json({ error: 'Failed to create creator' }, { status: 500 }));
    }
}
