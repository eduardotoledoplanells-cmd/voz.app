import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET /api/health
// ─────────────────────────────────────────────────────────────────────────────
// Endpoint de keep-alive. Mantiene activos:
//   • Vercel serverless (evita cold start prolongado en plan Hobby)
//   • Supabase (evita pausa del proyecto en plan gratuito)
//
// Se llama cada 10 minutos por:
//   1. Vercel Cron (vercel.json) — integrado nativamente, sin coste extra
//   2. GitHub Actions (.github/workflows/keepalive.yml) — redundancia externa
// ─────────────────────────────────────────────────────────────────────────────
export async function GET() {
  const startTime = Date.now();

  let supabaseStatus: 'ok' | 'error' | 'skipped' = 'skipped';
  let supabaseMs = 0;
  let supabaseError: string | null = null;

  // Proyecto Supabase activo: thiftwzubmvcrdhuwcwm (producción, más reciente)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
      });

      const t0 = Date.now();

      // Query mínima sobre la tabla real del proyecto
      // PGRST116 = "0 rows" → válido, no es un error
      const { error } = await supabase
        .from('app_users')
        .select('id')
        .limit(1)
        .maybeSingle();

      supabaseMs = Date.now() - t0;

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      supabaseStatus = 'ok';
    } catch (err: unknown) {
      supabaseStatus = 'error';
      supabaseError = err instanceof Error ? err.message : 'Unknown error';
    }
  }

  const totalMs = Date.now() - startTime;

  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime_ms: totalMs,
      services: {
        api: 'ok',
        supabase: supabaseStatus,
        ...(supabaseMs > 0 && { supabase_ping_ms: supabaseMs }),
        ...(supabaseError && { supabase_error: supabaseError }),
      },
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Keep-Alive': 'true',
      },
    }
  );
}
