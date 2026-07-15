-- ============================================================
-- VOZ - Activar RLS y Políticas de Seguridad (versión robusta)
-- Usa IF EXISTS y DO blocks para ignorar tablas que no existen
-- ============================================================

-- 1. Activar RLS en todas las tablas (IF EXISTS evita errores)
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

-- 2. Crear política service_role (acceso total) en todas las tablas existentes
DO $$
DECLARE
  t TEXT;
  service_tables TEXT[] := ARRAY[
    'app_users', 'videos', 'moderation_queue', 'user_penalties',
    'transactions', 'coin_sales', 'employees', 'companies',
    'campaigns', 'logs', 'productivity', 'redemptions',
    'voice_comments', 'creator_verifications', 'user_follows',
    'video_likes', 'video_bookmarks', 'video_views',
    'voice_comment_likes', 'notifications', 'banned_emails',
    'withdrawal_requests', 'wallets', 'ledger_transactions', 'ledger_entries'
  ];
BEGIN
  FOREACH t IN ARRAY service_tables LOOP
    IF EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format(
        'DROP POLICY IF EXISTS "service_role_full_access" ON public.%I', t
      );
      EXECUTE format(
        'CREATE POLICY "service_role_full_access" ON public.%I
         FOR ALL TO service_role USING (true) WITH CHECK (true)', t
      );
      RAISE NOTICE 'service_role policy applied to: %', t;
    ELSE
      RAISE NOTICE 'Tabla no existe, omitida: %', t;
    END IF;
  END LOOP;
END $$;

-- 3. Crear política de lectura pública (anon) para tablas públicas
DO $$
DECLARE
  t TEXT;
  public_tables TEXT[] := ARRAY[
    'videos', 'voice_comments', 'campaigns',
    'user_follows', 'video_likes', 'video_views', 'voice_comment_likes'
  ];
BEGIN
  FOREACH t IN ARRAY public_tables LOOP
    IF EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format(
        'DROP POLICY IF EXISTS "anon_public_read" ON public.%I', t
      );
      EXECUTE format(
        'CREATE POLICY "anon_public_read" ON public.%I
         FOR SELECT TO anon USING (true)', t
      );
      RAISE NOTICE 'anon read policy applied to: %', t;
    END IF;
  END LOOP;
END $$;

-- 4. Eliminar función auxiliar si existía (limpieza)
DROP FUNCTION IF EXISTS public.voz_exec_ddl(text);

-- ============================================================
-- FIN - RLS activado correctamente en todas las tablas
-- ============================================================
