/**
 * FIX RLS SECURITY - VOZ APP
 * Usa el cliente oficial de Supabase con service_role para ejecutar SQL.
 * 
 * NOTA: La Management API requiere Personal Access Token (diferente al service_role).
 * Este script usa el cliente @supabase/supabase-js con service_role para
 * ejecutar SQL a través de una función PostgreSQL auxiliar temporal.
 */

const SUPABASE_URL = 'https://thiftwzubmvcrdhuwcwm.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoaWZ0d3p1Ym12Y3JkaHV3Y3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTExMjE3MiwiZXhwIjoyMDk0Njg4MTcyfQ.otwtK4a9g6Nf4DON1QCkoERKueQ8YcbrCaS9Tv0xhC4';

// El service_role key tiene acceso total, pero NO puede ejecutar DDL (ALTER TABLE, CREATE POLICY)
// directamente via REST. Necesita hacerlo via una función SECURITY DEFINER en Postgres.
// 
// La única forma de ejecutar DDL sin la Management API es via la conexión directa a Postgres
// o creando una función auxiliar.
//
// Vamos a usar fetch directamente al endpoint de Supabase para crear una función
// exec_ddl y luego llamarla.

async function supabaseRPC(funcName, params = {}) {
  const url = `${SUPABASE_URL}/rest/v1/rpc/${funcName}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(params),
  });
  
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  
  return { ok: res.ok, status: res.status, data };
}

// Primero necesitamos crear la función exec_ddl via Management API
// o usamos el endpoint de Supabase Admin SQL
async function runAdminSQL(sql) {
  // Supabase tiene un endpoint no documentado para SQL admin con service_role
  const url = `${SUPABASE_URL}/rest/v1/`;
  
  // Intentamos con el endpoint de Postgres directamente
  const pgUrl = `${SUPABASE_URL}/pg/query`;
  const res = await fetch(pgUrl, {
    method: 'POST', 
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { ok: res.ok, status: res.status, data };
}

// =====================================================================
// ESTRATEGIA REAL: Crear función SQL via Supabase que ejecute DDL
// y luego llamarla via RPC con service_role
// =====================================================================

// Primero crear la función ejecutora de DDL
const CREATE_EXEC_FUNCTION = `
CREATE OR REPLACE FUNCTION public.voz_exec_ddl(ddl_statement text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE ddl_statement;
  RETURN 'OK: ' || left(ddl_statement, 60);
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'ERROR: ' || SQLERRM || ' | SQL: ' || left(ddl_statement, 60);
END;
$$;
`;

// Lista de comandos DDL a ejecutar
const DDL_COMMANDS = [
  // === ACTIVAR RLS EN TODAS LAS TABLAS ===
  'ALTER TABLE IF EXISTS public.app_users ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE IF EXISTS public.videos ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE IF EXISTS public.moderation_queue ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE IF EXISTS public.user_penalties ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE IF EXISTS public.transactions ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE IF EXISTS public.coin_sales ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE IF EXISTS public.employees ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE IF EXISTS public.companies ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE IF EXISTS public.campaigns ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE IF EXISTS public.logs ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE IF EXISTS public.productivity ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE IF EXISTS public.redemptions ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE IF EXISTS public.voice_comments ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE IF EXISTS public.creator_verifications ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE IF EXISTS public.user_follows ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE IF EXISTS public.video_likes ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE IF EXISTS public.video_bookmarks ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE IF EXISTS public.video_views ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE IF EXISTS public.voice_comment_likes ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE IF EXISTS public.banned_emails ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE IF EXISTS public.withdrawal_requests ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE IF EXISTS public.wallets ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE IF EXISTS public.ledger_transactions ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE IF EXISTS public.ledger_entries ENABLE ROW LEVEL SECURITY',

  // === POLÍTICAS SERVICE_ROLE (acceso total para el backend) ===
  // app_users
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.app_users',
  'CREATE POLICY "service_role_full_access" ON public.app_users FOR ALL TO service_role USING (true) WITH CHECK (true)',
  // videos
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.videos',
  'CREATE POLICY "service_role_full_access" ON public.videos FOR ALL TO service_role USING (true) WITH CHECK (true)',
  // moderation_queue
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.moderation_queue',
  'CREATE POLICY "service_role_full_access" ON public.moderation_queue FOR ALL TO service_role USING (true) WITH CHECK (true)',
  // user_penalties
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.user_penalties',
  'CREATE POLICY "service_role_full_access" ON public.user_penalties FOR ALL TO service_role USING (true) WITH CHECK (true)',
  // transactions
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.transactions',
  'CREATE POLICY "service_role_full_access" ON public.transactions FOR ALL TO service_role USING (true) WITH CHECK (true)',
  // coin_sales
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.coin_sales',
  'CREATE POLICY "service_role_full_access" ON public.coin_sales FOR ALL TO service_role USING (true) WITH CHECK (true)',
  // employees
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.employees',
  'CREATE POLICY "service_role_full_access" ON public.employees FOR ALL TO service_role USING (true) WITH CHECK (true)',
  // companies
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.companies',
  'CREATE POLICY "service_role_full_access" ON public.companies FOR ALL TO service_role USING (true) WITH CHECK (true)',
  // campaigns
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.campaigns',
  'CREATE POLICY "service_role_full_access" ON public.campaigns FOR ALL TO service_role USING (true) WITH CHECK (true)',
  // logs
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.logs',
  'CREATE POLICY "service_role_full_access" ON public.logs FOR ALL TO service_role USING (true) WITH CHECK (true)',
  // productivity
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.productivity',
  'CREATE POLICY "service_role_full_access" ON public.productivity FOR ALL TO service_role USING (true) WITH CHECK (true)',
  // redemptions
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.redemptions',
  'CREATE POLICY "service_role_full_access" ON public.redemptions FOR ALL TO service_role USING (true) WITH CHECK (true)',
  // voice_comments
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.voice_comments',
  'CREATE POLICY "service_role_full_access" ON public.voice_comments FOR ALL TO service_role USING (true) WITH CHECK (true)',
  // creator_verifications
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.creator_verifications',
  'CREATE POLICY "service_role_full_access" ON public.creator_verifications FOR ALL TO service_role USING (true) WITH CHECK (true)',
  // user_follows
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.user_follows',
  'CREATE POLICY "service_role_full_access" ON public.user_follows FOR ALL TO service_role USING (true) WITH CHECK (true)',
  // video_likes
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.video_likes',
  'CREATE POLICY "service_role_full_access" ON public.video_likes FOR ALL TO service_role USING (true) WITH CHECK (true)',
  // video_bookmarks
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.video_bookmarks',
  'CREATE POLICY "service_role_full_access" ON public.video_bookmarks FOR ALL TO service_role USING (true) WITH CHECK (true)',
  // video_views
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.video_views',
  'CREATE POLICY "service_role_full_access" ON public.video_views FOR ALL TO service_role USING (true) WITH CHECK (true)',
  // voice_comment_likes
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.voice_comment_likes',
  'CREATE POLICY "service_role_full_access" ON public.voice_comment_likes FOR ALL TO service_role USING (true) WITH CHECK (true)',
  // notifications
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.notifications',
  'CREATE POLICY "service_role_full_access" ON public.notifications FOR ALL TO service_role USING (true) WITH CHECK (true)',
  // banned_emails
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.banned_emails',
  'CREATE POLICY "service_role_full_access" ON public.banned_emails FOR ALL TO service_role USING (true) WITH CHECK (true)',
  // withdrawal_requests
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.withdrawal_requests',
  'CREATE POLICY "service_role_full_access" ON public.withdrawal_requests FOR ALL TO service_role USING (true) WITH CHECK (true)',
  // wallets
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.wallets',
  'CREATE POLICY "service_role_full_access" ON public.wallets FOR ALL TO service_role USING (true) WITH CHECK (true)',
  // ledger_transactions
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.ledger_transactions',
  'CREATE POLICY "service_role_full_access" ON public.ledger_transactions FOR ALL TO service_role USING (true) WITH CHECK (true)',
  // ledger_entries
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.ledger_entries',
  'CREATE POLICY "service_role_full_access" ON public.ledger_entries FOR ALL TO service_role USING (true) WITH CHECK (true)',

  // === POLÍTICAS LECTURA PÚBLICA (feed, vídeos, contenido social) ===
  'DROP POLICY IF EXISTS "anon_public_read" ON public.videos',
  'CREATE POLICY "anon_public_read" ON public.videos FOR SELECT TO anon USING (true)',
  'DROP POLICY IF EXISTS "anon_public_read" ON public.voice_comments',
  'CREATE POLICY "anon_public_read" ON public.voice_comments FOR SELECT TO anon USING (true)',
  'DROP POLICY IF EXISTS "anon_public_read" ON public.campaigns',
  'CREATE POLICY "anon_public_read" ON public.campaigns FOR SELECT TO anon USING (true)',
  'DROP POLICY IF EXISTS "anon_public_read" ON public.user_follows',
  'CREATE POLICY "anon_public_read" ON public.user_follows FOR SELECT TO anon USING (true)',
  'DROP POLICY IF EXISTS "anon_public_read" ON public.video_likes',
  'CREATE POLICY "anon_public_read" ON public.video_likes FOR SELECT TO anon USING (true)',
  'DROP POLICY IF EXISTS "anon_public_read" ON public.video_views',
  'CREATE POLICY "anon_public_read" ON public.video_views FOR SELECT TO anon USING (true)',
  'DROP POLICY IF EXISTS "anon_public_read" ON public.voice_comment_likes',
  'CREATE POLICY "anon_public_read" ON public.voice_comment_likes FOR SELECT TO anon USING (true)',

  // === LIMPIAR FUNCIÓN AUXILIAR AL FINAL ===
  'DROP FUNCTION IF EXISTS public.voz_exec_ddl(text)',
];

async function main() {
  console.log('🔐 VOZ APP - Fix de Seguridad RLS');
  console.log('='.repeat(55));
  console.log(`📡 Supabase: ${SUPABASE_URL}`);
  console.log('');

  // PASO 1: Crear la función ejecutora DDL
  console.log('📦 PASO 1: Creando función auxiliar DDL en Postgres...');
  
  // Usamos el endpoint de gestión de Supabase para crear la función
  // via RPC con el endpoint de admin SQL (disponible con service_role en algunos endpoints)
  const createFuncUrl = `${SUPABASE_URL}/rest/v1/rpc/voz_exec_ddl`;
  
  // Primero intentamos crear la función via el endpoint de administración
  const adminSqlUrl = `${SUPABASE_URL}/pg/query`;
  
  // Intentar varios endpoints conocidos de Supabase para SQL admin
  const endpoints = [
    `${SUPABASE_URL}/pg/query`,
    `${SUPABASE_URL}/rest/v1/rpc/exec_sql`,
    `${SUPABASE_URL}/sql`,
  ];

  let workingEndpoint = null;
  for (const ep of endpoints) {
    const res = await fetch(ep, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: 'SELECT 1 as test' }),
    });
    console.log(`  Probando ${ep}: HTTP ${res.status}`);
    if (res.ok || res.status === 200) {
      workingEndpoint = ep;
      console.log(`  ✅ Endpoint funcional encontrado: ${ep}`);
      break;
    }
  }

  if (!workingEndpoint) {
    console.log('\n⚠️  La Management API de Supabase requiere Personal Access Token.');
    console.log('   El service_role key NO puede ejecutar DDL via REST API.');
    console.log('\n📋 SOLUCIÓN MANUAL - Copia y pega este SQL en Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/thiftwzubmvcrdhuwcwm/sql/new');
    console.log('\n' + '='.repeat(55));
    
    // Generar SQL completo para pegar manualmente
    const fullSQL = DDL_COMMANDS.join(';\n') + ';';
    console.log(fullSQL);
    
    console.log('\n' + '='.repeat(55));
    console.log('📄 El SQL también ha sido guardado en: fix_rls_manual.sql');
    
    const fs = require('fs');
    fs.writeFileSync('./fix_rls_manual.sql', DDL_COMMANDS.join(';\n\n') + ';\n');
    return;
  }

  // Si encontramos endpoint funcionando, ejecutamos todos los comandos
  console.log('\n🚀 PASO 2: Ejecutando comandos DDL...');
  let success = 0, errors = 0;

  for (const cmd of DDL_COMMANDS) {
    const label = cmd.substring(0, 60) + (cmd.length > 60 ? '...' : '');
    const res = await fetch(workingEndpoint, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: cmd }),
    });
    
    if (res.ok) {
      console.log(`✅ ${label}`);
      success++;
    } else {
      const err = await res.text();
      console.error(`❌ ${label}\n   Error: ${err.substring(0, 100)}`);
      errors++;
    }
  }

  console.log(`\n📊 Resultado: ${success} OK / ${errors} errores`);
}

main().catch(console.error);
