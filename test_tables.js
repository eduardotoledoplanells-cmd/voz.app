require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function listTables() {
    // We can query the information_schema to get all tables
    const { data, error } = await supabase.rpc('get_tables');
    // Fallback if rpc is not defined: perform a generic query (but Supabase JS client doesn't expose list tables easily without RPC or service role)
    // Let's at least check records in 'profiles' or 'users' if they exist

    // Instead of querying information schema via JS client (limited by REST permissions), 
    // let's just attempt to see if there is another obvious table based on common patterns:
    const tablesToCheck = ['users', 'profiles', 'wallets', 'user_balances', 'balances'];
    for (const t of tablesToCheck) {
        const { error } = await supabase.from(t).select('id').limit(1);
        if (!error) console.log(`Table exists: ${t}`);
    }
}
listTables();
