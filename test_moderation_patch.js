/**
 * TEST PASO 2 — Flujo de Moderación
 * Simula la llamada PATCH que hace la app desde handleModerationAction
 *
 * CÓMO USAR:
 *   1. Asegúrate de que el servidor está corriendo (npm run dev)
 *   2. Rellena MODERATION_ITEM_ID con un ID real de tu cola de moderación
 *      (lo encuentras en Supabase, tabla 'moderation_queue')
 *   3. node test_moderation_patch.js
 *
 * QUÉ VERIFICA:
 *   - El servidor responde 200 (no 405 Method Not Allowed)
 *   - El item cambia de estado en Supabase
 *   - El usuario afectado recibe una fila en la tabla 'notifications'
 */

const API_BASE_URL = 'http://localhost:3000'; // Cambiar si el servidor corre en otro puerto

// ─── CONFIGURA ESTOS VALORES ─────────────────────────────────────────────────
const MODERATION_ITEM_ID = 'TU_ID_AQUI';       // ID real de un ítem de moderación
const TEST_ACTION        = 'delete';            // 'keep' | 'delete' | 'ban' | 'shadow_ban'
const EMPLOYEE_HANDLE    = '@admin_test';       // Handle del moderador
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_MAP = {
  'keep':       'approved',
  'delete':     'rejected',
  'ban':        'rejected',
  'shadow_ban': 'pending'
};

async function testModerationPatch() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  TEST PASO 2 — PATCH /api/voz/moderation');
  console.log('═══════════════════════════════════════════════════════\n');

  const payload = {
    id:           MODERATION_ITEM_ID,
    status:       STATUS_MAP[TEST_ACTION] || 'pending',
    employeeName: EMPLOYEE_HANDLE
  };

  console.log('📤 Enviando PATCH con payload:', JSON.stringify(payload, null, 2));

  try {
    const res = await fetch(`${API_BASE_URL}/api/voz/moderation`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (res.status === 405) {
      console.error('❌ ERROR 405 — Method Not Allowed: El handler PATCH no está registrado.');
      console.error('   → Verifica que el servidor se reinició después del cambio en moderation/route.ts');
      return;
    }

    if (res.status === 404) {
      console.warn('⚠️  404 — Ítem no encontrado. Revisa el valor de MODERATION_ITEM_ID.');
      return;
    }

    if (!res.ok) {
      console.error(`❌ ERROR ${res.status}:`, data);
      return;
    }

    console.log(`✅ RESPUESTA OK (${res.status}):`, JSON.stringify(data, null, 2));
    console.log('\n📋 CHECKLIST MANUAL:');
    console.log('   1. Abre Supabase → tabla moderation_queue');
    console.log(`      → El ítem con id="${MODERATION_ITEM_ID}" debe tener status="${payload.status}"`);
    console.log('   2. Abre Supabase → tabla notifications');
    console.log('      → Debe haber una nueva fila con type="moderation" para el creador del video');

  } catch (err) {
    console.error('❌ Error de conexión. ¿Está el servidor corriendo?', err.message);
  }
}

testModerationPatch();
