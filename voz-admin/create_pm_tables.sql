-- create_pm_tables.sql

-- 1. Tabla para los "escrows" o conversaciones de chat
CREATE TABLE IF NOT EXISTS public.pm_escrows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_handle TEXT NOT NULL,
    creator_handle TEXT NOT NULL,
    sender_name TEXT,
    creator_name TEXT,
    sender_avatar TEXT,
    creator_avatar TEXT,
    status TEXT DEFAULT 'active',
    hasNew BOOLEAN DEFAULT false,
    unread_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (sender_handle, creator_handle)
);

-- 2. Tabla para los mensajes individuales
CREATE TABLE IF NOT EXISTS public.pm_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escrow_id UUID NOT NULL REFERENCES public.pm_escrows(id) ON DELETE CASCADE,
    sender_handle TEXT NOT NULL,
    content TEXT NOT NULL,
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Índices para optimizar las consultas del backend
CREATE INDEX IF NOT EXISTS idx_pm_escrows_handles ON public.pm_escrows(sender_handle, creator_handle);
CREATE INDEX IF NOT EXISTS idx_pm_messages_escrow ON public.pm_messages(escrow_id);

-- 4. Habilitar Realtime para los mensajes de chat para que la app reaccione en vivo
alter publication supabase_realtime add table pm_messages;
