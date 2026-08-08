-- ==========================================
-- LYVO ADMIN & APP - RLS SECURITY POLICIES
-- ==========================================

-- 1. Enable Row Level Security (RLS) on all relevant tables
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing overly-permissive policies (if any exist, add DROP POLICY statements here)
-- Example: DROP POLICY IF EXISTS "Public can view users" ON app_users;

-- 3. Create SuperAdmin Global Bypass Policies
-- These policies ensure that ANY user who has the 'superadmin' role in their JWT
-- can perform ALL operations (SELECT, INSERT, UPDATE, DELETE) on these tables.
-- The JWT role is injected by Supabase Auth into `auth.jwt() ->> 'role'`.

CREATE POLICY "SuperAdmins can do everything on app_users"
ON app_users FOR ALL
USING (auth.jwt() ->> 'role' = 'superadmin')
WITH CHECK (auth.jwt() ->> 'role' = 'superadmin');

CREATE POLICY "SuperAdmins can do everything on kyc_documents"
ON kyc_documents FOR ALL
USING (auth.jwt() ->> 'role' = 'superadmin')
WITH CHECK (auth.jwt() ->> 'role' = 'superadmin');

CREATE POLICY "SuperAdmins can do everything on creator_verifications"
ON creator_verifications FOR ALL
USING (auth.jwt() ->> 'role' = 'superadmin')
WITH CHECK (auth.jwt() ->> 'role' = 'superadmin');

CREATE POLICY "SuperAdmins can do everything on voice_comments"
ON voice_comments FOR ALL
USING (auth.jwt() ->> 'role' = 'superadmin')
WITH CHECK (auth.jwt() ->> 'role' = 'superadmin');

CREATE POLICY "SuperAdmins can do everything on voice_comment_likes"
ON voice_comment_likes FOR ALL
USING (auth.jwt() ->> 'role' = 'superadmin')
WITH CHECK (auth.jwt() ->> 'role' = 'superadmin');

CREATE POLICY "SuperAdmins can do everything on video_likes"
ON video_likes FOR ALL
USING (auth.jwt() ->> 'role' = 'superadmin')
WITH CHECK (auth.jwt() ->> 'role' = 'superadmin');

CREATE POLICY "SuperAdmins can do everything on video_views"
ON video_views FOR ALL
USING (auth.jwt() ->> 'role' = 'superadmin')
WITH CHECK (auth.jwt() ->> 'role' = 'superadmin');

CREATE POLICY "SuperAdmins can do everything on video_bookmarks"
ON video_bookmarks FOR ALL
USING (auth.jwt() ->> 'role' = 'superadmin')
WITH CHECK (auth.jwt() ->> 'role' = 'superadmin');

CREATE POLICY "SuperAdmins can do everything on user_penalties"
ON user_penalties FOR ALL
USING (auth.jwt() ->> 'role' = 'superadmin')
WITH CHECK (auth.jwt() ->> 'role' = 'superadmin');

CREATE POLICY "SuperAdmins can do everything on employees"
ON employees FOR ALL
USING (auth.jwt() ->> 'role' = 'superadmin')
WITH CHECK (auth.jwt() ->> 'role' = 'superadmin');

CREATE POLICY "SuperAdmins can do everything on videos"
ON videos FOR ALL
USING (auth.jwt() ->> 'role' = 'superadmin')
WITH CHECK (auth.jwt() ->> 'role' = 'superadmin');

CREATE POLICY "SuperAdmins can do everything on moderation_queue"
ON moderation_queue FOR ALL
USING (auth.jwt() ->> 'role' = 'superadmin')
WITH CHECK (auth.jwt() ->> 'role' = 'superadmin');

CREATE POLICY "SuperAdmins can do everything on companies"
ON companies FOR ALL
USING (auth.jwt() ->> 'role' = 'superadmin')
WITH CHECK (auth.jwt() ->> 'role' = 'superadmin');

CREATE POLICY "SuperAdmins can do everything on notifications"
ON notifications FOR ALL
USING (auth.jwt() ->> 'role' = 'superadmin')
WITH CHECK (auth.jwt() ->> 'role' = 'superadmin');

CREATE POLICY "SuperAdmins can do everything on campaigns"
ON campaigns FOR ALL
USING (auth.jwt() ->> 'role' = 'superadmin')
WITH CHECK (auth.jwt() ->> 'role' = 'superadmin');

-- 4. Note for public access
-- If the mobile app or web app needs public access to some of these tables 
-- (e.g. users viewing their own videos, or public feed), YOU MUST create 
-- specific restrictive policies for them.
-- 
-- For example, for the mobile app users:
-- CREATE POLICY "Users can view public videos"
-- ON videos FOR SELECT
-- USING (status = 'public');
--
-- Right now, by default (since RLS is enabled and no other policies exist),
-- ONLY SuperAdmins can access these tables. All other direct access is denied.
