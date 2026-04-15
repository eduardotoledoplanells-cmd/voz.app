const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://obdrsqeueivhnbsibhen.supabase.co";
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZHJzcWV1ZWl2aG5ic2liaGVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc1MTgxOSwiZXhwIjoyMDg3MzI3ODE5fQ.NhKLeKDwtOD772I520x2eb-C3hgOMtSU3_VCDfgf5bg";

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function test() {
    console.log("Checking notifications table...");
    const { data, error, count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true });
    
    if (error) {
        console.error("Error accessing notifications table:", error.message);
    } else {
        console.log("Notifications table exists. Total rows:", count);
        
        // Check for recent notifications for @eduardo_82 or eduardo_82
        const { data: recents } = await supabase
            .from('notifications')
            .select('*')
            .or('recipient_id.eq.eduardo_82,recipient_id.eq.@eduardo_82')
            .limit(5);
        
        console.log("Recent notifications for user:", recents);
    }
}

test();
