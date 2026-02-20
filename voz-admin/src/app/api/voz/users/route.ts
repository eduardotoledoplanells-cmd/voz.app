import { NextResponse } from 'next/server';
import { getAppUsers, addAppUser, updateAppUser, deleteAppUser, addCreator } from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const handle = searchParams.get('handle');

        if (handle) {
            const { getVideosByUser } = require('@/lib/db');
            return NextResponse.json(getVideosByUser(handle));
        }

        const users = getAppUsers();
        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Check for duplicates
        const existingUsers = getAppUsers();
        if (existingUsers.some(u => u.handle === body.handle)) {
            return NextResponse.json({ error: 'El nombre de usuario ya está en uso' }, { status: 400 });
        }
        if (existingUsers.some(u => u.email === body.email)) {
            return NextResponse.json({ error: 'El email ya está registrado' }, { status: 400 });
        }

        const newUser = addAppUser({
            ...body,
            id: Date.now().toString(),
            joinedAt: new Date().toISOString()
        });

        // REMOVED: Automatic creation of Creator profile. 
        // Now handled by 'Activate Monetization' in App.js via POST /api/voz/creators

        return NextResponse.json(newUser);
    } catch (error) {
        console.error("Error creating user/creator:", error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, employeeName = 'Admin', ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const updated = updateAppUser(id, updates, employeeName);
        if (!updated) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const employeeName = searchParams.get('employeeName') || 'Admin';

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const success = deleteAppUser(id, employeeName);
        if (!success) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
