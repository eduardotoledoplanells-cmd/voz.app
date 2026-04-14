require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function addCoins() {
    const { data: users, error: fetchErr } = await supabase.from('app_users').select('*');
    if (fetchErr || !users.length) {
        console.error("No users found.", fetchErr);
        return;
    }

    const testUser = users[0];
    const newBalance = (testUser.wallet_balance || 0) + 1500;

    console.log(`Adding 1500 coins to user ${testUser.handle}...`);

    const { data: updated, error } = await supabase
        .from('app_users')
        .update({ wallet_balance: newBalance })
        .eq('id', testUser.id)
        .select();

    if (error) {
        console.error("Error updating config:", error);
    } else {
        console.log("Success! Updated user:", updated[0].handle, updated[0].wallet_balance);
    }
}

addCoins();
