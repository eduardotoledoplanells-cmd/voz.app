import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.production') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function testExistence() {
    console.log("Checking get_antigravity_feed RPC...");
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_antigravity_feed', { req_limit: 1, req_offset: 0 });
    if (rpcError) {
        console.log("get_antigravity_feed RPC does NOT exist yet. Error:", rpcError.message);
    } else {
        console.log("get_antigravity_feed RPC exists!");
    }

    console.log("Checking pm_messages table...");
    const { data: tableData, error: tableError } = await supabase.from('pm_messages').select('*').limit(1);
    if (tableError) {
        console.log("pm_messages table does NOT exist yet. Error:", tableError.message);
    } else {
        console.log("pm_messages table exists!");
    }
}

testExistence();
