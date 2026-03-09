const { createClient } = require('@supabase/supabase-js');

// Project 1: obdrsqeueivhnbsibhen
const url1 = 'https://obdrsqeueivhnbsibhen.supabase.co';
const key1 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdWJhYmFzZSIsInJlZiI6Im9iZHJzcXVldWl2aG5ic2liaGVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTc1MTgxOSwiZXhwIjoyMDg3MzI3ODE5fQ.NhKLeKDwtOD772l520x2eb-c3hgOMtSU3_VCDfgf5bg';

// Project 2: ldynlciyllziehyuybex
const url2 = 'https://ldynlciyllziehyuybex.supabase.co';
const key2 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkeW5sY2l5bGx6aWVoeXV5YmV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg2ODE4NywiZXhwIjoyMDg3NDQ0MTg3fQ.2_T4TOxzyLx8ehZlSL1g2sTAu_urQ-ZixQaKQxSy8-o';

async function check() {
    console.log("Checking Project 1...");
    try {
        const sb1 = createClient(url1, key1);
        const res1 = await sb1.from('moderation_queue').select('*').limit(1);
        console.log('Project 1 result:', res1.error || 'SUCCESS');
    } catch (e) {
        console.log('Project 1 error:', e.message);
    }

    console.log("Checking Project 2...");
    try {
        const sb2 = createClient(url2, key2);
        const res2 = await sb2.from('moderation_queue').select('*').limit(1);
        console.log('Project 2 result:', res2.error || 'SUCCESS');
    } catch (e) {
        console.log('Project 2 error:', e.message);
    }
}

check();
