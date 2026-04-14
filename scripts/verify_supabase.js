const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function verify() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log("--- Supabase Verification ---");
    console.log("URL:", url);
    console.log("Anon Key Present:", !!anonKey);
    console.log("Service Key Present:", !!serviceKey);

    if (!url || !anonKey) {
        console.error("CRITICAL: Missing credentials in .env.local");
        process.exit(1);
    }

    const supabase = createClient(url, anonKey);
    const supabaseAdmin = serviceKey ? createClient(url, serviceKey) : null;

    try {
        // 1. Test Anon Connectivity
        console.log("\n1. Testing Anon connection (read app_users)...");
        const { data: users, error: userError } = await supabase.from('app_users').select('id').limit(1);
        if (userError) throw userError;
        console.log("✅ Success: Anon can read app_users");

        // 2. Test Admin Connectivity
        if (supabaseAdmin) {
            console.log("\n2. Testing Admin connection (read moderation_queue)...");
            const { data: mod, error: modError } = await supabaseAdmin.from('moderation_queue').select('id').limit(1);
            if (modError) throw modError;
            console.log("✅ Success: Admin can read moderation_queue");
        } else {
            console.warn("\n⚠️ Skip: Service Key missing, couldn't test admin connection.");
        }

        console.log("\n✨ Supabase Configuration Verified Successfully ✨");
    } catch (err) {
        console.error("\n❌ Verification Failed:", err.message);
        process.exit(1);
    }
}

verify();
