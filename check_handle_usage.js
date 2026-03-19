
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://obdrsqeueivhnbsibhen.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZHJzcWV1ZWl2aG5ic2liaGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTE4MTksImV4cCI6MjA4NzMyNzgxOX0.6iZ82MtwuC5_Uxyu4xDRMKxITeugq8GiklPkgvq9AUg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const handle = '@Edu_82';
    const tables = [
        { name: 'videos', col: 'user_handle' },
        { name: 'voice_comments', col: 'user_handle' },
        { name: 'user_follows', col: 'follower_handle' },
        { name: 'user_follows', col: 'following_handle' },
        { name: 'video_likes', col: 'user_handle' },
        { name: 'video_bookmarks', col: 'user_handle' },
        { name: 'video_views', col: 'user_handle' },
        { name: 'voice_comment_likes', col: 'user_handle' },
        { name: 'moderation_queue', col: 'user_handle' },
        { name: 'moderation_queue', col: 'reported_by' },
        { name: 'transactions', col: 'sender_handle' },
        { name: 'transactions', col: 'receiver_handle' },
        { name: 'coin_sales', col: 'user_handle' }
    ];

    for (const t of tables) {
        const { count, error } = await supabase.from(t.name).select('*', { count: 'exact', head: true }).eq(t.col, handle);
        if (!error) {
            console.log(`${t.name}.${t.col}: ${count} rows`);
        } else {
            console.log(`${t.name}.${t.col}: skipped (error or missing)`);
        }
    }
}
check();
