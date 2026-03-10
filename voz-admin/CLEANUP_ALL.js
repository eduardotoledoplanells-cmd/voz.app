const { createClient } = require('@supabase/supabase-js');
const url = 'https://obdrsqeueivhnbsibhen.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZHJzcWV1ZWl2aG5ic2liaGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTE4MTksImV4cCI6MjA4NzMyNzgxOX0.6iZ82MtwuC5_Uxyu4xDRMKxITeugq8GiklPkgvq9AUg';

async function cleanup() {
    const s = createClient(url, anonKey);
    console.log("Cleaning up all video-related traces...");

    // 1. Delete all videos
    const { error: vErr } = await s.from('videos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log("Videos deleted:", vErr ? vErr.message : "Success");

    // 2. Delete all other users except @Edu_82
    const { error: uErr } = await s.from('app_users').delete().neq('handle', '@Edu_82');
    console.log("Other users deleted:", uErr ? uErr.message : "Success");

    // 3. Clear moderation queue
    const { error: mErr } = await s.from('moderation_queue').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log("Moderation queue cleared:", mErr ? mErr.message : "Success");

    // 4. Clear other related tables
    await s.from('video_likes').delete().neq('id', 0);
    await s.from('video_bookmarks').delete().neq('id', 0);
    await s.from('video_views').delete().neq('id', 0);
    // await s.from('voice_comments').delete().neq('id', '0'); // Keep comments for reference? No, user says "everything"
    await s.from('voice_comments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await s.from('user_follows').delete().neq('id', 0);

    // 5. Delete all storage files
    const { data: vFiles } = await s.storage.from('media').list('videos');
    if (vFiles && vFiles.length > 0) {
        const fileNames = vFiles.map(f => `videos/${f.name}`);
        const { error: svErr } = await s.storage.from('media').remove(fileNames);
        console.log("Stored videos deleted:", svErr ? svErr.message : "Success");
    }

    const { data: tFiles } = await s.storage.from('media').list('thumbnails');
    if (tFiles && tFiles.length > 0) {
        const fileNames = tFiles.map(f => `thumbnails/${f.name}`);
        const { error: stErr } = await s.storage.from('media').remove(fileNames);
        console.log("Stored thumbnails deleted:", stErr ? stErr.message : "Success");
    }

    console.log("CLEANUP DONE.");
}
cleanup();
