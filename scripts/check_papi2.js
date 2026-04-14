const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function checkPapi2() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
        console.error("Missing credentials");
        process.exit(1);
    }

    const supabase = createClient(url, serviceKey);

    console.log("Searching for user 'Papi2'...");
    
    // Search by handle or name
    const { data: users, error } = await supabase
        .from('app_users')
        .select('*')
        .or('handle.ilike.%Papi2%,name.ilike.%Papi2%');

    if (error) {
        console.error("Error searching:", error);
        process.exit(1);
    }

    if (users.length > 0) {
        console.log("✅ Found Papi2!");
        users.forEach(u => {
            console.log(`- ID: ${u.id}, Handle: ${u.handle}, Name: ${u.name}, Status: ${u.status}`);
        });
    } else {
        console.log("❌ User 'Papi2' not found in this database.");
    }
}

checkPapi2();
