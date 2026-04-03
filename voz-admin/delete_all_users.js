const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://obdrsqeueivhnbsibhen.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9idHJzcWV1ZWl2aG5iaWJocWUiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzM1MTgxOSwiZXhwIjoyMDgzMzI3ODE1fQ.NhKLEkDwtOD772l520x2eb-C3hgOMtSU3_VCDfgf5bg';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function deleteAllUsers() {
    console.log("Fetching users from auth.users...");
    
    // Fetch all users from auth
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
        console.error("Error fetching users:", listError.message);
        return;
    }

    const users = usersData.users || [];
    console.log(`Found ${users.length} users in auth.users.`);

    for (const user of users) {
        // Skip Edu_82 if that's the admin, but user said "borra los usuarios que hay ahora"
        console.log(`Deleting auth user: ${user.email} (${user.id})`);
        const { error: delError } = await supabase.auth.admin.deleteUser(user.id);
        if (delError) {
            console.error(`Error deleting user ${user.email}:`, delError.message);
        } else {
            console.log(`Successfully deleted ${user.email}`);
        }
    }

    console.log("Cleaning up app_users table...");
    const { error: appUsersError } = await supabase.from('app_users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (appUsersError) {
        console.error("Error clearing app_users:", appUsersError.message);
    } else {
        console.log("Successfully cleared app_users table.");
    }

    console.log("All done.");
}

deleteAllUsers();
