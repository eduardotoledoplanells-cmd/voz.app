import { NextResponse } from 'next/server';
import { updateRedemptionStatus, getRedemptionRequests, addRedemptionRequest, getCreators } from '@/lib/db';

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
        const requests = await getRedemptionRequests();
        return corsHeaders(NextResponse.json(requests));
    } catch (error) {
        return corsHeaders(NextResponse.json({ error: 'Failed to fetch redemptions' }, { status: 500 }));
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { creatorId, amountCoins } = body;

        if (!creatorId || !amountCoins) {
            return corsHeaders(NextResponse.json({ error: 'Missing creatorId or amountCoins' }, { status: 400 }));
        }

        if (amountCoins < 50) {
            return corsHeaders(NextResponse.json({ error: 'Minimum redemption amount is 50 coins' }, { status: 400 }));
        }

        const creators = await getCreators();
        const creator = creators.find(c => c.id === creatorId || c.handle === creatorId);

        if (!creator) {
            return corsHeaders(NextResponse.json({ error: 'Creator not found' }, { status: 404 }));
        }

        // Using walletBalance as coins
        const coins = creator.walletBalance || 0;
        if (coins < amountCoins) {
            return corsHeaders(NextResponse.json({ error: 'Insufficient funds' }, { status: 400 }));
        }

        const newRequest = await addRedemptionRequest({
            creatorId: creator.handle,
            amountCoins,
            amountEuro: amountCoins * 0.05, // Updated to match actual conversion logic
            status: 'pending',
            requestedAt: new Date().toISOString()
        });

        return corsHeaders(NextResponse.json(newRequest));
    } catch (error) {
        return corsHeaders(NextResponse.json({ error: 'Failed to create redemption request' }, { status: 500 }));
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, status, employeeName = 'Admin' } = body;

        if (!id || !status) {
            return corsHeaders(NextResponse.json({ error: 'Missing id or status' }, { status: 400 }));
        }

        const updated = await updateRedemptionStatus(id, status, employeeName);
        if (!updated) {
            return corsHeaders(NextResponse.json({ error: 'Redemption request not found' }, { status: 404 }));
        }

        return corsHeaders(NextResponse.json(updated));
    } catch (error) {
        return corsHeaders(NextResponse.json({ error: 'Failed to update redemption status' }, { status: 500 }));
    }
}
