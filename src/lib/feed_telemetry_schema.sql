-- ==============================================================================
-- V2.9.11 PRIMARY TELEMETRY PERSISTENT SINK DDL SCHEMA
-- Target Database: Supabase PostgreSQL (LYVO Production / Staging)
-- Description: Dedicated append-only telemetry store for feed evaluation
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.feed_telemetry_events (
    request_id UUID PRIMARY KEY,
    timestamp_utc TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    user_uuid TEXT NOT NULL,
    experiment_id TEXT NOT NULL,
    variant TEXT NOT NULL,
    total_latency_ms INTEGER NOT NULL,
    q1_latency_ms INTEGER NOT NULL,
    q2_latency_ms INTEGER NOT NULL,
    q3_latency_ms INTEGER NOT NULL,
    q4_latency_ms INTEGER,
    q5_latency_ms INTEGER,
    fallback_fired BOOLEAN NOT NULL DEFAULT false,
    status_code INTEGER NOT NULL,
    timeout BOOLEAN NOT NULL DEFAULT false,
    db_total_latency_ms INTEGER,
    candidates_count INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indices for rapid querying and audit extraction during official 48h windows
CREATE INDEX IF NOT EXISTS idx_feed_telemetry_timestamp ON public.feed_telemetry_events (timestamp_utc);
CREATE INDEX IF NOT EXISTS idx_feed_telemetry_experiment_variant ON public.feed_telemetry_events (experiment_id, variant);

-- Enable Row Level Security (RLS)
ALTER TABLE public.feed_telemetry_events ENABLE ROW LEVEL SECURITY;

-- Allow full access to service_role (used by serverless API and audit scripts)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Service role full access' 
        AND tablename = 'feed_telemetry_events'
    ) THEN
        CREATE POLICY "Service role full access" ON public.feed_telemetry_events FOR ALL USING (true);
    END IF;
END $$;

-- Reload schema cache in PostgREST
NOTIFY pgrst, 'reload schema';
