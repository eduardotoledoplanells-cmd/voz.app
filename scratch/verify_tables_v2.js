const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://obdrsqeueivhnbsibhen.supabase.co";
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZHJzcWV1ZWl2aG5ic2liaGVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc1MTgxOSwiZXhwIjoyMDg3MzI3ODE5fQ.NhKLeKDwtOD772I520x2eb-C3hgOMtSU3_VCDfgf5bg";

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function test() {
    console.log("Listing all tables in public schema...");
    const { data, error } = await supabase
        .rpc('get_tables'); // This might not exist, fallback to information_schema
    
    if (error) {
        // Fallback to information_schema via query if possible, but select from a known table first
        console.log("RPC get_tables not available, trying to select from information_schema...");
        const { data: tables, error: tableError } = await supabase
            .from('app_users')
            .select('count', { count: 'exact', head: true });
        
        if (tableError) {
            console.error("Critical error connecting to Supabase:", tableError.message);
        } else {
            console.log("Successfully connected to Supabase. app_users exists.");
            
            // Try to see if notifications exists by selecting 1 row
            const { data: notifData, error: notifError } = await supabase
                .from('notifications')
                .select('*')
                .limit(1);
            
            if (notifError) {
                console.error("Notifications table error:", notifError.message);
            } else {
                console.log("Notifications table exists!");
            }
        }
    }
}

test();
