#!/usr/bin/env node
/**
 * scripts/keepalive.js
 * =====================
 * Script de keep-alive para el servidor VOZ.
 *
 * Hace ping periódico al endpoint /api/health para evitar que:
 *   1. Vercel entre en cold-start prolongado (plan Hobby)
 *   2. Supabase pause el proyecto (plan gratuito)
 *
 * USO LOCAL:
 *   node scripts/keepalive.js
 *
 * USO CON PM2 (proceso persistente en servidor propio):
 *   pm2 start scripts/keepalive.js --name voz-keepalive --cron "*/10 * * * *" --no-autorestart
 *
 * Variables de entorno (opcionales):
 *   KEEPALIVE_URL   - URL a hacer ping (por defecto: producción)
 *   KEEPALIVE_INTERVAL_MS - Intervalo en ms (por defecto: 10 minutos)
 */

require('dotenv').config({ path: '.env.production' });

const TARGET_URL =
  process.env.KEEPALIVE_URL ||
  'https://server-taupe-six.vercel.app/api/health';

const INTERVAL_MS = parseInt(process.env.KEEPALIVE_INTERVAL_MS || '600000', 10); // 10 min
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

function timestamp() {
  return new Date().toISOString();
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ping(attempt = 1) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const res = await fetch(TARGET_URL, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'VOZ-KeepAlive/1.0',
        'Cache-Control': 'no-cache',
      },
    });

    clearTimeout(timeout);

    const data = await res.json();

    console.log(
      `[${timestamp()}] ✅ PING OK — status: ${data.status} | supabase: ${data.services?.supabase} | latencia: ${data.uptime_ms}ms`
    );
    return true;
  } catch (err) {
    const isAbort = err.name === 'AbortError';
    const msg = isAbort ? 'TIMEOUT (>15s)' : err.message;

    if (attempt < MAX_RETRIES) {
      console.warn(
        `[${timestamp()}] ⚠️  PING intento ${attempt}/${MAX_RETRIES} fallido: ${msg}. Reintentando en ${RETRY_DELAY_MS / 1000}s...`
      );
      await sleep(RETRY_DELAY_MS);
      return ping(attempt + 1);
    }

    console.error(
      `[${timestamp()}] ❌ PING FALLIDO tras ${MAX_RETRIES} intentos: ${msg}`
    );
    return false;
  }
}

async function main() {
  console.log(`[${timestamp()}] 🚀 VOZ Keep-Alive iniciado`);
  console.log(`[${timestamp()}] 📍 Target: ${TARGET_URL}`);
  console.log(`[${timestamp()}] ⏱️  Intervalo: ${INTERVAL_MS / 1000}s`);
  console.log('─'.repeat(60));

  // Ping inmediato al arrancar
  await ping();

  // Luego cada INTERVAL_MS
  setInterval(async () => {
    await ping();
  }, INTERVAL_MS);
}

main().catch((err) => {
  console.error('Error fatal en keepalive:', err);
  process.exit(1);
});
