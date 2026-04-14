require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function migrate() {
    console.log('Migrating database...');
    
    // 1. Add strikes column
    const { error: errorAdd } = await supabase.rpc('execute_sql', {
        query: 'ALTER TABLE app_users ADD COLUMN IF NOT EXISTS strikes INTEGER DEFAULT 0;'
    });
    
    if (errorAdd) {
        console.warn('RPC execute_sql failed (expected if not defined). Trying direct query if possible...');
        // If RPC isn't defined, we might need to do it via a different way or ask the user to run it in the SQL Editor.
        // But since this is a critical part, I will try to use a dummy update to see if I can at least verify the schema later.
    }

    // 2. Remove reputation (optional)
    const { error: errorDrop } = await supabase.rpc('execute_sql', {
        query: 'ALTER TABLE app_users DROP COLUMN IF EXISTS reputation;'
    });

    if (errorAdd || errorDrop) {
        console.error('Migration failed. You may need to run this SQL in the Supabase Dashboard SQL Editor:');
        console.log('ALTER TABLE app_users ADD COLUMN IF NOT EXISTS strikes INTEGER DEFAULT 0;');
        console.log('ALTER TABLE app_users DROP COLUMN IF EXISTS reputation;');
    } else {
        console.log('Migration successful!');
    }
}

migrate();
