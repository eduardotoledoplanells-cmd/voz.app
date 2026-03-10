const { createClient } = require('@supabase/supabase-js');
const url = 'https://obdrsqeueivhnbsibhen.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZHJzcWV1ZWl2aG5ic2liaGVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTQ0NTYwOCwiZXhwIjoyMDU3MDIxNjA4fQ.NhKLeKDwtOD772l520x2eb-C3hgOMtSU3_VCDfgf5bg';

async function test() {
    console.log('Testing Key...');
    const s = createClient(url, key);
    const { data, error } = await s.from('videos').select('id').limit(1);
    if (error) {
        console.error('FAILED:', error.message);
    } else {
        console.log('SUCCESS: Access granted with Service Role Key');
    }
}
test();
