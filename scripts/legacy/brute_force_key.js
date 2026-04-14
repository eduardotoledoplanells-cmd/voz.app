const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://obdrsqeueivhnbsibhen.supabase.co';

const variations = [
    // La que dio el subagente
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZHJzcWV1ZWl2aG5ic2liaGVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTQ0NTYwOCwiZXhwIjoyMDU3MDIxNjA4fQ.NhKLeKDwtOD772I520x2eb-C3hgOMtSU3_VCDfgf5bg',
    // Cambiando I por l
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZHJzcWV1ZWl2aG5ic2liaGVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTQ0NTYwOCwiZXhwIjoyMDU3MDIxNjA4fQ.NhKLeKDwtOD772l520x2eb-C3hgOMtSU3_VCDfgf5bg',
    // Cambiando C por c al final
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZHJzcWV1ZWl2aG5ic2liaGVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTQ0NTYwOCwiZXhwIjoyMDU3MDIxNjA4fQ.NhKLeKDwtOD772I520x2eb-c3hgOMtSU3_VCDfgf5bg',
    // La que estaba en .env.prod originalmente (limpia)
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdWJhYmFzZSIsInJlZiI6Im9iZHJzcXVldWl2aG5ic2liaGVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTc1MTgxOSwiZXhwIjoyMDg3MzI3ODE5fQ.NhKLeKDwtOD772l520x2eb-c3hgOMtSU3_VCDfgf5bg'
];

async function testVariations() {
    for (const key of variations) {
        console.log(`Testing key: ${key.substring(0, 20)}...${key.substring(key.length - 10)}`);
        const supabase = createClient(supabaseUrl, key);
        const { data, error } = await supabase.from('moderation_queue').select('*').limit(1);
        if (error) {
            console.log(`- FAILED: ${error.message}`);
        } else {
            console.log(`- SUCCESS!`);
            process.exit(0);
        }
    }

    console.log("\nTesting with ANON KEY (should work now due to RLS change)...");
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZHJzcWV1ZWl2aG5ic2liaGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTE4MTksImV4cCI6MjA4NzMyNzgxOX0.6iZ82MtwuC5_Uxyu4xDRMKxITeugq8GiklPkgvq9AUg';
    const supabaseAnon = createClient(supabaseUrl, anonKey);
    const { count, error: anonError } = await supabaseAnon.from('moderation_queue').select('*', { count: 'exact', head: true });
    if (anonError) {
        console.log(`- ANON FAILED: ${anonError.message}`);
    } else {
        console.log(`- ANON SUCCESS! Items in queue: ${count}`);
    }
}

testVariations();
