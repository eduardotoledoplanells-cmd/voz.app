/**
 * TEST PASO 3 — Idempotencia Stripe (compra de monedas)
 * Simula lo que ocurriría si el webhook Y la app enviaran ambos
 * la misma transacción al endpoint /api/voz/purchase.
 *
 * CÓMO USAR:
 *   1. Asegúrate de que el servidor está corriendo (npm run dev)
 *   2. Rellena USER_ID, PAYMENT_INTENT_ID con datos reales de una compra de prueba
 *      → Puedes obtener un paymentIntentId de prueba en tu dashboard Stripe
 *        (https://dashboard.stripe.com/test/payments)
 *   3. node test_stripe_idempotency.js
 *
 * QUÉ VERIFICA:
 *   - La primera llamada: el webhook ya procesó → recibe saldo sin re-procesar
 *   - La segunda llamada: misma idempotencia → misma respuesta, sin duplicado
 *   - El ledger en Supabase solo tiene UN registro por paymentIntentId
 */

const API_BASE_URL = 'http://localhost:3000';

// ─── CONFIGURA ESTOS VALORES ─────────────────────────────────────────────────
const USER_ID          = 'TU_USER_ID_AQUI';         // ID del usuario en Supabase
const PACK_ID          = 'p2';                       // p2 | p3 | p4 | ps | pVIP
const COINS            = 10;                         // Debe coincidir con el pack
const PAYMENT_INTENT_ID = 'pi_XXXXXXXXXXXXXXXXXXXXXXXX'; // PaymentIntent real de Stripe Test
// ─────────────────────────────────────────────────────────────────────────────

async function callPurchaseEndpoint(attempt) {
  console.log(`\n📤 Intento #${attempt} — POST /api/voz/purchase`);
  const res = await fetch(`${API_BASE_URL}/api/voz/purchase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId:          USER_ID,
      packId:          PACK_ID,
      amount:          COINS,
      paymentIntentId: PAYMENT_INTENT_ID
    })
  });

  const data = await res.json();
  console.log(`   Status HTTP: ${res.status}`);
  console.log(`   Respuesta:`, JSON.stringify(data, null, 2));
  return { status: res.status, data };
}

async function testStripeIdempotency() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  TEST PASO 3 — IDEMPOTENCIA /api/voz/purchase');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('⚠️  ESCENARIO: Simulamos que el webhook ya procesó la compra');
  console.log('   y luego la app también intenta confirmar.\n');

  try {
    // Primera llamada (simula que la app llama justo después del webhook)
    const first = await callPurchaseEndpoint(1);

    // Esperamos 500ms y volvemos a llamar (simula retry o doble tap)
    await new Promise(r => setTimeout(r, 500));
    const second = await callPurchaseEndpoint(2);

    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('  ANÁLISIS DE RESULTADOS');
    console.log('═══════════════════════════════════════════════════════\n');

    // Verificar idempotencia
    if (first.data.alreadyProcessed) {
      console.log('✅ Primera llamada: El webhook ya había procesado → responde con saldo actual SIN re-procesar');
    } else if (first.status === 200 && first.data.success) {
      console.log('ℹ️  Primera llamada: El webhook aún no había actuado → procesado por la app (normal si el webhook es lento)');
    } else {
      console.warn('⚠️  Primera llamada: Estado inesperado:', first.data);
    }

    if (second.data.alreadyProcessed) {
      console.log('✅ Segunda llamada: Idempotencia activa → mismo paymentIntentId detectado, SIN re-acreditación');
    } else if (second.status === 200 && second.data.success) {
      console.warn('❌ Segunda llamada: El sistema procesó dos veces el mismo paymentIntentId → verificar idempotencia');
    }

    console.log('\n📋 CHECKLIST MANUAL EN SUPABASE:');
    console.log('   1. Tabla "coin_sales":');
    console.log(`      → Busca stripe_payment_intent_id = "${PAYMENT_INTENT_ID}"`);
    console.log('      → Debe haber EXACTAMENTE 1 fila (no 2)');
    console.log('   2. Tabla "ledger_entries" (o "transactions"):');
    console.log(`      → Debe haber exactamente 1 entrada de tipo "coin_purchase" para el usuario ${USER_ID}`);
    console.log('   3. Saldo del usuario:');
    console.log(`      → Debe haber aumentado en ${COINS} monedas, no en ${COINS * 2}`);

  } catch (err) {
    console.error('❌ Error de conexión. ¿Está el servidor corriendo?', err.message);
  }
}

testStripeIdempotency();
