const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const SUPABASE_URL = 'https://thiftwzubmvcrdhuwcwm.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoaWZ0d3p1Ym12Y3JkaHV3Y3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTExMjE3MiwiZXhwIjoyMDk0Njg4MTcyfQ.otwtK4a9g6Nf4DON1QCkoERKueQ8YcbrCaS9Tv0xhC4';

const newPlainPassword = 'admin'; // We will set the password to "admin" for simplicity and easy access.

async function run() {
    console.log(`🔑 Generating bcrypt hash for password: "${newPlainPassword}"...`);
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPlainPassword, salt);
    console.log(`Generated Hash: ${hash}`);

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { persistSession: false }
    });

    console.log("📡 Connecting to Supabase database...");
    
    // Update admin
    console.log("Updating admin password...");
    const { data: d1, error: e1 } = await supabase
        .from('employees')
        .update({ password: hash })
        .eq('username', 'admin');
    
    if (e1) {
        console.error("❌ Error updating admin:", e1.message);
    } else {
        console.log("✅ admin password updated successfully!");
    }

    // Update admin_rober
    console.log("Updating admin_rober password...");
    const { data: d2, error: e2 } = await supabase
        .from('employees')
        .update({ password: hash })
        .eq('username', 'admin_rober');

    if (e2) {
        console.error("❌ Error updating admin_rober:", e2.message);
    } else {
        console.log("✅ admin_rober password updated successfully!");
    }

    console.log("\n🎉 Done! You can now log into both accounts using the password: \"admin\"");
}

run().catch(console.error);
