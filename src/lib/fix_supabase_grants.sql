-- SCRIPT DE ACTUALIZACIÓN DE PERMISOS PARA SUPABASE (DATA API 2026)
-- Este script otorga permisos explícitos a las tablas en el esquema 'public'
-- para asegurar compatibilidad con los cambios de Supabase de Mayo/Octubre 2026.

-- Asegurar acceso al esquema public
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- 1. app_users
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.app_users TO anon;
GRANT SELECT, INSERT, UPDATE ON public.app_users TO authenticated;
GRANT ALL ON public.app_users TO service_role;

-- 2. videos
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.videos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.videos TO authenticated;
GRANT ALL ON public.videos TO service_role;

-- 3. moderation_queue
ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.moderation_queue TO service_role;
GRANT SELECT, INSERT ON public.moderation_queue TO authenticated; -- Para que usuarios puedan reportar

-- 4. user_penalties
ALTER TABLE public.user_penalties ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.user_penalties TO service_role;
GRANT SELECT ON public.user_penalties TO authenticated;

-- 5. transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.transactions TO service_role;
GRANT SELECT, INSERT ON public.transactions TO authenticated;

-- 6. coin_sales
ALTER TABLE public.coin_sales ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.coin_sales TO service_role;
GRANT SELECT ON public.coin_sales TO authenticated;

-- 7. employees
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.employees TO service_role;
-- No anon/auth access for employees table

-- 8. companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.companies TO service_role;

-- 9. campaigns
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.campaigns TO anon;
GRANT SELECT ON public.campaigns TO authenticated;
GRANT ALL ON public.campaigns TO service_role;

-- 10. logs
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.logs TO service_role;

-- 11. productivity
ALTER TABLE public.productivity ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.productivity TO service_role;

-- 12. redemptions
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.redemptions TO service_role;
GRANT SELECT, INSERT ON public.redemptions TO authenticated;

-- 13. voice_comments
ALTER TABLE public.voice_comments ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.voice_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.voice_comments TO authenticated;
GRANT ALL ON public.voice_comments TO service_role;

-- 14. creator_verifications
ALTER TABLE public.creator_verifications ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.creator_verifications TO service_role;
GRANT SELECT, INSERT ON public.creator_verifications TO authenticated;

-- 15. user_follows
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.user_follows TO anon;
GRANT ALL ON public.user_follows TO authenticated;
GRANT ALL ON public.user_follows TO service_role;

-- 16. video_likes
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.video_likes TO anon;
GRANT ALL ON public.video_likes TO authenticated;
GRANT ALL ON public.video_likes TO service_role;

-- 17. video_bookmarks
ALTER TABLE public.video_bookmarks ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.video_bookmarks TO authenticated;
GRANT ALL ON public.video_bookmarks TO service_role;

-- 18. video_views
ALTER TABLE public.video_views ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.video_views TO anon;
GRANT ALL ON public.video_views TO authenticated;
GRANT ALL ON public.video_views TO service_role;

-- 19. voice_comment_likes
ALTER TABLE public.voice_comment_likes ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.voice_comment_likes TO anon;
GRANT ALL ON public.voice_comment_likes TO authenticated;
GRANT ALL ON public.voice_comment_likes TO service_role;

-- 20. notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

-- 21. banned_emails
ALTER TABLE public.banned_emails ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.banned_emails TO service_role;

-- 22. withdrawal_requests
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.withdrawal_requests TO service_role;
GRANT SELECT, INSERT ON public.withdrawal_requests TO authenticated;

-- 23. wallets
GRANT ALL ON public.wallets TO service_role;
GRANT SELECT ON public.wallets TO authenticated;

-- 24. ledger_transactions
GRANT ALL ON public.ledger_transactions TO service_role;
GRANT SELECT ON public.ledger_transactions TO authenticated;

-- 25. ledger_entries
GRANT ALL ON public.ledger_entries TO service_role;
GRANT SELECT ON public.ledger_entries TO authenticated;

-- Nota: Este script otorga permisos a nivel de Data API. 
-- Asegúrate de que tus políticas de RLS (Row Level Security) estén bien configuradas 
-- para restringir quién puede ver qué filas específicamente.

