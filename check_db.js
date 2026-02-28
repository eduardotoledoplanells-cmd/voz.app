const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkVideos() {
    const { data: vData, error: vErr } = await supabase.from('videos').select('*');
    if (vErr) console.error("Videos error:", vErr);
    else console.log("Videos count:", vData.length);

    const { data: bData, error: bErr } = await supabase.storage.listBuckets();
    if (bErr) console.error("Buckets error:", bErr);
    else console.log("Buckets:", bData.map(b => b.name));
}

checkVideos();
