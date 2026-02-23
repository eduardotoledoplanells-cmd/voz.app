import { NextResponse } from 'next/server';
import { getCreators, updateCreator, addCreator, deleteCreatorCompletely } from '@/lib/db';

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
    try {
        const body = await request.json();
        const { id, employeeName = 'Admin', ...updates } = body;

        console.log("PATCH /api/voz/creators - ID:", id, "Employee:", employeeName, "Updates:", JSON.stringify(updates));

        if (!id) {
            return corsHeaders(NextResponse.json({ error: 'Missing creator id' }, { status: 400 }));
        }

        if (updates.status === 'deleted') {
            const deleted = await deleteCreatorCompletely(id, employeeName);
            if (!deleted) {
                return corsHeaders(NextResponse.json({ error: 'Creator not found' }, { status: 404 }));
            }
            return corsHeaders(NextResponse.json({ status: 'deleted', id }));
        }

        const updated = await updateCreator(id, updates, employeeName);
        if (!updated) {
            console.error("PATCH /api/voz/creators - Creator not found with ID:", id);
            return corsHeaders(NextResponse.json({ error: 'Creator not found' }, { status: 404 }));
        }

        console.log("PATCH /api/voz/creators - SUCCESS:", updated.id, "Status:", updated.status);
        return corsHeaders(NextResponse.json(updated));
    } catch (error) {
        console.error("PATCH /api/voz/creators - ERROR:", error);
        return corsHeaders(NextResponse.json({ error: 'Failed to update creator' }, { status: 500 }));
    }
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
