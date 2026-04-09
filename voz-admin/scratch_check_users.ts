import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Try to find .env file
dotenv.config({ path: path.resolve(process.cwd(), 'VOZ/server/voz-admin/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://obdrsqeueivhnbsibhen.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    console.error("SUPABASE_SERVICE_ROLE_KEY is missing");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUsers() {
    const { data: users, error } = await supabase.from('app_users').select('*');
    if (error) {
        console.error("Error fetching users:", error);
        return;
    }
    console.log("Total users in app_users table:", users.length);
    console.log("Users:", JSON.stringify(users, null, 2));

    // Also check auth.users to see if there's a mismatch
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.error("Error fetching auth users:", authError);
    } else {
        console.log("Total users in auth.users:", authUsers.users.length);
        console.log("Auth Users handles:", authUsers.users.map(u => u.user_metadata?.handle || u.email));
    }
}

checkUsers();
