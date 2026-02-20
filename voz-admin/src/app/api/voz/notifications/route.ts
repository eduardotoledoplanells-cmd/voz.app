import { NextResponse } from 'next/server';
import { getNotifications, addNotification, Notification } from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const recipientId = searchParams.get('recipientId');

    try {
        const notifications = getNotifications(recipientId || undefined);
        return NextResponse.json(notifications);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { recipientId, type, title, message } = body;

        if (!recipientId || !type || !title || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newNotification: Notification = {
            id: 'nt-' + Date.now(),
            recipientId,
            type,
            title,
            message,
            timestamp: new Date().toISOString(),
            readStatus: false
        };

        const savedNotification = addNotification(newNotification);
        return NextResponse.json(savedNotification);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }
}
