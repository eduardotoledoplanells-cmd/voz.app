require('dotenv').config({ path: 'voz-admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data, error } = await supabase.from('voice_comments').select('*').order('created_at', { ascending: false }).limit(2);
    console.log(JSON.stringify(data, null, 2));
    if (error) console.error(error);
}
run();
