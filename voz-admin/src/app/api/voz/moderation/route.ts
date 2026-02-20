import { NextResponse } from 'next/server';
import { getModerationQueue, updateModerationItem, addModerationItem, addLog, ModerationItem, addPenaltyToUser, addProductivityLog, addInactivityLog, generateMatricula } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}

function corsHeaders(response: NextResponse) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
}

export async function GET() {
    const queue = getModerationQueue().filter(item => item.status === 'pending');
    return corsHeaders(NextResponse.json(queue));
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { type, url, userHandle, content, reportReason, reportedBy } = body;

        const newItem: ModerationItem = {
            id: uuidv4(),
            matricula: generateMatricula(),
            type: type || 'text',
            url: url || '',
            userHandle: userHandle || 'Anónimo',
            reportedBy: reportedBy || 'Desconocido',
            content: content || '',
            reportReason: reportReason || 'Reportado por usuario',
            timestamp: new Date().toISOString(),
            status: 'pending'
        };

        const result = addModerationItem(newItem);
        return corsHeaders(NextResponse.json(result));
    } catch (error) {
        return corsHeaders(NextResponse.json({ error: 'Failed to create moderation item' }, { status: 500 }));
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, status, employeeName, cycleVideos, totalVideos, inactivityAlert, skipPenalty } = body;

        if (inactivityAlert && employeeName) {
            addInactivityLog(employeeName);
            return corsHeaders(NextResponse.json({ success: true, message: 'Inactivity logged' }));
        }

        if (!id || !status) {
            return NextResponse.json({ error: 'Missing ID or status' }, { status: 400 });
        }

        const updated = updateModerationItem(id, {
            status,
            moderatedBy: employeeName || 'Moderador'
        });

        if (updated) {
            // Si el status es 'rejected' y no se pide omitir la penalización
            if (status === 'rejected' && !skipPenalty) {
                addPenaltyToUser(updated.userHandle, {
                    url: updated.url,
                    reason: updated.reportReason || 'Contenido inapropiado'
                });
            }

            // Log the action
            addLog({
                id: Date.now().toString(),
                employeeName: employeeName || 'Moderador',
                action: `${status.toUpperCase()} MODERACIÓN`,
                timestamp: new Date().toISOString(),
                details: `Item ID: ${id} (${updated.type})`
            });

            // Log productivity
            if (employeeName && cycleVideos !== undefined && totalVideos !== undefined) {
                addProductivityLog(employeeName, cycleVideos, totalVideos);
            }

            return corsHeaders(NextResponse.json(updated));
        }

        return corsHeaders(NextResponse.json({ error: 'Item not found' }, { status: 404 }));
    } catch (error) {
        return corsHeaders(NextResponse.json({ error: 'Failed to update moderation item' }, { status: 500 }));
    }
}
