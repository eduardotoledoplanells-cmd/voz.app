const { createClient } = require('@supabase/supabase-js');
const url = 'https://obdrsqeueivhnbsibhen.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZHJzcWV1ZWl2aG5ic2liaGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTE4MTksImV4cCI6MjA4NzMyNzgxOX0.6iZ82MtwuC5_Uxyu4xDRMKxITeugq8GiklPkgvq9AUg';

async function test() {
    const s = createClient(url, anonKey);
    const videoId = '5e205e1d-8ab6-4d69-af66-5a11a601b0a3';
    console.log(`Attempting to delete video ${videoId}...`);

    // First, let's check if it has related records in some tables
    const tables = ['voice_comments', 'video_likes', 'video_bookmarks', 'video_views'];
    for (const table of tables) {
        const { data, count, error } = await s.from(table).select('*', { count: 'exact', head: true }).eq('video_id', videoId);
        if (error) {
            console.log(`Error checking table ${table}: ${error.message}`);
        } else {
            console.log(`Table ${table} has ${count} related records.`);
        }
    }

    const { data, error } = await s.from('videos').delete().eq('id', videoId).select();
    if (error) {
        console.log('DELETE FAILED:', error.message, error.code, error.details);
    } else {
        console.log('DELETE SUCCESS:', data);
    }
}
test();
