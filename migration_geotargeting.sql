-- 1. Create tables for Geographic Hierarchy
CREATE TABLE IF NOT EXISTS public.countries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.regions (
    id SERIAL PRIMARY KEY,
    country_id INT NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    UNIQUE (country_id, name)
);

CREATE TABLE IF NOT EXISTS public.municipalities (
    id SERIAL PRIMARY KEY,
    region_id INT NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    UNIQUE (region_id, name)
);

-- 2. Insert dummy data for Spain (España)
INSERT INTO public.countries (name) VALUES ('España') ON CONFLICT DO NOTHING;

DO $$
DECLARE
  esp_id INT;
  madrid_id INT;
  valencia_id INT;
BEGIN
  SELECT id INTO esp_id FROM public.countries WHERE name = 'España';

  -- Insert regions
  INSERT INTO public.regions (country_id, name) VALUES (esp_id, 'Comunidad de Madrid') ON CONFLICT DO NOTHING;
  INSERT INTO public.regions (country_id, name) VALUES (esp_id, 'Comunidad Valenciana') ON CONFLICT DO NOTHING;
  
  -- Insert municipalities
  SELECT id INTO madrid_id FROM public.regions WHERE name = 'Comunidad de Madrid';
  INSERT INTO public.municipalities (region_id, name) VALUES (madrid_id, 'Madrid') ON CONFLICT DO NOTHING;
  INSERT INTO public.municipalities (region_id, name) VALUES (madrid_id, 'Móstoles') ON CONFLICT DO NOTHING;
  INSERT INTO public.municipalities (region_id, name) VALUES (madrid_id, 'Alcalá de Henares') ON CONFLICT DO NOTHING;

  SELECT id INTO valencia_id FROM public.regions WHERE name = 'Comunidad Valenciana';
  INSERT INTO public.municipalities (region_id, name) VALUES (valencia_id, 'Valencia') ON CONFLICT DO NOTHING;
  INSERT INTO public.municipalities (region_id, name) VALUES (valencia_id, 'Alicante') ON CONFLICT DO NOTHING;
  INSERT INTO public.municipalities (region_id, name) VALUES (valencia_id, 'Elche') ON CONFLICT DO NOTHING;
END $$;


-- 3. Modify app_users to include geographic relations
ALTER TABLE public.app_users 
ADD COLUMN IF NOT EXISTS country_id INT REFERENCES public.countries(id),
ADD COLUMN IF NOT EXISTS region_id INT REFERENCES public.regions(id),
ADD COLUMN IF NOT EXISTS municipality_id INT REFERENCES public.municipalities(id);

-- 4. Modify campaigns to include target_municipalities array
ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS target_municipalities INT[];

-- 5. RPC function to estimate reach
CREATE OR REPLACE FUNCTION estimate_campaign_reach(target_muni_ids INT[])
RETURNS INT AS $$
DECLARE
    reach_count INT;
BEGIN
    IF target_muni_ids IS NULL OR array_length(target_muni_ids, 1) IS NULL THEN
        -- If no municipalities specified, assume all active users (or return 0 based on logic)
        SELECT COUNT(*) INTO reach_count FROM public.app_users WHERE status = 'active' OR status = 'verified';
    ELSE
        SELECT COUNT(*) INTO reach_count 
        FROM public.app_users 
        WHERE municipality_id = ANY(target_muni_ids) 
        AND (status = 'active' OR status = 'verified');
    END IF;

    RETURN reach_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Expose to Postgrest (if necessary)
GRANT EXECUTE ON FUNCTION estimate_campaign_reach(INT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION estimate_campaign_reach(INT[]) TO anon;
GRANT EXECUTE ON FUNCTION estimate_campaign_reach(INT[]) TO service_role;
