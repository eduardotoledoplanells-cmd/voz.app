const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const url = 'https://thiftwzubmvcrdhuwcwm.supabase.co';
const serviceRole = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoaWZ0d3p1Ym12Y3JkaHV3Y3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTExMjE3MiwiZXhwIjoyMDk0Njg4MTcyfQ.otwtK4a9g6Nf4DON1QCkoERKueQ8YcbrCaS9Tv0xhC4';
const supabase = createClient(url, serviceRole, { auth: { persistSession: false } });

const sql = fs.readFileSync('migration_geotargeting.sql', 'utf8');

(async () => {
  console.log('Running Geotargeting SQL migration on production database...');
  const { data, error } = await supabase.rpc('exec_sql_admin', { sql });
  if (error) {
    console.error('❌ RPC Error executing migration:', error);
  } else {
    console.log('✅ Geotargeting migration executed successfully! Result:', data);
  }
})();
