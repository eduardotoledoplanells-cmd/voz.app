-- ====================================================================
-- FIX RLS SECURITY ISSUES - VOZ APP
-- Fecha: Junio 2026
-- Motivo: Email de Supabase alertando tablas sin RLS habilitado
-- 
-- INSTRUCCIONES: Pega este script completo en el SQL Editor de Supabase
-- y ejecútalo. Es seguro ejecutarlo varias veces (idempotente).
-- ====================================================================

-- ====================================================================
-- PASO 1: Habilitar RLS en TODAS las tablas públicas
-- ====================================================================

ALTER TABLE IF EXISTS public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.coin_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.productivity ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.voice_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.creator_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.video_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.video_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.voice_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.banned_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ledger_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ledger_entries ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- PASO 2: POLÍTICAS PARA app_users
-- El backend usa service_role (siempre tiene acceso total).
-- La app móvil NO usa Supabase Auth directamente, usa nuestro backend.
-- Por tanto: solo service_role accede. Anon y authenticated bloqueados.
-- ====================================================================

-- app_users: contiene email, password (hash), push_token → MUY SENSIBLE
DROP POLICY IF EXISTS "service_role_all_app_users" ON public.app_users;
CREATE POLICY "service_role_all_app_users" ON public.app_users
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Bloquear acceso anónimo total a app_users (no debe ser accesible)
DROP POLICY IF EXISTS "anon_no_access_app_users" ON public.app_users;
-- (Sin política para anon = bloqueado por defecto con RLS activo)

-- ====================================================================
-- PASO 3: POLÍTICAS PARA videos
-- Los vídeos son públicos para lectura (feed de la app)
-- ====================================================================

DROP POLICY IF EXISTS "service_role_all_videos" ON public.videos;
CREATE POLICY "service_role_all_videos" ON public.videos
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_videos" ON public.videos;
CREATE POLICY "public_read_videos" ON public.videos
    FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "authenticated_read_videos" ON public.videos;
CREATE POLICY "authenticated_read_videos" ON public.videos
    FOR SELECT TO authenticated USING (true);

-- ====================================================================
-- PASO 4: POLÍTICAS PARA voice_comments
-- Lectura pública, escritura solo via backend (service_role)
-- ====================================================================

DROP POLICY IF EXISTS "service_role_all_voice_comments" ON public.voice_comments;
CREATE POLICY "service_role_all_voice_comments" ON public.voice_comments
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_voice_comments" ON public.voice_comments;
CREATE POLICY "public_read_voice_comments" ON public.voice_comments
    FOR SELECT TO anon USING (true);

-- ====================================================================
-- PASO 5: POLÍTICAS PARA campaigns
-- Lectura pública para servir anuncios
-- ====================================================================

DROP POLICY IF EXISTS "service_role_all_campaigns" ON public.campaigns;
CREATE POLICY "service_role_all_campaigns" ON public.campaigns
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_campaigns" ON public.campaigns;
CREATE POLICY "public_read_campaigns" ON public.campaigns
    FOR SELECT TO anon USING (true);

-- ====================================================================
-- PASO 6: POLÍTICAS PARA tablas INTERNAS (solo service_role)
-- employees, companies, logs, productivity, moderation_queue,
-- user_penalties, transactions, coin_sales, redemptions,
-- creator_verifications, banned_emails, withdrawal_requests
-- ====================================================================

DROP POLICY IF EXISTS "service_role_all_employees" ON public.employees;
CREATE POLICY "service_role_all_employees" ON public.employees
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_companies" ON public.companies;
CREATE POLICY "service_role_all_companies" ON public.companies
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_logs" ON public.logs;
CREATE POLICY "service_role_all_logs" ON public.logs
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_productivity" ON public.productivity;
CREATE POLICY "service_role_all_productivity" ON public.productivity
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_moderation_queue" ON public.moderation_queue;
CREATE POLICY "service_role_all_moderation_queue" ON public.moderation_queue
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_user_penalties" ON public.user_penalties;
CREATE POLICY "service_role_all_user_penalties" ON public.user_penalties
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_transactions" ON public.transactions;
CREATE POLICY "service_role_all_transactions" ON public.transactions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_coin_sales" ON public.coin_sales;
CREATE POLICY "service_role_all_coin_sales" ON public.coin_sales
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_redemptions" ON public.redemptions;
CREATE POLICY "service_role_all_redemptions" ON public.redemptions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_creator_verifications" ON public.creator_verifications;
CREATE POLICY "service_role_all_creator_verifications" ON public.creator_verifications
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_banned_emails" ON public.banned_emails;
CREATE POLICY "service_role_all_banned_emails" ON public.banned_emails
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_withdrawal_requests" ON public.withdrawal_requests;
CREATE POLICY "service_role_all_withdrawal_requests" ON public.withdrawal_requests
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ====================================================================
-- PASO 7: POLÍTICAS PARA tablas SOCIALES (user_follows, video_likes, etc.)
-- ====================================================================

DROP POLICY IF EXISTS "service_role_all_user_follows" ON public.user_follows;
CREATE POLICY "service_role_all_user_follows" ON public.user_follows
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_user_follows" ON public.user_follows;
CREATE POLICY "public_read_user_follows" ON public.user_follows
    FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "service_role_all_video_likes" ON public.video_likes;
CREATE POLICY "service_role_all_video_likes" ON public.video_likes
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_video_likes" ON public.video_likes;
CREATE POLICY "public_read_video_likes" ON public.video_likes
    FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "service_role_all_video_bookmarks" ON public.video_bookmarks;
CREATE POLICY "service_role_all_video_bookmarks" ON public.video_bookmarks
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_video_views" ON public.video_views;
CREATE POLICY "service_role_all_video_views" ON public.video_views
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_video_views" ON public.video_views;
CREATE POLICY "public_read_video_views" ON public.video_views
    FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "service_role_all_voice_comment_likes" ON public.voice_comment_likes;
CREATE POLICY "service_role_all_voice_comment_likes" ON public.voice_comment_likes
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_voice_comment_likes" ON public.voice_comment_likes;
CREATE POLICY "public_read_voice_comment_likes" ON public.voice_comment_likes
    FOR SELECT TO anon USING (true);

-- ====================================================================
-- PASO 8: POLÍTICAS PARA notifications
-- Solo el propio usuario puede ver sus notificaciones
-- ====================================================================

DROP POLICY IF EXISTS "service_role_all_notifications" ON public.notifications;
CREATE POLICY "service_role_all_notifications" ON public.notifications
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ====================================================================
-- PASO 9: POLÍTICAS PARA wallets y ledger (sistema financiero)
-- NUNCA deben ser accesibles sin service_role
-- ====================================================================

DROP POLICY IF EXISTS "service_role_all_wallets" ON public.wallets;
CREATE POLICY "service_role_all_wallets" ON public.wallets
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_ledger_transactions" ON public.ledger_transactions;
CREATE POLICY "service_role_all_ledger_transactions" ON public.ledger_transactions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_ledger_entries" ON public.ledger_entries;
CREATE POLICY "service_role_all_ledger_entries" ON public.ledger_entries
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ====================================================================
-- VERIFICACIÓN FINAL
-- Ejecuta esto para ver el estado de RLS en todas las tablas
-- ====================================================================

SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_enabled,
    CASE WHEN rowsecurity THEN '✅ RLS ON' ELSE '❌ RLS OFF' END AS estado
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
