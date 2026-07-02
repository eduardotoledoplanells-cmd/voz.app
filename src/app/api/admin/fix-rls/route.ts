/**
 * ENDPOINT TEMPORAL - Fix de seguridad RLS
 * Solo accesible con la clave secreta de administración.
 * ELIMINAR DESPUÉS DE EJECUTAR.
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Lista completa de comandos DDL
const DDL_COMMANDS = [
  // === ACTIVAR RLS ===
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
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.app_users',
  'CREATE POLICY "service_role_full_access" ON public.app_users FOR ALL TO service_role USING (true) WITH CHECK (true)',
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.videos',
  'CREATE POLICY "service_role_full_access" ON public.videos FOR ALL TO service_role USING (true) WITH CHECK (true)',
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.moderation_queue',
  'CREATE POLICY "service_role_full_access" ON public.moderation_queue FOR ALL TO service_role USING (true) WITH CHECK (true)',
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.user_penalties',
  'CREATE POLICY "service_role_full_access" ON public.user_penalties FOR ALL TO service_role USING (true) WITH CHECK (true)',
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.transactions',
  'CREATE POLICY "service_role_full_access" ON public.transactions FOR ALL TO service_role USING (true) WITH CHECK (true)',
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.coin_sales',
  'CREATE POLICY "service_role_full_access" ON public.coin_sales FOR ALL TO service_role USING (true) WITH CHECK (true)',
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.employees',
  'CREATE POLICY "service_role_full_access" ON public.employees FOR ALL TO service_role USING (true) WITH CHECK (true)',
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.companies',
  'CREATE POLICY "service_role_full_access" ON public.companies FOR ALL TO service_role USING (true) WITH CHECK (true)',
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.campaigns',
  'CREATE POLICY "service_role_full_access" ON public.campaigns FOR ALL TO service_role USING (true) WITH CHECK (true)',
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.logs',
  'CREATE POLICY "service_role_full_access" ON public.logs FOR ALL TO service_role USING (true) WITH CHECK (true)',
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.productivity',
  'CREATE POLICY "service_role_full_access" ON public.productivity FOR ALL TO service_role USING (true) WITH CHECK (true)',
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.redemptions',
  'CREATE POLICY "service_role_full_access" ON public.redemptions FOR ALL TO service_role USING (true) WITH CHECK (true)',
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.voice_comments',
  'CREATE POLICY "service_role_full_access" ON public.voice_comments FOR ALL TO service_role USING (true) WITH CHECK (true)',
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.creator_verifications',
  'CREATE POLICY "service_role_full_access" ON public.creator_verifications FOR ALL TO service_role USING (true) WITH CHECK (true)',
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.user_follows',
  'CREATE POLICY "service_role_full_access" ON public.user_follows FOR ALL TO service_role USING (true) WITH CHECK (true)',
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.video_likes',
  'CREATE POLICY "service_role_full_access" ON public.video_likes FOR ALL TO service_role USING (true) WITH CHECK (true)',
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.video_bookmarks',
  'CREATE POLICY "service_role_full_access" ON public.video_bookmarks FOR ALL TO service_role USING (true) WITH CHECK (true)',
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.video_views',
  'CREATE POLICY "service_role_full_access" ON public.video_views FOR ALL TO service_role USING (true) WITH CHECK (true)',
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.voice_comment_likes',
  'CREATE POLICY "service_role_full_access" ON public.voice_comment_likes FOR ALL TO service_role USING (true) WITH CHECK (true)',
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.notifications',
  'CREATE POLICY "service_role_full_access" ON public.notifications FOR ALL TO service_role USING (true) WITH CHECK (true)',
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.banned_emails',
  'CREATE POLICY "service_role_full_access" ON public.banned_emails FOR ALL TO service_role USING (true) WITH CHECK (true)',
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.withdrawal_requests',
  'CREATE POLICY "service_role_full_access" ON public.withdrawal_requests FOR ALL TO service_role USING (true) WITH CHECK (true)',
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.wallets',
  'CREATE POLICY "service_role_full_access" ON public.wallets FOR ALL TO service_role USING (true) WITH CHECK (true)',
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.ledger_transactions',
  'CREATE POLICY "service_role_full_access" ON public.ledger_transactions FOR ALL TO service_role USING (true) WITH CHECK (true)',
  'DROP POLICY IF EXISTS "service_role_full_access" ON public.ledger_entries',
  'CREATE POLICY "service_role_full_access" ON public.ledger_entries FOR ALL TO service_role USING (true) WITH CHECK (true)',

  // === LECTURA PÚBLICA para el feed ===
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
];

export async function POST(req: Request) {
  // Verificar clave de administración
  const auth = req.headers.get('x-admin-key');
  if (!auth || auth !== ADMIN_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });

  const results: { cmd: string; ok: boolean; error?: string }[] = [];
  let successCount = 0;
  let errorCount = 0;

  for (const cmd of DDL_COMMANDS) {
    try {
      const { error } = await supabase.rpc('exec_sql_admin', { sql: cmd });
      
      if (error) {
        // Si no existe la función RPC, intentamos con from().select()
        results.push({ cmd: cmd.substring(0, 70), ok: false, error: error.message });
        errorCount++;
      } else {
        results.push({ cmd: cmd.substring(0, 70), ok: true });
        successCount++;
      }
    } catch (e: any) {
      results.push({ cmd: cmd.substring(0, 70), ok: false, error: e.message });
      errorCount++;
    }
  }

  // Verificar estado final de RLS
  const { data: rlsStatus } = await supabase
    .from('pg_tables')
    .select('tablename, rowsecurity')
    .eq('schemaname', 'public');

  return NextResponse.json({
    message: `Fix completado: ${successCount} OK / ${errorCount} errores`,
    successCount,
    errorCount,
    results,
    rlsStatus,
  });
}

// GET para verificar que el endpoint existe
export async function GET(req: Request) {
  const auth = req.headers.get('x-admin-key');
  if (!auth || auth !== ADMIN_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  return NextResponse.json({ status: 'Endpoint RLS fix activo. Usa POST para ejecutar.' });
}
