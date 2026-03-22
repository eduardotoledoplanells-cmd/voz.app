const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function run() {
    console.log("Fetching app_users...");
    const { data: appUsers, error: appErr } = await supabaseAdmin.from('app_users').select('id, email, handle');
    if (appErr) console.error("App Err:", appErr);
    console.log("App Users:", appUsers);
    
    console.log("\nFetching auth.users...");
    const { data: authUsers, error: authErr } = await supabaseAdmin.auth.admin.listUsers();
    console.log("Auth Users:", authUsers?.users?.map(u => ({ id: u.id, email: u.email })));
}
run();
