import { NextResponse } from 'next/server';
import { Client } from 'pg';

export const dynamic = 'force-dynamic';

const SQL = `
ALTER TABLE IF EXISTS public.app_users ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE IF EXISTS public.app_users ADD COLUMN IF NOT EXISTS region text;
ALTER TABLE IF EXISTS public.app_users ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}';
ALTER TABLE IF EXISTS public.campaigns ADD COLUMN IF NOT EXISTS target_countries text[] DEFAULT '{}';
ALTER TABLE IF EXISTS public.campaigns ADD COLUMN IF NOT EXISTS target_regions text[] DEFAULT '{}';
ALTER TABLE IF EXISTS public.campaigns ADD COLUMN IF NOT EXISTS target_interests text[] DEFAULT '{}';
NOTIFY pgrst, 'reload schema';
`;

export async function GET(request: Request) {
    const authHeader = request.headers.get('x-admin-key');
    if (authHeader !== process.env.ADMIN_SECRET_KEY) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    const projRef = match ? match[1] : 'thiftwzubmvcrdhuwcwm';
    const password = process.env.SUPABASE_DB_PASSWORD || 'VozDatabase2026!';

    const regions = ['eu-central-1', 'eu-west-1', 'eu-north-1', 'us-east-1', 'us-east-2'];
    const poolers = ['aws-1', 'aws-0'];

    let success = false;
    let lastError = '';

    for (const pooler of poolers) {
        for (const region of regions) {
            const host = `${pooler}-${region}.pooler.supabase.com`;
            const client = new Client({
                host,
                port: 6543,
                user: `postgres.${projRef}`,
                password,
                database: 'postgres',
                ssl: { rejectUnauthorized: false },
                connectionTimeoutMillis: 5000,
            });

            try {
                await client.connect();
                await client.query(SQL);
                await client.end();
                success = true;
                break;
            } catch (err: any) {
                lastError = err.message;
                console.error(`[migrate-ad-targeting] Failed for ${host}:`, err.message);
            }
        }
        if (success) break;
    }

    if (success) {
        return NextResponse.json({ success: true, message: '✅ Columnas de segmentación añadidas correctamente' });
    }

    return NextResponse.json({
        success: false,
        error: lastError,
        hint: 'Asegúrate de que SUPABASE_DB_PASSWORD está configurada en Vercel o es correcta.'
    }, { status: 500 });
}
