const { createClient } = require('@supabase/supabase-js');
const url = 'https://obdrsqeueivhnbsibhen.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZHJzcWV1ZWl2aG5ic2liaGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTE4MTksImV4cCI6MjA4NzMyNzgxOX0.6iZ82MtwuC5_Uxyu4xDRMKxITeugq8GiklPkgvq9AUg';
const fs = require('fs');

async function dump() {
    const s = createClient(url, anonKey);
    const { data: videos } = await s.from('videos').select('*');
    const { data: users } = await s.from('app_users').select('*');
    const { data: storageVideos } = await s.storage.from('media').list('videos');
    const { data: storageThumbnails } = await s.storage.from('media').list('thumbnails');

    fs.writeFileSync('DUMP_DB.json', JSON.stringify({
        videos,
        users,
        storageVideos,
        storageThumbnails
    }, null, 2));
    console.log('DONE');
}
dump();
