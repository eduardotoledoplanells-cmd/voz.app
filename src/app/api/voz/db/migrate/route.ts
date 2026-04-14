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
        const body = await req.json();
        const { dbPassword } = body;

        // Configuration
        const password = dbPassword || 'VozDatabase2026!';
        const projRef = 'obdrsqeueivhnbsibhen';

        // We will try multiple possible pooler hosts
        const regions = [
            'eu-central-1',
            'eu-west-1',
            'eu-north-1',
            'us-east-1',
            'us-east-2'
        ];

        let success = false;
        let lastError = "";

        for (const region of regions) {
            const host = `aws-0-${region}.pooler.supabase.com`;
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

                await client.query(`
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
                    
                    NOTIFY pgrst, 'reload schema';
                `);

                await client.end();
                success = true;
                break;
            } catch (err: any) {
                lastError = err.message;
                console.error(`Migration failed for ${region}:`, err.message);
            }
        }

        if (success) {
            return corsHeaders(NextResponse.json({ success: true, message: "Base de datos actualizada correctamente." }));
        } else {
            return corsHeaders(NextResponse.json({
                success: false,
                error: lastError,
                details: "No se pudo conectar con la base de datos Supabase con las credenciales actuales."
            }, { status: 500 }));
        }

    } catch (error: any) {
        console.error("Migration route error:", error);
        return corsHeaders(NextResponse.json({ success: false, error: error.message }, { status: 500 }));
    }
}
