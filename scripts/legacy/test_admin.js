const { createClient } = require('@supabase/supabase-js');

const url1 = 'https://obdrsqeueivhnbsibhen.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZHJzcWV1ZWl2aG5ic2liaGVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTc1MTgxOSwiZXhwIjoyMDg3MzI3ODE5fQ.NhKLeKDwtOD772l520x2eb-c3hgOMtSU3_VCDfgf5bg';

async function check() {
    console.log("Testing insert with Correct Service Role Key...");
    try {
        const sbAdmin = createClient(url1, serviceRoleKey);
        const { data, error } = await sbAdmin.from('moderation_queue').insert([{
            id: '123e4567-e89b-12d3-a456-426614174001',
            type: 'profile',
            url: 'https://voz.app/profile/test_admin2',
            user_handle: '@test',
            report_reason: 'Testing insertion bypass',
            content: 'Test admin',
            status: 'pending',
            timestamp: new Date().toISOString()
        }]).select();
        console.log('Insert error:', JSON.stringify(error, null, 2));
        console.log('Insert data:', data);
    } catch (e) {
        console.log('Execute error:', e.message);
    }
}

check();
