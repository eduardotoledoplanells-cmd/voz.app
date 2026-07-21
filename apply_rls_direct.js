// Aplica RLS via Supabase Management API (v1)
// Esta API permite ejecutar SQL arbitrario en el proyecto

const https = require('https');

const PROJECT_REF = 'thiftwzubmvcrdhuwcwm';

// IMPORTANT: We need a Supabase Management API access token (personal token)
// Try using the service role key as a fallback via the pg REST endpoint
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoaWZ0d3p1Ym12Y3JkaHV3Y3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTExMjE3MiwiZXhwIjoyMDk0Njg4MTcyfQ.Hhe5475XMdPvsHuH4GFB6aLxOvBU3r4RhWq4VXMGAJQ';

const SQL_STATEMENTS = [
    "ALTER TABLE IF EXISTS public.app_users ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE IF EXISTS public.videos ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE IF EXISTS public.moderation_queue ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE IF EXISTS public.user_penalties ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE IF EXISTS public.transactions ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE IF EXISTS public.coin_sales ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE IF EXISTS public.employees ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE IF EXISTS public.companies ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE IF EXISTS public.campaigns ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE IF EXISTS public.logs ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE IF EXISTS public.productivity ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE IF EXISTS public.redemptions ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE IF EXISTS public.voice_comments ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE IF EXISTS public.creator_verifications ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE IF EXISTS public.user_follows ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE IF EXISTS public.video_likes ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE IF EXISTS public.video_bookmarks ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE IF EXISTS public.video_views ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE IF EXISTS public.voice_comment_likes ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE IF EXISTS public.banned_emails ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE IF EXISTS public.withdrawal_requests ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE IF EXISTS public.wallets ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE IF EXISTS public.ledger_transactions ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE IF EXISTS public.ledger_entries ENABLE ROW LEVEL SECURITY",
    `DROP POLICY IF EXISTS "service_role_full_access" ON public.app_users`,
    `CREATE POLICY "service_role_full_access" ON public.app_users FOR ALL TO service_role USING (true) WITH CHECK (true)`,
    `DROP POLICY IF EXISTS "service_role_full_access" ON public.videos`,
    `CREATE POLICY "service_role_full_access" ON public.videos FOR ALL TO service_role USING (true) WITH CHECK (true)`,
    `DROP POLICY IF EXISTS "service_role_full_access" ON public.moderation_queue`,
    `CREATE POLICY "service_role_full_access" ON public.moderation_queue FOR ALL TO service_role USING (true) WITH CHECK (true)`,
    `DROP POLICY IF EXISTS "service_role_full_access" ON public.user_penalties`,
    `CREATE POLICY "service_role_full_access" ON public.user_penalties FOR ALL TO service_role USING (true) WITH CHECK (true)`,
    `DROP POLICY IF EXISTS "service_role_full_access" ON public.transactions`,
    `CREATE POLICY "service_role_full_access" ON public.transactions FOR ALL TO service_role USING (true) WITH CHECK (true)`,
    `DROP POLICY IF EXISTS "service_role_full_access" ON public.coin_sales`,
    `CREATE POLICY "service_role_full_access" ON public.coin_sales FOR ALL TO service_role USING (true) WITH CHECK (true)`,
    `DROP POLICY IF EXISTS "service_role_full_access" ON public.employees`,
    `CREATE POLICY "service_role_full_access" ON public.employees FOR ALL TO service_role USING (true) WITH CHECK (true)`,
    `DROP POLICY IF EXISTS "service_role_full_access" ON public.companies`,
    `CREATE POLICY "service_role_full_access" ON public.companies FOR ALL TO service_role USING (true) WITH CHECK (true)`,
    `DROP POLICY IF EXISTS "service_role_full_access" ON public.campaigns`,
    `CREATE POLICY "service_role_full_access" ON public.campaigns FOR ALL TO service_role USING (true) WITH CHECK (true)`,
    `DROP POLICY IF EXISTS "service_role_full_access" ON public.logs`,
    `CREATE POLICY "service_role_full_access" ON public.logs FOR ALL TO service_role USING (true) WITH CHECK (true)`,
    `DROP POLICY IF EXISTS "service_role_full_access" ON public.productivity`,
    `CREATE POLICY "service_role_full_access" ON public.productivity FOR ALL TO service_role USING (true) WITH CHECK (true)`,
    `DROP POLICY IF EXISTS "service_role_full_access" ON public.redemptions`,
    `CREATE POLICY "service_role_full_access" ON public.redemptions FOR ALL TO service_role USING (true) WITH CHECK (true)`,
    `DROP POLICY IF EXISTS "service_role_full_access" ON public.voice_comments`,
    `CREATE POLICY "service_role_full_access" ON public.voice_comments FOR ALL TO service_role USING (true) WITH CHECK (true)`,
    `DROP POLICY IF EXISTS "service_role_full_access" ON public.creator_verifications`,
    `CREATE POLICY "service_role_full_access" ON public.creator_verifications FOR ALL TO service_role USING (true) WITH CHECK (true)`,
    `DROP POLICY IF EXISTS "service_role_full_access" ON public.user_follows`,
    `CREATE POLICY "service_role_full_access" ON public.user_follows FOR ALL TO service_role USING (true) WITH CHECK (true)`,
    `DROP POLICY IF EXISTS "service_role_full_access" ON public.video_likes`,
    `CREATE POLICY "service_role_full_access" ON public.video_likes FOR ALL TO service_role USING (true) WITH CHECK (true)`,
    `DROP POLICY IF EXISTS "service_role_full_access" ON public.video_bookmarks`,
    `CREATE POLICY "service_role_full_access" ON public.video_bookmarks FOR ALL TO service_role USING (true) WITH CHECK (true)`,
    `DROP POLICY IF EXISTS "service_role_full_access" ON public.video_views`,
    `CREATE POLICY "service_role_full_access" ON public.video_views FOR ALL TO service_role USING (true) WITH CHECK (true)`,
    `DROP POLICY IF EXISTS "service_role_full_access" ON public.voice_comment_likes`,
    `CREATE POLICY "service_role_full_access" ON public.voice_comment_likes FOR ALL TO service_role USING (true) WITH CHECK (true)`,
    `DROP POLICY IF EXISTS "service_role_full_access" ON public.notifications`,
    `CREATE POLICY "service_role_full_access" ON public.notifications FOR ALL TO service_role USING (true) WITH CHECK (true)`,
    `DROP POLICY IF EXISTS "service_role_full_access" ON public.banned_emails`,
    `CREATE POLICY "service_role_full_access" ON public.banned_emails FOR ALL TO service_role USING (true) WITH CHECK (true)`,
    `DROP POLICY IF EXISTS "service_role_full_access" ON public.withdrawal_requests`,
    `CREATE POLICY "service_role_full_access" ON public.withdrawal_requests FOR ALL TO service_role USING (true) WITH CHECK (true)`,
    `DROP POLICY IF EXISTS "service_role_full_access" ON public.wallets`,
    `CREATE POLICY "service_role_full_access" ON public.wallets FOR ALL TO service_role USING (true) WITH CHECK (true)`,
    `DROP POLICY IF EXISTS "service_role_full_access" ON public.ledger_transactions`,
    `CREATE POLICY "service_role_full_access" ON public.ledger_transactions FOR ALL TO service_role USING (true) WITH CHECK (true)`,
    `DROP POLICY IF EXISTS "service_role_full_access" ON public.ledger_entries`,
    `CREATE POLICY "service_role_full_access" ON public.ledger_entries FOR ALL TO service_role USING (true) WITH CHECK (true)`,
    `DROP POLICY IF EXISTS "anon_public_read" ON public.videos`,
    `CREATE POLICY "anon_public_read" ON public.videos FOR SELECT TO anon USING (true)`,
    `DROP POLICY IF EXISTS "anon_public_read" ON public.voice_comments`,
    `CREATE POLICY "anon_public_read" ON public.voice_comments FOR SELECT TO anon USING (true)`,
    `DROP POLICY IF EXISTS "anon_public_read" ON public.campaigns`,
    `CREATE POLICY "anon_public_read" ON public.campaigns FOR SELECT TO anon USING (true)`,
    `DROP POLICY IF EXISTS "anon_public_read" ON public.user_follows`,
    `CREATE POLICY "anon_public_read" ON public.user_follows FOR SELECT TO anon USING (true)`,
    `DROP POLICY IF EXISTS "anon_public_read" ON public.video_likes`,
    `CREATE POLICY "anon_public_read" ON public.video_likes FOR SELECT TO anon USING (true)`,
    `DROP POLICY IF EXISTS "anon_public_read" ON public.video_views`,
    `CREATE POLICY "anon_public_read" ON public.video_views FOR SELECT TO anon USING (true)`,
    `DROP POLICY IF EXISTS "anon_public_read" ON public.voice_comment_likes`,
    `CREATE POLICY "anon_public_read" ON public.voice_comment_likes FOR SELECT TO anon USING (true)`,
    `DROP FUNCTION IF EXISTS public.voz_exec_ddl(text)`,
];

