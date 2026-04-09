import { createClient } from '@supabase/supabase-js';

const url = 'https://obdrsqeueivhnbsibhen.supabase.co';
const keys = [
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZHJzcWV1ZWl2aG5ic2liaGVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc1MTgxOSwiZXhwIjoyMDg3MzI3ODE5fQ.NhKLeKDwtOD772I520x2eb-C3hgOMtSU3_VCDfgf5bg', // Capital I
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZHJzcWV1ZWl2aG5ic2liaGVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc1MTgxOSwiZXhwIjoyMDg3MzI3ODE5fQ.NhKLeKDwtOD772l520x2eb-C3hgOMtSU3_VCDfgf5bg'  // Lowercase l
];

async function test() {
    for (let i = 0; i < keys.length; i++) {
        console.log(`Testing Key ${i + 1}...`);
        const s = createClient(url, keys[i]);
        const { data, error, count } = await s.from('app_users').select('*', { count: 'exact' });
        if (error) {
            console.error(`Key ${i + 1} FAILED:`, error.message);
        } else {
            console.log(`Key ${i + 1} SUCCESS! Found ${count} users.`);
            console.log('Sample data:', JSON.stringify(data.map(u => ({ handle: u.handle, name: u.name })), null, 2));
        }
    }
}

test();
