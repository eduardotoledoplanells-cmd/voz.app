import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://obdrsqeueivhnbsibhen.supabase.co';
// Using the key found in test_hardcoded_final.js
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZHJzcWV1ZWl2aG5ic2liaGVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc1MTgxOSwiZXhwIjoyMDg3MzI3ODE5fQ.NhKLeKDwtOD772l520x2eb-C3hgOMtSU3_VCDfgf5bg';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUsers() {
    console.log("Fetching users from 'app_users'...");
    const { data: users, error } = await supabase.from('app_users').select('*');
    if (error) {
        console.error("Error fetching users:", error);
        return;
    }
    console.log("Total users in app_users table:", users.length);
    console.log("Users:", JSON.stringify(users, null, 2));

    console.log("\nListing users from Auth...");
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.error("Error fetching auth users:", authError);
    } else {
        console.log("Total users in auth.users:", authUsers.users.length);
        const simplifiedAuth = authUsers.users.map(u => ({
            id: u.id,
            email: u.email,
            handle: u.user_metadata?.handle,
            name: u.user_metadata?.name
        }));
        console.log("Auth Users:", JSON.stringify(simplifiedAuth, null, 2));
    }
}

checkUsers();
