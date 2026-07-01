import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const DDL_STATEMENTS = [
    `ALTER TABLE IF EXISTS public.app_users ADD COLUMN IF NOT EXISTS country text`,
    `ALTER TABLE IF EXISTS public.app_users ADD COLUMN IF NOT EXISTS region text`,
    `ALTER TABLE IF EXISTS public.app_users ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}'`,
    `ALTER TABLE IF EXISTS public.campaigns ADD COLUMN IF NOT EXISTS target_countries text[] DEFAULT '{}'`,
    `ALTER TABLE IF EXISTS public.campaigns ADD COLUMN IF NOT EXISTS target_regions text[] DEFAULT '{}'`,
    `ALTER TABLE IF EXISTS public.campaigns ADD COLUMN IF NOT EXISTS target_interests text[] DEFAULT '{}'`,
];

export async function GET(request: Request) {
    const authHeader = request.headers.get('x-admin-key');
    if (authHeader !== process.env.ADMIN_SECRET_KEY) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { persistSession: false }
    });

    const results: { sql: string; ok: boolean; error?: string }[] = [];

    for (const stmt of DDL_STATEMENTS) {
        const { error } = await supabase.rpc('exec_sql_admin', { sql: stmt });
        if (error) {
            results.push({ sql: stmt.substring(0, 80), ok: false, error: error.message });
        } else {
            results.push({ sql: stmt.substring(0, 80), ok: true });
        }
    }

    // Notify PostgREST to reload schema
    await supabase.rpc('exec_sql_admin', { sql: `NOTIFY pgrst, 'reload schema'` }).catch(() => {});

    const allOk = results.every(r => r.ok);
    return NextResponse.json({
        success: allOk,
        message: allOk ? '✅ Migración completada con éxito' : '⚠️ Algunos comandos fallaron',
        results
    });
}
