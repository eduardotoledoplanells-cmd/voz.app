require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkUsers() {
    const { data, error } = await supabase.from('app_users').select('id, handle, wallet_balance');
    if (error) {
        console.error('Error fetching users:', error);
    } else {
        console.log(`Found ${data.length} users in app_users table.`);
        console.log('Sample data:', data.slice(0, 5));

        const total = data.reduce((acc, u) => acc + (parseFloat(u.wallet_balance) || 0), 0);
        console.log('Calculated Total Wallet Balance:', total);
    }
}

checkUsers();
