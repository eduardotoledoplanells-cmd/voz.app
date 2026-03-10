const { createClient } = require('@supabase/supabase-js');
const url = 'https://obdrsqeueivhnbsibhen.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZHJzcWV1ZWl2aG5ic2liaGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTE4MTksImV4cCI6MjA4NzMyNzgxOX0.6iZ82MtwuC5_Uxyu4xDRMKxITeugq8GiklPkgvq9AUg';

async function test() {
    const s = createClient(url, anonKey);
    console.log('Testing delete from videos by ID with ANON key...');
    // We try to delete the other video "8dd9a742-344b-406b-b46f-5bb7f61b8b50"
    const { data, error } = await s.from('videos').delete().eq('id', '8dd9a742-344b-406b-b46f-5bb7f61b8b50').select();
    if (error) {
        console.log('ANON DELETE FROM videos by ID FAILED:', error.message);
    } else {
        console.log('ANON DELETE FROM videos by ID RESULT:', data);
    }
}
test();
