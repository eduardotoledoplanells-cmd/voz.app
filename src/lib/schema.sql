-- Tablas para la App VOZ en Supabase (Versión Robusta)

-- 1. Usuarios de la App
CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    handle TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    reputation INTEGER DEFAULT 10,
    wallet_balance DECIMAL DEFAULT 0,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name TEXT,
    bio TEXT,
    profile_image TEXT,
    is_creator BOOLEAN DEFAULT FALSE,
    push_token TEXT,
    notification_settings JSONB DEFAULT '{}'::jsonb
);

-- 2. Vídeos
CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_url TEXT NOT NULL,
    user_handle TEXT NOT NULL,
    description TEXT,
    music JSONB,
    likes INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_ad BOOLEAN DEFAULT FALSE,
    thumbnail_url TEXT,
    is_pinned BOOLEAN DEFAULT FALSE,
    filter_config JSONB
);

-- 3. Cola de Moderación
CREATE TABLE IF NOT EXISTS moderation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matricula TEXT, -- Identificador visible (estilo matrícula)
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    user_handle TEXT NOT NULL,
    reported_by TEXT,
    content TEXT,
    report_reason TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    moderated_by TEXT, -- Nombre del empleado que moderó
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3.1 Penalizaciones a Usuarios
CREATE TABLE IF NOT EXISTS user_penalties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_handle TEXT NOT NULL,
    content_url TEXT,
    reason TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Transacciones
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_handle TEXT NOT NULL,
    receiver_handle TEXT NOT NULL,
    amount DECIMAL NOT NULL,
    type TEXT NOT NULL,
    video_id UUID,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Ventas de Monedas (Histórico de Stripe)
CREATE TABLE IF NOT EXISTS coin_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_handle TEXT NOT NULL,
    pack_type TEXT NOT NULL,
    price DECIMAL NOT NULL,
    coins INTEGER NOT NULL,
    stripe_payment_intent_id TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'succeeded',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Empleados (Moderadores/Admin)
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role INTEGER DEFAULT 3,
    active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE
);

-- 7. Empresas (Anunciantes)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    legal_name TEXT,
    tax_id TEXT,
    address TEXT,
    city TEXT,
    zip TEXT,
    country TEXT,
    phone TEXT,
    contact_email TEXT,
    balance DECIMAL DEFAULT 0,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Campañas (Publicidad)
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    name TEXT NOT NULL,
    budget DECIMAL DEFAULT 0,
    status TEXT DEFAULT 'draft',
    type TEXT DEFAULT 'video',
    video_url TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    force_view BOOLEAN DEFAULT FALSE,
    target TEXT,
    impressions INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Logs del Sistema (Actividad de empleados)
CREATE TABLE IF NOT EXISTS logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_name TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Productividad de Empleados
CREATE TABLE IF NOT EXISTS productivity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_name TEXT NOT NULL,
    cycle_videos INTEGER DEFAULT 0,
    total_videos INTEGER DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Solicitudes de Canje (Redemptions)
CREATE TABLE IF NOT EXISTS redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_handle TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    method TEXT, -- 'paypal', 'bank_transfer', etc.
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Comentarios de Voz
CREATE TABLE IF NOT EXISTS voice_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL, -- schema.sql uses UUID for videos.id
    user_handle TEXT NOT NULL,
    avatar_url TEXT,
    audio_url TEXT NOT NULL,
    duration TEXT,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    parent_id UUID -- Soporte para hilos de comentarios
);

-- 13. Verificaciones de Creadores
CREATE TABLE IF NOT EXISTS creator_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES app_users(id),
    full_name TEXT,
    dni_number TEXT,
    dni_hash TEXT,
    dni_front_url TEXT,
    dni_back_url TEXT,
    iban TEXT,
    iban_hash TEXT UNIQUE,
    address TEXT,
    postal_code TEXT,
    country TEXT,
    phone TEXT,
    status TEXT DEFAULT 'pending',
    rejection_reason TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Seguimientos entre Usuarios
CREATE TABLE IF NOT EXISTS user_follows (
    follower_handle TEXT REFERENCES app_users(handle),
    following_handle TEXT REFERENCES app_users(handle),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_handle, following_handle)
);

-- 15. Likes en Vídeos
CREATE TABLE IF NOT EXISTS video_likes (
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    user_handle TEXT REFERENCES app_users(handle) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (video_id, user_handle)
);

-- 16. Marcadores (Guardados) de Vídeos
CREATE TABLE IF NOT EXISTS video_bookmarks (
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    user_handle TEXT REFERENCES app_users(handle) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (video_id, user_handle)
);

-- 17. Visualizaciones de Vídeos
CREATE TABLE IF NOT EXISTS video_views (
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    user_handle TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 18. Likes en Comentarios de Voz
CREATE TABLE IF NOT EXISTS voice_comment_likes (
    comment_id UUID REFERENCES voice_comments(id) ON DELETE CASCADE,
    user_handle TEXT REFERENCES app_users(handle) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (comment_id, user_handle)
);

-- 19. Notificaciones
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id TEXT NOT NULL,
    type TEXT,
    title TEXT,
    message TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_status BOOLEAN DEFAULT FALSE
);

