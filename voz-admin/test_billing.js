import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testBilling() {
    const { data, error } = await supabase.from('app_users').select('wallet_balance');
    if (error) {
        console.error('Error fetching:', error);
        return;
    }

    console.log(`Fetched ${data.length} users.`);
    let sum = 0;
    for (const u of data) {
        const val = parseFloat(u.wallet_balance);
        sum += (val || 0);
        if (isNaN(val)) {
            console.log('Found NaN for record:', u);
        }
    }
    console.log("Total Circulating Coins computed manually:", sum);
}
testBilling();
