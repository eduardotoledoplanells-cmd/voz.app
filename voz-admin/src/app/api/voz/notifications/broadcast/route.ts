import { NextResponse } from 'next/server';
import { getAppUsers, addNotification, supabaseAdmin } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { type, title, message, employeeName = 'Admin' } = body;

        if (!type || !title || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Get all active users
        const users = await getAppUsers();
        const activeUsers = users.filter(u => u.status !== 'banned');

        if (activeUsers.length === 0) {
            return NextResponse.json({ error: 'No active users found' }, { status: 404 });
        }

        console.log(`[BROADCAST] Sending to ${activeUsers.length} users...`);

        // 2. Prepare notifications for bulk insert
        const notifications = activeUsers.map(u => ({
            recipient_id: u.handle,
            type: type,
            title: title,
            message: message,
            read_status: false
        }));

        // 3. Bulk Insert in Supabase
        const { error: dbError } = await supabaseAdmin
            .from('notifications')
            .insert(notifications);

        if (dbError) {
            console.error('[BROADCAST] DB Error:', dbError);
            return NextResponse.json({ error: 'Failed to save notifications to database' }, { status: 500 });
        }

        // 4. Batch push notifications (Optional/Best effort)
        const tokens = activeUsers.filter(u => (u as any).push_token).map(u => (u as any).push_token);
        if (tokens.length > 0) {
            try {
                // Expo allows chunks of 100
                const chunks = [];
                for (let i = 0; i < tokens.length; i += 100) {
                    chunks.push(tokens.slice(i, i + 100));
                }

                for (const chunk of chunks) {
                    await fetch('https://exp.host/--/api/v2/push/send', {
                        method: 'POST',
                        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                        body: JSON.stringify(chunk.map(token => ({
                            to: token,
                            sound: 'default',
                            title: title,
                            body: message,
                            data: { type, broadcast: true }
                        })))
                    });
                }
            } catch (pError) {
                console.warn('[BROADCAST] Push notification error:', pError);
            }
        }

        // 5. Log the action
        await supabaseAdmin.from('logs').insert([{
            employee_name: employeeName,
            action: 'BROADCAST_NOTIFICATION',
            details: `Title: ${title}, Users: ${activeUsers.length}`
        }]);

        return NextResponse.json({ success: true, count: activeUsers.length });

    } catch (error: any) {
        console.error('Error in broadcast API:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
