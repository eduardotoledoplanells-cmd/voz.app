-- ============================================================
-- VOZ — Migración Hasheo Contraseñas Empleados
-- EJECUTAR MANUALMENTE en: Supabase Dashboard > SQL Editor
-- ============================================================

-- Actualizar la contraseña del admin inicial al hash de bcrypt ('123')
UPDATE public.employees
SET password = '$2b$10$6I3akgvgMTvzj/i9PuN0u.RKsA9xBWEABw9KXKE4eGR6tvE4AB8TS'
WHERE username = 'admin';
