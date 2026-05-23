import { supabaseAdmin } from './db';

/**
 * Inserts a system alert/critical error log into the system_alerts table.
 * 
 * @param servicio Name of the service (e.g., 'Stripe', 'Ledger', 'KYC', 'Upload')
 * @param error The error message or error object to log
 */
export async function logSystemAlert(servicio: string, error: any) {
  const mensaje_error = error instanceof Error 
    ? `${error.message}${error.stack ? `\n${error.stack}` : ''}` 
    : typeof error === 'object' 
      ? JSON.stringify(error) 
      : String(error);

  console.error(`[System Alert] [${servicio}] ${mensaje_error}`);

  try {
    const { error: dbError } = await supabaseAdmin
      .from('system_alerts')
      .insert({
        servicio,
        mensaje_error,
      });

    if (dbError) {
      console.error('[System Alert] Failed to insert alert into database:', dbError);
    }
  } catch (err) {
    console.error('[System Alert] Exception while logging system alert:', err);
  }
}
