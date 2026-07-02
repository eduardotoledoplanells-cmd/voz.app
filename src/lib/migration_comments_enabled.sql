-- Migración: Añadir columna comments_enabled a la tabla videos
-- Ejecutar en el panel SQL de Supabase

ALTER TABLE public.videos
ADD COLUMN IF NOT EXISTS comments_enabled BOOLEAN DEFAULT TRUE;

-- Asegurarse de que los vídeos existentes tengan comentarios habilitados
UPDATE public.videos
SET comments_enabled = TRUE
WHERE comments_enabled IS NULL;
