import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testBilling() {
    const { data, error } = await supabase.from('app_users').select('wallet_balance, handle');
    if (error) {
        console.error('Error fetching:', error);
        return;
    }

    console.log(`Fetched ${data.length} users.`);
    let sum = 0;
    for (const u of data) {
        let val = parseFloat(u.wallet_balance);
        if (isNaN(val)) {
            console.log('Found NaN for record:', u);
            val = 0;
        }
        sum += val;
    }
    console.log("Total Circulating Coins computed manually:", sum);
}
testBilling();
