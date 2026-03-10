const { createClient } = require('@supabase/supabase-js');
const url = 'https://obdrsqeueivhnbsibhen.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZHJzcWV1ZWl2aG5ic2liaGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTE4MTksImV4cCI6MjA4NzMyNzgxOX0.6iZ82MtwuC5_Uxyu4xDRMKxITeugq8GiklPkgvq9AUg';

async function testAddVideo() {
    const s = createClient(url, anonKey);
    console.log('Adding a test video...');
    const { data, error } = await s.from('videos').insert([{
        video_url: 'test_recovery_' + Date.now() + '.mp4',
        user_handle: '@Edu82',
        description: 'Recovery test video',
        likes: 123,
        views: 1000
    }]).select();

    if (error) console.error('Error adding video:', error.message);
    else console.log('Successfully added video:', data);
}
testAddVideo();
