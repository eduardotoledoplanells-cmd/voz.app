const { createClient } = require('@supabase/supabase-js');

const url1 = 'https://obdrsqeueivhnbsibhen.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZHJzcWV1ZWl2aG5ic2liaGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTE4MTksImV4cCI6MjA4NzMyNzgxOX0.6iZ82MtwuC5_Uxyu4xDRMKxITeugq8GiklPkgvq9AUg';

async function check() {
    console.log("Checking Anon Key...");
    try {
        const sb1 = createClient(url1, anonKey);
        const res1 = await sb1.from('moderation_queue').select('*').limit(1);
        console.log('Project 1 result:', res1.error || 'SUCCESS');
        console.log('Data:', res1.data);
    } catch (e) {
        console.log('Project 1 error:', e.message);
    }
}

check();
