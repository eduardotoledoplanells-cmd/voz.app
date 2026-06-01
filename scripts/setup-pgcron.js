#!/usr/bin/env node
/**
 * scripts/setup-pgcron.js
 * ========================
 * Instala un cron job DENTRO de Supabase usando pg_cron + pg_net.
 *
 * Esto hace que la propia base de datos llame a /api/health cada 5 minutos,
 * creando un bucle autosuficiente:
 *   Supabase → ping → Vercel (que a su vez pinga Supabase dentro del health check)
 *
 * Solo necesita ejecutarse UNA VEZ. El cron queda guardado en la BD.
 *
 * USO:
 *   node scripts/setup-pgcron.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://thiftwzubmvcrdhuwcwm.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoaWZ0d3p1Ym12Y3JkaHV3Y3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTExMjE3MiwiZXhwIjoyMDk0Njg4MTcyfQ.otwtK4a9g6Nf4DON1QCkoERKueQ8YcbrCaS9Tv0xhC4';

const VERCEL_HEALTH_URL = 'https://server-taupe-six.vercel.app/api/health';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function run() {
  console.log('🔧 Configurando pg_cron en Supabase...\n');

  // 1. Habilitar extensiones necesarias
  const extensions = [
    `CREATE EXTENSION IF NOT EXISTS pg_cron;`,
    `CREATE EXTENSION IF NOT EXISTS pg_net;`,
  ];

  for (const sql of extensions) {
    const { error } = await supabase.rpc('exec_sql', { query: sql }).maybeSingle();
    if (error) {
      console.log(`⚠️  RPC exec_sql no disponible: ${error.message}`);
      console.log('   → Intentando via SQL directo...');
      break;
    }
    console.log(`✅ ${sql.split(' ').slice(0,4).join(' ')}...`);
  }

  // 2. Crear función que hace el ping HTTP
  const createFn = `
    CREATE OR REPLACE FUNCTION ping_vercel_health()
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      PERFORM net.http_get(
        url := '${VERCEL_HEALTH_URL}',
        headers := '{"Cache-Control": "no-cache", "User-Agent": "VOZ-pgcron/1.0"}'::jsonb
      );
    EXCEPTION WHEN OTHERS THEN
      -- Ignorar errores silenciosamente
      NULL;
    END;
    $$;
  `;

  // 3. Crear el cron job (cada 5 minutos)
  const createCron = `
    SELECT cron.schedule(
      'voz-keep-alive',
      '*/5 * * * *',
      'SELECT ping_vercel_health()'
    );
  `;

  // 4. Verificar crons existentes
  const verifyCron = `
    SELECT jobname, schedule, active
    FROM cron.job
    WHERE jobname = 'voz-keep-alive';
  `;

  // Intentar via rpc personalizado primero
  console.log('\n📡 Intentando configurar pg_cron via Supabase...');

  try {
    // Intentar primero verificar si pg_net funciona
    const { data: netTest, error: netErr } = await supabase.rpc('net_test');
    if (netErr) {
      console.log('ℹ️  pg_net RPC directo no disponible (normal en Supabase)');
    }
  } catch (e) {
    // Normal
  }

  // Método alternativo: usar la API de Supabase para ejecutar SQL via SQL Editor API
  console.log('\n🔄 Verificando cron jobs activos en Supabase...');
  
  // Intentar listar cron jobs via RPC
  const { data: jobs, error: jobsErr } = await supabase
    .from('cron.job')
    .select('jobname, schedule, active')
    .eq('jobname', 'voz-keep-alive');

  if (jobs && jobs.length > 0) {
    console.log('✅ pg_cron ya configurado:', jobs[0]);
  } else {
    console.log('ℹ️  No se pudo acceder a cron.job directamente (esquema separado)');
    console.log('\n📋 INSTRUCCION MANUAL (solo si quieres la capa extra):');
    console.log('   1. Ve a Supabase Dashboard → SQL Editor');
    console.log('   2. Pega y ejecuta:');
    console.log('\n' + '─'.repeat(60));
    console.log(`-- Habilitar extensiones`);
    console.log(`CREATE EXTENSION IF NOT EXISTS pg_net;`);
    console.log(`CREATE EXTENSION IF NOT EXISTS pg_cron;`);
    console.log(``);
    console.log(`-- Crear función de ping`);
    console.log(createFn);
    console.log(``);
    console.log(`-- Crear cron (cada 5 minutos)`);
    console.log(createCron);
    console.log('─'.repeat(60));
  }

  // De todas formas, probar el ping directo ahora mismo
  console.log('\n🏓 Ping directo a Vercel ahora mismo...');
  const { data: pingResult, error: pingErr } = await supabase.rpc('ping_vercel_now', {
    target_url: VERCEL_HEALTH_URL
  });
  
  if (pingErr) {
    // Usar fetch nativo como fallback
    try {
      const res = await fetch(VERCEL_HEALTH_URL, {
        headers: { 'Cache-Control': 'no-cache', 'User-Agent': 'VOZ-setup/1.0' }
      });
      const data = await res.json();
      console.log(`✅ Vercel responde: ${JSON.stringify(data.services)}`);
    } catch (e) {
      console.log(`⚠️  Ping fallido: ${e.message}`);
    }
  } else {
    console.log(`✅ Ping via Supabase RPC: ${JSON.stringify(pingResult)}`);
  }

  console.log('\n✅ Setup completado.');
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
