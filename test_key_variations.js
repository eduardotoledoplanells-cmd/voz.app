const { createClient } = require('@supabase/supabase-js');

const url = 'https://obdrsqeueivhnbsibhen.supabase.co';
const basePart1 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
const basePart2 = 'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZHJzcWV1ZWl2aG5ic2liaGVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTc1MTgxOSwiZXhwIjoyMDg3MzI3ODE5fQ';

// Base signature based on what works usually
const sigBase = 'NhKLeKDwtOD772'; // fixed start
const sigMid = ['l', 'I'];
const sigEnd = '520x2eb-';
const sigChar = ['c', 'C'];
const sigFinish = '3hgOMtSU3_VCDfgf5bg';

async function test() {
    for (const m of sigMid) {
        for (const c of sigChar) {
            const key = `${basePart1}.${basePart2}.${sigBase}${m}${sigEnd}${c}${sigFinish}`;
            console.log(`Testing key with mid=${m}, char=${c}: ${key.substring(key.length - 30)}`);
            const supabase = createClient(url, key);
            const { data, error } = await supabase.from('moderation_queue').select('*').limit(1);
            if (!error) {
                console.log("SUCCESS found key:", key);
                process.exit(0);
            } else {
                console.log("- Failed:", error.message);
            }
        }
    }
}

test();
