import { NextRequest, NextResponse } from "next/server";
import { addLog } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}

function corsHeaders(response: NextResponse) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message, details, level } = body;
        
        console.error(`[CLIENT LOG - ${level || 'error'}]: ${message}`, JSON.stringify(details || {}));
        
        // Log to DB logs table
        await addLog({
            id: Date.now().toString(),
            employeeName: 'Mobile Client',
            action: `CLIENT_${(level || 'error').toUpperCase()}`,
            timestamp: new Date().toISOString(),
            details: `${message} - Details: ${JSON.stringify(details || {})}`
        });

        return corsHeaders(NextResponse.json({ success: true }));
    } catch (e) {
        console.error("Error processing client log:", e);
        return corsHeaders(NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 }));
    }
}
