-- ============================================================
-- VOZ — Migración system_alerts V2
-- EJECUTAR MANUALMENTE en: Supabase Dashboard > SQL Editor
-- NO ejecutar desde código de servidor.
-- ============================================================

-- 1. Nuevas columnas en system_alerts
ALTER TABLE system_alerts
  ADD COLUMN IF NOT EXISTS nivel        TEXT         DEFAULT 'error',
  ADD COLUMN IF NOT EXISTS stack        TEXT,
  ADD COLUMN IF NOT EXISTS usuario      TEXT,
  ADD COLUMN IF NOT EXISTS plataforma   TEXT,
  ADD COLUMN IF NOT EXISTS version_app  TEXT,
  ADD COLUMN IF NOT EXISTS pantalla     TEXT,
  ADD COLUMN IF NOT EXISTS metadata_json JSONB,
  ADD COLUMN IF NOT EXISTS firma        TEXT,
  ADD COLUMN IF NOT EXISTS ocurrencias  INTEGER      DEFAULT 1,
  ADD COLUMN IF NOT EXISTS usuarios_unicos INTEGER   DEFAULT 1,
  ADD COLUMN IF NOT EXISTS primera_vez  TIMESTAMPTZ  DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS ultima_vez   TIMESTAMPTZ  DEFAULT NOW();

-- 2. Índice para deduplicación rápida por firma
CREATE INDEX IF NOT EXISTS idx_system_alerts_firma
  ON system_alerts(firma)
  WHERE firma IS NOT NULL;

-- 3. Índice para ordenar por frecuencia en el panel
CREATE INDEX IF NOT EXISTS idx_system_alerts_ocurrencias
  ON system_alerts(ocurrencias DESC);

-- 4. Índice por servicio (para filtrado en el panel)
CREATE INDEX IF NOT EXISTS idx_system_alerts_servicio
  ON system_alerts(servicio);

-- ============================================================
-- VERIFICACIÓN: después de ejecutar, comprobar con:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'system_alerts' ORDER BY ordinal_position;
-- ============================================================
