const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://obdrsqeueivhnbsibhen.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdWJhYmFzZSIsInJlZiI6Im9iZHJzcWV1ZWl2aG5ic2liaGVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc1MTgxOSwiZXhwIjoyMDg3MzI3ODE5fQ.NhKLeKDwtOD772l520x2eb-C3hgOMtSU3_VCDfgf5bg';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function test() {
    console.log("Testing with NEW hardcoded Service Role Key...");
    const { data, error } = await supabase.from('moderation_queue').select('*').limit(1);
    if (error) {
        console.error("Error with Service Role Key:", error.message);
    } else {
        console.log("Success with Service Role Key!");
        console.log("Data sample:", data);
    }
}

test();
