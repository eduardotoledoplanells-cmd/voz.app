const { createClient } = require('@supabase/supabase-js');

const url1 = 'https://obdrsqeueivhnbsibhen.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZHJzcWV1ZWl2aG5ic2liaGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTE4MTksImV4cCI6MjA4NzMyNzgxOX0.6iZ82MtwuC5_Uxyu4xDRMKxITeugq8GiklPkgvq9AUg';

async function check() {
    console.log("Testing insert with Anon Key (no ID)...");
    try {
        const sb1 = createClient(url1, anonKey);
        const { data, error } = await sb1.from('moderation_queue').insert([{
            type: 'profile',
            url: 'https://voz.app/profile/test_no_id',
            user_handle: '@test',
            report_reason: 'Testing insertion bypass',
            content: 'Test no id',
            status: 'pending'
        }]).select();
        console.log('Insert error:', JSON.stringify(error, null, 2));
        console.log('Insert data:', data);
    } catch (e) {
        console.log('Execute error:', e.message);
    }
}

check();
