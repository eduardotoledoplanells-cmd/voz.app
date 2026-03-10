const { createClient } = require('@supabase/supabase-js');
const url = 'https://obdrsqeueivhnbsibhen.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZHJzcWV1ZWl2aG5ic2liaGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTE4MTksImV4cCI6MjA4NzMyNzgxOX0.6iZ82MtwuC5_Uxyu4xDRMKxITeugq8GiklPkgvq9AUg';

async function test() {
    const s = createClient(url, anonKey);
    console.log('Testing delete from app_users with ANON key...');
    const { data, error } = await s.from('app_users').delete().eq('handle', '@testerror').select();
    if (error) {
        console.log('ANON DELETE FROM app_users FAILED:', error.message);
    } else {
        console.log('ANON DELETE FROM app_users RESULT:', data);
    }
}
test();
