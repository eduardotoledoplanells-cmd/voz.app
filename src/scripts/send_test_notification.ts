import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.production') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function sendTestNotification() {
    const { data: users, error } = await supabase.from('app_users').select('id, handle, push_token').not('push_token', 'is', null);
    
    if (error) {
        console.error('Error fetching users:', error);
        return;
    }

    if (!users || users.length === 0) {
        console.log('No users found with a push token.');
        return;
    }

    console.log(`Found ${users.length} users with push tokens.`);

    for (const user of users) {
        if (!user.push_token) continue;

        console.log(`Sending push notification to ${user.handle}...`);
        
        try {
            const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: { 
                    'Accept': 'application/json', 
                    'Accept-encoding': 'gzip, deflate', 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({
                    to: user.push_token,
                    sound: 'default',
                    title: '¡Hola desde VOZ!',
                    body: 'Esta es una notificación de prueba para verificar que el sistema funciona correctamente. 🎉',
                    data: { type: 'system', test: true }
                })
            });
            
            const result = await response.json();
            console.log(`Result for ${user.handle}:`, result);
        } catch (e: any) {
            console.error(`Failed to send to ${user.handle}:`, e.message);
        }
    }
}

sendTestNotification();
