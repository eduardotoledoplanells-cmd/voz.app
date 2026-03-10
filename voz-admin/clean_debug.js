const { createClient } = require('@supabase/supabase-js');
const url = 'https://obdrsqeueivhnbsibhen.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZHJzcWV1ZWl2aG5ic2liaGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTE4MTksImV4cCI6MjA4NzMyNzgxOX0.6iZ82MtwuC5_Uxyu4xDRMKxITeugq8GiklPkgvq9AUg';
const fs = require('fs');

async function dump() {
    const s = createClient(url, anonKey);
    const tables = ['videos', 'app_users', 'moderation_queue', 'video_likes', 'video_bookmarks', 'video_views', 'voice_comments', 'user_follows'];
    const results = {};
    for (const table of tables) {
        const { data } = await s.from(table).select('*');
        results[table] = data || [];
    }
    fs.writeFileSync('CLEAN_DEBUG.json', JSON.stringify(results, null, 2));
    console.log('DONE');
}
dump();
