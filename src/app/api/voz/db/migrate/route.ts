import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}

function corsHeaders(response: NextResponse) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
}

export async function POST(req: NextRequest) {
    try {
        // SECURITY CHECK: Require strict authorization secret
        const migrationSecret = req.headers.get('x-migration-secret');
        const expectedSecret = process.env.MIGRATION_SECRET;
        
        if (!expectedSecret || migrationSecret !== expectedSecret) {
            console.warn('[Security Warning] Intento de migración no autorizado o secreto no configurado.');
            return corsHeaders(NextResponse.json({ 
                success: false, 
                error: "No autorizado. Clave de migración incorrecta o no configurada." 
            }, { status: 401 }));
        }

        const body = await req.json();
        const { dbPassword, sqlQuery } = body;

        // Configuration from environment variables
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        // Extract project ref from https://<ref>.supabase.co
        const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
        const projRef = match ? match[1] : 'thiftwzubmvcrdhuwcwm';

        const password = dbPassword || process.env.SUPABASE_DB_PASSWORD;
        if (!password) {
            return corsHeaders(NextResponse.json({ 
                success: false, 
                error: "Falta la contraseña de la base de datos." 
            }, { status: 400 }));
        }


        // We will try multiple possible pooler hosts and structures
        const regions = [
            'eu-central-1',
            'eu-west-1',
            'eu-west-2',
            'eu-west-3',
            'eu-north-1',
            'us-east-1',
            'us-east-2',
            'us-west-1',
            'us-west-2',
            'ca-central-1',
            'sa-east-1',
            'ap-northeast-1',
            'ap-northeast-2',
            'ap-northeast-3',
            'ap-south-1',
            'ap-southeast-1',
            'ap-southeast-2'
        ];
        const poolers = ['aws-1', 'aws-0'];

        let success = false;
        let lastError = "";
        let resultData = null;

        const queryToRun = sqlQuery || `
            CREATE TABLE IF NOT EXISTS user_follows (
                follower_handle TEXT NOT NULL,
                following_handle TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (follower_handle, following_handle)
            );
            
            ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
            
            -- Actualización de la tabla videos para filtros y música
            ALTER TABLE videos ADD COLUMN IF NOT EXISTS filter_config JSONB;

            -- Soporte para Creadores Profesionales
            ALTER TABLE app_users ADD COLUMN IF NOT EXISTS real_name TEXT;
            ALTER TABLE app_users ADD COLUMN IF NOT EXISTS dni TEXT;
            ALTER TABLE app_users ADD COLUMN IF NOT EXISTS iban TEXT;
            ALTER TABLE app_users ADD COLUMN IF NOT EXISTS payment_info JSONB;
            ALTER TABLE app_users ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{}'::JSONB;
            
            CREATE TABLE IF NOT EXISTS banned_emails (
                email TEXT PRIMARY KEY,
                phone TEXT,
                reason TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            -- Intentar convertir la columna music a JSONB si es TEXT
            DO $$ 
            BEGIN
                IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'music') = 'text' THEN
                    ALTER TABLE videos ALTER COLUMN music TYPE JSONB USING music::JSONB;
                END IF;
            EXCEPTION
                WHEN others THEN 
                    NULL; -- Ignorar errores si la columna no existe o ya es JSONB
            END $$;

            DO $$ 
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read access' AND tablename = 'user_follows') THEN
                    CREATE POLICY "Public read access" ON user_follows FOR SELECT USING (true);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'All access for authenticated' AND tablename = 'user_follows') THEN
                    CREATE POLICY "All access for authenticated" ON user_follows FOR ALL USING (true);
                END IF;
            END $$;
            
            CREATE TABLE IF NOT EXISTS pm_escrows (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                sender_handle TEXT NOT NULL,
                creator_handle TEXT NOT NULL,
                amount_locked NUMERIC NOT NULL,
                creator_replies INTEGER DEFAULT 0,
                status TEXT DEFAULT 'locked',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            NOTIFY pgrst, 'reload schema';
        `;

        const targets = [
            { host: `${projRef}.supabase.co`, port: 5432, user: 'postgres' },
            { host: `db.${projRef}.supabase.co`, port: 5432, user: 'postgres' },
            { host: `db.${projRef}.supabase.co`, port: 6543, user: `postgres.${projRef}` }
        ];

        for (const pooler of poolers) {
            for (const region of regions) {
                targets.push({
                    host: `${pooler}-${region}.pooler.supabase.com`,
                    port: 6543,
                    user: `postgres.${projRef}`
                });
            }
        }

        const connectionErrors: any[] = [];
        for (const target of targets) {
            console.log(`Connecting to ${target.host}:${target.port} with user ${target.user}...`);
            const client = new Client({
                host: target.host,
                port: target.port,
                user: target.user,
                password,
                database: 'postgres',
                ssl: { rejectUnauthorized: false },
                connectionTimeoutMillis: 5000,
            });

            try {
                await client.connect();
                console.log(`✅ Connected successfully to ${target.host}:${target.port}! Executing query...`);
                const res = await client.query(queryToRun);
                resultData = res.rows;
                await client.end();
                success = true;
                break;
            } catch (err: any) {
                lastError = err.message;
                connectionErrors.push({ host: target.host, port: target.port, user: target.user, error: err.message });
                console.error(`Migration failed for ${target.host}:${target.port}:`, err.message);
            }
        }

        if (success) {
            return corsHeaders(NextResponse.json({ 
                success: true, 
                message: "Base de datos actualizada correctamente.",
                data: resultData 
            }));
        } else {
            return corsHeaders(NextResponse.json({
                success: false,
                error: lastError,
                details: connectionErrors
            }, { status: 500 }));
        }

    } catch (error: any) {
        console.error("Migration route error:", error);
        return corsHeaders(NextResponse.json({ success: false, error: error.message }, { status: 500 }));
    }
}
