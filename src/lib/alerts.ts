import { createHash } from 'crypto';
import { supabaseAdmin } from './db';

export interface AlertPayload {
  servicio: string;
  nivel?: 'info' | 'warning' | 'error' | 'critical';
  error: any;
  usuario?: string;
  plataforma?: string;    // 'ios' | 'android' | 'web'
  version_app?: string;   // '1.3.8'
  pantalla?: string;      // 'CameraScreen', 'PMScreen', etc.
  metadata?: Record<string, any>;
}

/**
 * Genera una firma única para un error combinando servicio, primera línea del
 * mensaje y los 3 primeros frames del stack trace.
 *
 * Esto agrupa el mismo error ocurrido en el mismo lugar, sin agrupar errores
 * distintos que tengan el mismo mensaje (ej: "Cannot read property 'id'" en
 * PMs vs Videos tienen stacks distintos → firmas distintas).
 */
function buildFirma(servicio: string, mensaje: string, stack?: string): string {
  const primeraLinea = (mensaje || '').split('\n')[0].trim().slice(0, 200);

  // Extraer los 3 primeros frames relevantes del stack (saltar el propio logger)
  let top3Frames = '';
  if (stack) {
    const frames = stack
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.startsWith('at ') && !l.includes('logSystemAlert') && !l.includes('alerts.ts'))
      .slice(0, 3)
      .join('|');
    top3Frames = frames;
  }

  const input = `${servicio}\n${primeraLinea}\n${top3Frames}`;
  return createHash('sha256').update(input).digest('hex').slice(0, 32);
}

/**
 * Registra un error en system_alerts con deduplicación por firma.
 *
 * - Si ya existe un registro con la misma firma → incrementa ocurrencias,
 *   actualiza ultima_vez y usuarios_unicos si el usuario es nuevo.
 * - Si es un error nuevo → INSERT con todos los campos.
 *
 * Acepta tanto el nuevo formato estructurado (AlertPayload) como el
 * formato legacy (servicio: string, error: any) para no romper llamadas existentes.
 */
export async function logSystemAlert(
  payloadOrServicio: AlertPayload | string,
  legacyError?: any
): Promise<void> {
  let payload: AlertPayload;

  // Compatibilidad con el formato antiguo: logSystemAlert('Stripe', error)
  if (typeof payloadOrServicio === 'string') {
    payload = { servicio: payloadOrServicio, error: legacyError };
  } else {
    payload = payloadOrServicio;
  }

  const { servicio, error, nivel = 'error', usuario, plataforma, version_app, pantalla, metadata } = payload;

  // Normalizar el error en mensaje + stack
  let mensaje: string;
  let stack: string | undefined;

  if (error instanceof Error) {
    mensaje = error.message || 'Error desconocido';
    stack = error.stack;
  } else if (typeof error === 'object' && error !== null) {
    mensaje = error.message || JSON.stringify(error);
    stack = error.stack;
  } else {
    mensaje = String(error || 'Error desconocido');
  }

  // Siempre loguear en consola primero (queda en logs de Vercel aunque falle la BD)
  console.error(`[SystemAlert][${nivel.toUpperCase()}][${servicio}] ${mensaje}`);

  const firma = buildFirma(servicio, mensaje, stack);

  try {
    // 1. Buscar si ya existe un registro con esta firma
    const { data: existente } = await supabaseAdmin
      .from('system_alerts')
      .select('id, ocurrencias, usuarios_unicos, usuario')
      .eq('firma', firma)
      .maybeSingle();

    if (existente) {
      // Deduplicación: actualizar el registro existente
      const usuariosUnicos = (existente.usuarios_unicos || 1) +
        (usuario && existente.usuario !== usuario ? 1 : 0);

      await supabaseAdmin
        .from('system_alerts')
        .update({
          ocurrencias: (existente.ocurrencias || 1) + 1,
          usuarios_unicos: usuariosUnicos,
          ultima_vez: new Date().toISOString(),
          // Actualizar campos contextuales con los datos más recientes
          usuario: usuario || existente.usuario,
          version_app,
          plataforma,
          pantalla,
          metadata_json: metadata ? metadata : undefined,
        })
        .eq('id', existente.id);
    } else {
      // Error nuevo: INSERT completo
      await supabaseAdmin
        .from('system_alerts')
        .insert({
          servicio,
          nivel,
          mensaje_error: mensaje,    // columna legada — mantener para compatibilidad
          stack,
          usuario,
          plataforma,
          version_app,
          pantalla,
          metadata_json: metadata || null,
          firma,
          ocurrencias: 1,
          usuarios_unicos: 1,
          primera_vez: new Date().toISOString(),
          ultima_vez: new Date().toISOString(),
        });
    }

    // 2. Disparo de alerta crítica si el nivel lo requiere
    if (nivel === 'critical') {
      await maybeTriggerCriticalAlert(servicio, mensaje, firma, existente?.ocurrencias ?? 0);
    }

  } catch (dbErr) {
    // Nunca propagar errores del logger para evitar bucles
    console.error('[SystemAlert] Fallo al guardar en BD:', dbErr);
  }
}

/**
 * Dispara una alerta por email (Resend) cuando un error CRITICAL supera
 * el umbral de 5 ocurrencias en una firma nueva.
 * Solo envía el primer email por firma para no saturar.
 */
async function maybeTriggerCriticalAlert(
  servicio: string,
  mensaje: string,
  firma: string,
  ocurrenciasAntes: number
): Promise<void> {
  // Solo alerta en la primera vez (ocurrenciasAntes === 0 → primer registro)
  // y cuando supera 5 (ocurrenciasAntes === 4 → la 5a ocurrencia)
  if (ocurrenciasAntes !== 0 && ocurrenciasAntes !== 4) return;

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;

  const subject = ocurrenciasAntes === 0
    ? `🚨 [VOZ] Error CRÍTICO nuevo: ${servicio}`
    : `🔴 [VOZ] Error CRÍTICO repetido x5: ${servicio}`;

  const html = `
    <h2 style="color:#d32f2f">⚠️ Alerta Crítica — VOZ Platform</h2>
    <table style="border-collapse:collapse;font-family:monospace;font-size:14px">
      <tr><td style="padding:4px 12px;font-weight:bold">Servicio:</td><td>${servicio}</td></tr>
      <tr><td style="padding:4px 12px;font-weight:bold">Error:</td><td>${mensaje.slice(0, 300)}</td></tr>
      <tr><td style="padding:4px 12px;font-weight:bold">Ocurrencias:</td><td>${ocurrenciasAntes + 1}</td></tr>
      <tr><td style="padding:4px 12px;font-weight:bold">Firma:</td><td style="color:#666">${firma}</td></tr>
      <tr><td style="padding:4px 12px;font-weight:bold">Hora:</td><td>${new Date().toLocaleString('es-ES')}</td></tr>
    </table>
    <p><a href="https://voz-admin.vercel.app/errors">→ Ver en el panel de administración</a></p>
  `;

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'VOZ Alerts <alerts@voz.app>',
        to: ['admin@voz.app'],      // Cambiar por el email real del admin
        subject,
        html,
      }),
    });
  } catch (e) {
    console.warn('[SystemAlert] Fallo al enviar email crítico:', e);
  }
}
