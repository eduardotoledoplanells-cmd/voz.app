require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkVideos() {
    console.log('Using URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

    const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching videos:', error);
        return;
    }

    console.log('--- Last 5 videos ---');
    data.forEach(v => {
        console.log(`ID: ${v.id}, User: ${v.user_handle}, Description: "${v.description}", Created: ${v.created_at}`);
    });
}

checkVideos();
