-- Habilitar RLS en las tablas
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_analytics_daily ENABLE ROW LEVEL SECURITY;

-- 1. Políticas para ad_campaigns
-- SuperAdmin puede ver todo
CREATE POLICY "SuperAdmin can view all campaigns" ON public.ad_campaigns
    FOR SELECT
    USING (auth.jwt() ->> 'role' = 'SuperAdmin');

-- Advertiser solo puede ver sus propias campañas (donde el advertiser_id coincida con su auth.uid)
CREATE POLICY "Advertisers can view their own campaigns" ON public.ad_campaigns
    FOR SELECT
    USING (auth.jwt() ->> 'role' = 'Advertiser' AND advertiser_id = auth.uid());

-- 2. Políticas para ad_impressions
-- SuperAdmin puede ver todo
CREATE POLICY "SuperAdmin can view all impressions" ON public.ad_impressions
    FOR SELECT
    USING (auth.jwt() ->> 'role' = 'SuperAdmin');

-- Advertiser solo puede ver las impresiones de sus propias campañas
CREATE POLICY "Advertisers can view their own campaign impressions" ON public.ad_impressions
    FOR SELECT
    USING (
        auth.jwt() ->> 'role' = 'Advertiser' 
        AND campaign_id IN (
            SELECT id FROM public.ad_campaigns WHERE advertiser_id = auth.uid()
        )
    );

-- 3. Políticas para ad_clicks
-- SuperAdmin puede ver todo
CREATE POLICY "SuperAdmin can view all clicks" ON public.ad_clicks
    FOR SELECT
    USING (auth.jwt() ->> 'role' = 'SuperAdmin');

-- Advertiser solo puede ver los clics de sus propias campañas
CREATE POLICY "Advertisers can view their own campaign clicks" ON public.ad_clicks
    FOR SELECT
    USING (
        auth.jwt() ->> 'role' = 'Advertiser' 
        AND campaign_id IN (
            SELECT id FROM public.ad_campaigns WHERE advertiser_id = auth.uid()
        )
    );

-- 4. Políticas para ad_analytics_daily
-- SuperAdmin puede ver todo
CREATE POLICY "SuperAdmin can view all daily analytics" ON public.ad_analytics_daily
    FOR SELECT
    USING (auth.jwt() ->> 'role' = 'SuperAdmin');

-- Advertiser solo puede ver analíticas de sus propias campañas
CREATE POLICY "Advertisers can view their own daily analytics" ON public.ad_analytics_daily
    FOR SELECT
    USING (
        auth.jwt() ->> 'role' = 'Advertiser' 
        AND campaign_id IN (
            SELECT id FROM public.ad_campaigns WHERE advertiser_id = auth.uid()
        )
    );

-- 5. Tabla para los Magic Links (Token)
CREATE TABLE IF NOT EXISTS public.ad_magic_links (
    token_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.ad_magic_links ENABLE ROW LEVEL SECURITY;

-- Magic links table policies
CREATE POLICY "SuperAdmin can manage magic links" ON public.ad_magic_links
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'SuperAdmin');

-- Cualquiera puede consultar la tabla de magic links si conoce el token exacto y no ha expirado
-- Esta política permite al endpoint validar el token sin autenticación
CREATE POLICY "Public can view valid magic links" ON public.ad_magic_links
    FOR SELECT
    USING (expires_at > NOW());
