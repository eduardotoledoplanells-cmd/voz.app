const SUPABASE_URL = 'https://thiftwzubmvcrdhuwcwm.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoaWZ0d3p1Ym12Y3JkaHV3Y3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTExMjE3MiwiZXhwIjoyMDk0Njg4MTcyfQ.otwtK4a9g6Nf4DON1QCkoERKueQ8YcbrCaS9Tv0xhC4';

async function listRPCs() {
    console.log("🔍 Fetching database RPC functions...");
    
    // We can query the RPC metadata by listing functions from pg_catalog or using standard PostgREST queries
    // Since service_role bypasses RLS, we can read directly from pg_catalog if exposed, or check commonly named RPCs.
    // In Supabase, pg_catalog is usually not exposed via REST. Let's try to query pg_proc via a RPC or check if there is an exec RPC.
    
    // Let's test calling some common RPC names to see if they exist (404 = doesn't exist, 400/401/200 = exists but arg mismatch)
    const testFuncs = [
        'exec_sql',
        'exec_sql_admin',
        'execute_sql',
        'run_sql',
        'query_sql',
        'sql',
        'voz_exec_ddl'
    ];

    for (const f of testFuncs) {
        const url = `${SUPABASE_URL}/rest/v1/rpc/${f}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'apikey': SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sql: 'SELECT 1', query: 'SELECT 1', ddl_statement: 'SELECT 1' })
        });
        
        console.log(`RPC '${f}': HTTP ${res.status}`);
        if (res.status !== 404) {
            const text = await res.text();
            console.log(`   -> Potential match! Response: ${text.substring(0, 150)}`);
        }
    }
}

listRPCs().catch(console.error);
