-- ==========================================
-- ECOSISTEMA PUBLICITARIO VOZ: AD ENGINE
-- ==========================================

-- 1. Añadir columnas a tabla campaigns para manejar Prioridades y Packs de Impresiones
ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'Local_Standard',
ADD COLUMN IF NOT EXISTS pack_size INT DEFAULT 0;

-- Nota: El campo "impressions" actual funcionará como nuestro contador decrementable 
-- donde la campaña se pausa cuando impressions >= pack_size. (O si pack_size = 0, es infinito).

-- 2. Trigger para auto-completar campañas cuando el consumo se alcanza
CREATE OR REPLACE FUNCTION check_campaign_impressions_limit()
RETURNS trigger AS $$
BEGIN
    -- Si el pack_size es mayor a 0 y las impresiones lo superan o igualan, marcar como completado
    IF NEW.pack_size > 0 AND NEW.impressions >= NEW.pack_size THEN
        NEW.status := 'completed';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_campaign_impressions ON public.campaigns;
CREATE TRIGGER trigger_check_campaign_impressions
    BEFORE UPDATE OF impressions ON public.campaigns
    FOR EACH ROW
    EXECUTE FUNCTION check_campaign_impressions_limit();

-- Fin de migración.
