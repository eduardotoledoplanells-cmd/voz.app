import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env.production') });
import { supabaseAdmin } from './src/lib/db';

async function testSendMessage() {
    const userHandle = '@edu';
    const message = 'hola';
    
    // 1. Insert into support_messages
    const newMsg = {
        user_handle: userHandle,
        message: message,
        is_from_admin: true,
        read_status: false
    };

    const { data: dbData, error } = await supabaseAdmin.from('support_messages').insert([newMsg]).select().single();
    if (error) {
        console.error("DB Error:", error);
        return;
    }
    console.log("Saved to DB:", dbData);

    // 2. Notifications
    const cleanHandle = userHandle.startsWith('@') ? userHandle.slice(1) : userHandle;
    const { data: userData } = await supabaseAdmin
        .from('app_users')
        .select('push_token')
        .eq('handle', cleanHandle)
        .single();
        
    console.log("User Data for push:", userData);

    const newNotification = {
        recipient_id: cleanHandle,
        type: 'admin_message',
        title: '📢 Mensaje de VOZ',
        message: message,
        timestamp: new Date().toISOString(),
        read_status: false
    };

    const { error: notifError } = await supabaseAdmin.from('notifications').insert([newNotification]);
    if (notifError) {
        console.error("Notif Error:", notifError);
    } else {
        console.log("Notification saved successfully");
    }

    if (userData && userData.push_token) {
        console.log("Sending push to:", userData.push_token);
        const res = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Accept-encoding': 'gzip, deflate', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: userData.push_token,
                sound: 'default',
                title: '📢 Mensaje de VOZ',
                body: message,
                data: { type: 'admin_message' }
            })
        });
        const resData = await res.json();
        console.log("Push Result:", resData);
    }
}

testSendMessage();