// Use Supabase Management API to run SQL
// POST https://api.supabase.com/v1/projects/{ref}/database/query
function runSQLViaManagementAPI(sql, accessToken) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({ query: sql });
        const options = {
            hostname: 'api.supabase.com',
            port: 443,
            path: `/v1/projects/${PROJECT_REF}/database/query`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'Content-Length': Buffer.byteLength(body)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: data }));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

async function main() {
    console.log('\n🔒 VOZ - Aplicando políticas de seguridad RLS en Supabase');
    console.log('='.repeat(65));
    console.log(`📦 Proyecto: ${PROJECT_REF}`);
    console.log(`📝 Total sentencias: ${SQL_STATEMENTS.length}\n`);

    // Combine all into one query for efficiency
    const fullSQL = SQL_STATEMENTS.join(';\n') + ';';
    
    console.log('📡 Enviando SQL via Management API...\n');
    
    // Try with service role key (won't work for DDL via REST, but let's confirm)
    const result = await runSQLViaManagementAPI(fullSQL, SERVICE_ROLE_KEY);
    
    console.log(`📊 Status HTTP: ${result.status}`);
    
    if (result.status === 200 || result.status === 201) {
        console.log('\n✅ ¡ÉXITO! RLS aplicado correctamente.');
        try {
            const parsed = JSON.parse(result.body);
            console.log('Respuesta:', JSON.stringify(parsed, null, 2).substring(0, 500));
        } catch {
            console.log('Respuesta:', result.body.substring(0, 500));
        }
    } else if (result.status === 401 || result.status === 403) {
        console.log('\n⚠️  La Management API requiere un Personal Access Token (PAT) de Supabase.');
        console.log('   El service_role key NO sirve para esta API.');
        console.log('\n📋 INSTRUCCIÓN MANUAL:');
        console.log('   1. Ve a: https://supabase.com/dashboard/account/tokens');
        console.log('   2. Crea un nuevo token de acceso personal');
        console.log('   3. Vuelve a ejecutar este script con ese token');
        console.log('\n   Alternativamente, puedes pegar el SQL directamente en:');
        console.log('   https://supabase.com/dashboard/project/thiftwzubmvcrdhuwcwm/sql/new');
    } else {
        console.log(`\n❌ Error: ${result.body.substring(0, 500)}`);
    }
}

main().catch(console.error);
