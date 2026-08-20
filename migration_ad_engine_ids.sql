ALTER TABLE IF EXISTS public.campaigns ADD COLUMN IF NOT EXISTS target_region_ids integer[] DEFAULT '{}';
ALTER TABLE IF EXISTS public.campaigns ADD COLUMN IF NOT EXISTS target_municipality_ids integer[] DEFAULT '{}';
