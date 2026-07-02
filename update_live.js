require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    try {
        const { data, error } = await supabase
            .from('app_users')
            .update({ is_live: true, live_url: 'https://kick.com/grafo' })
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all valid users (basically just the user)
            
        if (error) throw error;
        console.log(`Updated user to live status pointing to kick.com/grafo`);
    } catch (e) {
        console.error(e);
    }
}
run();