-- 20. Lista Negra de Emails
CREATE TABLE IF NOT EXISTS banned_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    reason TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 21. Solicitudes de Retiro (Withdrawal Requests)
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES app_users(id),
    user_handle TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    method TEXT,
    details JSONB,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insertar empleado administrador inicial (password: 123)
INSERT INTO employees (username, password, role) 
VALUES ('admin', '123', 1)
ON CONFLICT (username) DO NOTHING;

-- SUPABASE 2026 COMPATIBILITY: Explicit Grants for Data API
-- This ensures that tables are accessible via supabase-js after May/Oct 2026

-- Access to Schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Grants per Table
GRANT SELECT ON public.app_users TO anon;
GRANT SELECT, INSERT, UPDATE ON public.app_users TO authenticated;
GRANT ALL ON public.app_users TO service_role;

GRANT SELECT ON public.videos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.videos TO authenticated;
GRANT ALL ON public.videos TO service_role;

GRANT ALL ON public.moderation_queue TO service_role;
GRANT SELECT, INSERT ON public.moderation_queue TO authenticated;

GRANT ALL ON public.user_penalties TO service_role;
GRANT SELECT ON public.user_penalties TO authenticated;

GRANT ALL ON public.transactions TO service_role;
GRANT SELECT, INSERT ON public.transactions TO authenticated;

GRANT ALL ON public.coin_sales TO service_role;
GRANT SELECT ON public.coin_sales TO authenticated;

GRANT ALL ON public.employees TO service_role;

GRANT ALL ON public.companies TO service_role;

GRANT SELECT ON public.campaigns TO anon;
GRANT SELECT ON public.campaigns TO authenticated;
GRANT ALL ON public.campaigns TO service_role;

GRANT ALL ON public.logs TO service_role;

GRANT ALL ON public.productivity TO service_role;

GRANT ALL ON public.redemptions TO service_role;
GRANT SELECT, INSERT ON public.redemptions TO authenticated;

GRANT SELECT ON public.voice_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.voice_comments TO authenticated;
GRANT ALL ON public.voice_comments TO service_role;

GRANT ALL ON public.creator_verifications TO service_role;
GRANT SELECT, INSERT ON public.creator_verifications TO authenticated;

GRANT SELECT ON public.user_follows TO anon;
GRANT ALL ON public.user_follows TO authenticated;
GRANT ALL ON public.user_follows TO service_role;

GRANT SELECT ON public.video_likes TO anon;
GRANT ALL ON public.video_likes TO authenticated;
GRANT ALL ON public.video_likes TO service_role;

GRANT ALL ON public.video_bookmarks TO authenticated;
GRANT ALL ON public.video_bookmarks TO service_role;

GRANT SELECT ON public.video_views TO anon;
GRANT ALL ON public.video_views TO authenticated;
GRANT ALL ON public.video_views TO service_role;

GRANT SELECT ON public.voice_comment_likes TO anon;
GRANT ALL ON public.voice_comment_likes TO authenticated;
GRANT ALL ON public.voice_comment_likes TO service_role;

GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

GRANT ALL ON public.banned_emails TO service_role;

GRANT ALL ON public.withdrawal_requests TO service_role;
GRANT SELECT, INSERT ON public.withdrawal_requests TO authenticated;

-- Enable RLS (Security Best Practice)
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productivity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banned_emails ENABLE ROW LEVEL SECURITY;
-- 10. Likes de videos
CREATE TABLE IF NOT EXISTS public.video_likes (
    video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
    user_handle TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (video_id, user_handle)
);

-- 11. Bookmarks de videos
CREATE TABLE IF NOT EXISTS public.video_bookmarks (
    video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
    user_handle TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (video_id, user_handle)
);

-- 12. Seguidores (Follows)
CREATE TABLE IF NOT EXISTS public.user_follows (
    follower_handle TEXT NOT NULL,
    following_handle TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_handle, following_handle)
);

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- LEDGER SYSTEM TABLES & TRIGGERS (Added May 2026)
-- ====================================================================

-- Wallets Table
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
    user_handle TEXT UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('USER', 'SYSTEM')),
    name TEXT NOT NULL UNIQUE,
    available_balance DECIMAL(15, 2) DEFAULT 0.00,
    pending_balance DECIMAL(15, 2) DEFAULT 0.00,
    lifetime_earned DECIMAL(15, 2) DEFAULT 0.00,
    lifetime_spent DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ledger Transactions Table
CREATE TABLE IF NOT EXISTS public.ledger_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    reference_id UUID,
    total_amount DECIMAL(15, 2) NOT NULL,
    idempotency_key TEXT UNIQUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ledger Entries Table
CREATE TABLE IF NOT EXISTS public.ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES public.ledger_transactions(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES public.wallets(id),
    entry_type TEXT NOT NULL CHECK (entry_type IN ('AVAILABLE', 'PENDING')),
    amount DECIMAL(15, 2) NOT NULL,
    before_balance DECIMAL(15, 2) NOT NULL,
    after_balance DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

