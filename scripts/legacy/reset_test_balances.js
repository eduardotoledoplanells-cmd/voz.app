require('dotenv').config({ path: '.env.prod' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://obdrsqeueivhnbsibhen.supabase.co';
const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const isValidEnvKey = envKey.startsWith('eyJ') && !envKey.includes('M81T8_3');
const supabaseAnonKey = isValidEnvKey ? envKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZHJzcWV1ZWl2aG5ic2liaGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTE4MTksImV4cCI6MjA4NzMyNzgxOX0.6iZ82MtwuC5_Uxyu4xDRMKxITeugq8GiklPkgvq9AUg';

const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey);

async function reset() {
    console.log("Fetching users...");
    const { data: users, error: uErr } = await supabaseAdmin.from('app_users').select('*');
    if (uErr) return console.error(uErr);

    console.log(`Found ${users.length} users. Resetting balances to 0...`);
    for (const u of users) {
        if (parseFloat(u.wallet_balance) > 0) {
            console.log(`Resetting ${u.handle} (had ${u.wallet_balance})`);
            await supabaseAdmin.from('app_users').update({ wallet_balance: 0 }).eq('id', u.id);
        }
    }

    console.log("Deleting test transactions...");
    await supabaseAdmin.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    console.log("Deleting test coin sales...");
    await supabaseAdmin.from('coin_sales').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    console.log("Done!");
}

reset();
