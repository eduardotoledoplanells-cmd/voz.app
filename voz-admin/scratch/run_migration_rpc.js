const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://thiftwzubmvcrdhuwcwm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoaWZ0d3p1Ym12Y3JkaHV3Y3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTExMjE3MiwiZXhwIjoyMDk0Njg4MTcyfQ.otwtK4a9g6Nf4DON1QCkoERKueQ8YcbrCaS9Tv0xhC4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runRpcMigration() {
    console.log('Running migration via execute_sql RPC...');
    const query = `
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS totp_secret TEXT;
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT FALSE;
    `;
    
    try {
        const { data, error } = await supabase.rpc('exec_sql_admin', { sql: query });
        if (error) {
            console.error('❌ RPC Migration failed:', error);
        } else {
            console.log('✅ RPC Migration succeeded:', data);
        }
    } catch (e) {
        console.error('❌ Exception in RPC Migration:', e);
    }
}

runRpcMigration();
