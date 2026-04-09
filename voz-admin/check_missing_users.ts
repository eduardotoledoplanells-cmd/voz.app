import { createClient } from '@supabase/supabase-js';

const url = 'https://obdrsqeueivhnbsibhen.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZHJzcWV1ZWl2aG5ic2liaGVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc1MTgxOSwiZXhwIjoyMDg3MzI3ODE5fQ.NhKLeKDwtOD772I520x2eb-C3hgOMtSU3_VCDfgf5bg';

const supabase = createClient(url, key);

async function check() {
    console.log("Checking DB app_users table...");
    const { data: dbUsers } = await supabase.from('app_users').select('*');
    console.log(`DB Users (${dbUsers?.length || 0}):`, JSON.stringify(dbUsers, null, 2));

    console.log("\nChecking Auth users...");
    const { data: authUsers, error: authErr } = await supabase.auth.admin.listUsers();
    if (authErr) {
        console.error("Auth Error:", authErr.message);
    } else {
        console.log(`Auth Users (${authUsers.users.length}):`, JSON.stringify(authUsers.users.map(u => ({ id: u.id, email: u.email, handle: u.user_metadata?.handle })), null, 2));
    }
}

check();
