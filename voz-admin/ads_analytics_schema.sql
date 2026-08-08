-- SQL schema for advanced Ads Analytics

CREATE TABLE IF NOT EXISTS public.ad_impressions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL,
    user_handle VARCHAR,
    source_channel VARCHAR(20) CHECK (source_channel IN ('app_ios', 'app_android', 'web_desktop', 'web_mobile')),
    view_duration_ms INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ad_clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL,
    user_handle VARCHAR,
    source_channel VARCHAR(20) CHECK (source_channel IN ('app_ios', 'app_android', 'web_desktop', 'web_mobile')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexing for fast queries
CREATE INDEX IF NOT EXISTS idx_ad_impressions_campaign_id ON public.ad_impressions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_created_at ON public.ad_impressions(created_at);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_campaign_id ON public.ad_clicks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_created_at ON public.ad_clicks(created_at);

-- Set up RLS
ALTER TABLE public.ad_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.ad_impressions FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.ad_impressions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable read access for all users" ON public.ad_clicks FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.ad_clicks FOR INSERT WITH CHECK (true);
