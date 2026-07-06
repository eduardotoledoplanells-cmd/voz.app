require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://thiftwzubmvcrdhuwcwm.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.log('Missing supabase config');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLocations() {
    try {
        const { data: users, error: err1 } = await supabase.from('app_users').select('id, handle').limit(5);
        console.log('app_users check:', users, 'Error:', err1);
    } catch (e) {
        console.error(e);
    }
}

checkLocations();
