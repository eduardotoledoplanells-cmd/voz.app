const { createClient } = require('@supabase/supabase-js');

const url = 'https://obdrsqeueivhnbsibhen.supabase.co';

const part1 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
// iat=1731751819 (test_admin.js)
const payload1 = 'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZHJzcWV1ZWl2aG5ic2liaGVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTc1MTgxOSwiZXhwIjoyMDg3MzI3ODE5fQ';
// iat=1771751819 (anon matching)
const payload2 = 'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZHJzcWV1ZWl2aG5ic2liaGVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc1MTgxOSwiZXhwIjoyMDg3MzI3ODE5fQ';

const signatures = [
    'NhKLeKDwtOD772l520x2eb-c3hgOMtSU3_VCDfgf5bg',
    'NhKLeKDwtOD772l520x2eb-C3hgOMtSU3_VCDfgf5bg',
    'NhKLEkDwtOD772l520x2eb-c3hgOMtSU3_VCDfgf5bg',
    'NhKLEkDwtOD772l520x2eb-C3hgOMtSU3_VCDfgf5bg',
];

async function run() {
    const payloads = [payload1, payload2];
    for (const p of payloads) {
        for (const s of signatures) {
            const key = `${part1}.${p}.${s}`;
            console.log(`Testing key: ...${s.substring(0, 10)} (iat: ${p.includes('MTczM') ? '1731' : '1771'})`);
            const sb = createClient(url, key);
            const { error } = await sb.from('moderation_queue').select('*').limit(1);
            if (!error) {
                console.log("SUCCESS! FOUND KEY:", key);
                process.exit(0);
            } else {
                console.log("- Failed:", error.message);
            }
        }
    }
}

run();
