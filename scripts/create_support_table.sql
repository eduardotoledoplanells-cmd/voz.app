CREATE TABLE IF NOT EXISTS public.support_messages (
    id uuid default gen_random_uuid() primary key,
    user_handle text not null,
    message text not null,
    is_from_admin boolean default false,
    read_status boolean default false,
    created_at timestamp with time zone default now()
);

-- Habilitar Role Level Security si es necesario, o dar acceso a anónimos (si es API interna de Supabase)
-- Ya que usamos el service_role key en el backend, no hace falta RLS complejo, pero por si acaso:
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts to support_messages" ON public.support_messages
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select on support_messages" ON public.support_messages
    FOR SELECT USING (true);
