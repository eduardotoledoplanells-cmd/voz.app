const { createClient } = require('@supabase/supabase-js');
const url = 'https://obdrsqeueivhnbsibhen.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZHJzcWV1ZWl2aG5ic2liaGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTE4MTksImV4cCI6MjA4NzMyNzgxOX0.6iZ82MtwuC5_Uxyu4xDRMKxITeugq8GiklPkgvq9AUg';

async function test() {
    const s = createClient(url, anonKey);
    console.log('Fetching moderation_queue...');
    const { data, error } = await s.from('moderation_queue').select('*').limit(5);
    if (error) {
        console.log('Fetch FAILED:', error.message);
    } else {
        console.log('moderation_queue data:', JSON.stringify(data, null, 2));
    }
}
test();
