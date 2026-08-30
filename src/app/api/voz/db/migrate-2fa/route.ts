import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const dbPasswordInput = searchParams.get('password');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    const projRef = match ? match[1] : 'thiftwzubmvcrdhuwcwm';
    const password = dbPasswordInput || process.env.SUPABASE_DB_PASSWORD || 'VozDatabase2026!';

    const host = `aws-1-eu-central-1.pooler.supabase.com`;
    const client = new Client({
        host,
        port: 6543,
        user: `postgres.${projRef}`,
        password,
        database: 'postgres',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 15000,
    });

    try {
        await client.connect();
        const query = `
            ALTER TABLE employees ADD COLUMN IF NOT EXISTS totp_secret TEXT;
            ALTER TABLE employees ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT FALSE;
        `;
        await client.query(query);
        await client.query("NOTIFY pgrst, 'reload schema';");
        await client.end();
        return NextResponse.json({ success: true, message: 'Migration successful! totp columns added.' });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message });
    }
}
