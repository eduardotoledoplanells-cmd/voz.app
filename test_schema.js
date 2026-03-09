require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkSchema() {
    console.log("Fetching a single user to inspect columns...");
    const { data, error } = await supabase.from('app_users').select('*').limit(1);
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("User Row:", data[0]);
        console.log("Columns Available:", Object.keys(data[0] || {}));
    }
}
checkSchema();
