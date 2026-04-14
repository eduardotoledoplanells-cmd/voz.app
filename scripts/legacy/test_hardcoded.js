const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://obdrsqeueivhnbsibhen.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZHJzcWV1ZWl2aG5ic2liaGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTE4MTksImV4cCI6MjA4NzMyNzgxOX0.6iZ82MtwuC5_Uxyu4xDRMKxITeugq8GiklPkgvq9AUg';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdWJhYmFzZSIsInJlZiI6Im9iZHJzcXVldWl2aG5ic2liaGVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTc1MTgxOSwiZXhwIjoyMDg3MzI3ODE5fQ.NhKLeKDwtOD772l520x2eb-c3hgOMtSU3_VCDfgf5bg';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function test() {
    console.log("Testing with hardcoded Service Role Key...");
    const { data, error } = await supabase.from('moderation_queue').select('*').limit(1);
    if (error) {
        console.error("Error with Service Role Key:", error.message);
    } else {
        console.log("Success with Service Role Key!");
    }

    const supabaseAnon = createClient(supabaseUrl, anonKey);
    console.log("\nTesting with hardcoded Anon Key...");
    const { error: anonError } = await supabaseAnon.from('moderation_queue').select('*').limit(1);
    if (anonError) {
        console.error("Error with Anon Key:", anonError.message);
    } else {
        console.log("Success with Anon Key!");
    }
}

test();
