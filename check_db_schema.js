const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://thiftwzubmvcrdhuwcwm.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoaWZ0d3p1Ym12Y3JkaHV3Y3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTExMjE3MiwiZXhwIjoyMDk0Njg4MTcyfQ.otwtK4a9g6Nf4DON1QCkoERKueQ8YcbrCaS9Tv0xhC4';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
});

async function run() {
    try {
        console.log("Fetching schema info...");
        // Let's query information_schema.tables to see what tables exist
        const { data, error } = await supabase
            .from('app_users')
            .select('*')
            .limit(1);
        
        console.log("Successfully queried app_users. Error if any:", error);
        console.log("Sample user:", data);
        
        // Let's check if countries exists
        const { data: cData, error: cError } = await supabase
            .from('countries')
            .select('*')
            .limit(1);
        console.log("Queried countries. Error:", cError ? cError.message : "None", "Data:", cData);
    } catch (e) {
        console.error("Exception:", e);
    }
}

run();
