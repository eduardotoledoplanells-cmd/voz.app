require('dotenv').config({ path: '.env.prod' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("Config detected:");
console.log("- URL:", supabaseUrl);
console.log("- Service Role Key defined:", !!serviceRoleKey);

// Fallback logic similar to src/lib/db.ts
const supabaseAdmin = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : createClient(supabaseUrl, supabaseAnonKey);

async function testAdmin() {
    console.log("\nTesting admin access (using anon fallback if service key is empty)...");
    const { data, error, count } = await supabaseAdmin.from('moderation_queue').select('*', { count: 'exact' });

    if (error) {
        console.error("Critical Error:", error.message);
    } else {
        console.log("Success! Access granted.");
        console.log("Items in moderation queue:", count);
    }
}

testAdmin();
