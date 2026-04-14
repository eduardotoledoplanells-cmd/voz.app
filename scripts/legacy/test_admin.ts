import { supabaseAdmin } from './src/lib/db';

async function testAdmin() {
    console.log("Testing supabaseAdmin...");
    const { data, error } = await supabaseAdmin.from('app_users').select('count', { count: 'exact', head: true });
    if (error) {
        console.error("Admin test failed:", error.message);
    } else {
        console.log("Admin test SUCCESS! Count:", data);
    }
}

testAdmin();
