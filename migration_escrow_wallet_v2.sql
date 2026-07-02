-- ============================================================
-- VOZ — Migración Billetera de Custodia de Retiros (V2)
-- EJECUTAR MANUALMENTE en: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Insertar el monedero del sistema para retiros en tránsito
INSERT INTO public.wallets (id, type, name, available_balance, pending_balance)
VALUES ('00000000-0000-0000-0000-000000000005', 'SYSTEM', 'SYSTEM_WALLET_WITHDRAWALS_PENDING', 0, 0)
ON CONFLICT (id) DO NOTHING;
