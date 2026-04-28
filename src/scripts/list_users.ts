
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Manual loading of env vars if needed
dotenv.config({ path: path.resolve(process.cwd(), '.env.production') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function listUsers() {
    const { data, error } = await supabase.from('app_users').select('id, handle, email');
    if (error) {
        console.error('Error fetching users:', error);
    } else {
        console.log('USERS_LIST_START');
        console.log(JSON.stringify(data, null, 2));
        console.log('USERS_LIST_END');
    }
}

listUsers();
