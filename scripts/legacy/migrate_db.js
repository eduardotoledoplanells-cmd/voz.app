const { Client } = require('pg');

async function run() {
    // Intentaremos con varios hosts posibles si el primero falla
    const hosts = [
        'aws-0-eu-central-1.pooler.supabase.com',
        'aws-0-eu-west-1.pooler.supabase.com',
        'aws-0-us-east-1.pooler.supabase.com'
    ];

    let success = false;
    for (const host of hosts) {
        console.log(`Trying to connect to ${host}...`);
        const client = new Client({
            host,
            port: 6543,
            user: 'postgres.obdrsqeueivhnbsibhen',
            password: 'VozDatabase2026!',
            database: 'postgres',
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 5000,
        });

        try {
            await client.connect();
            console.log('Connected!');

            await client.query(`
                ALTER TABLE videos ADD COLUMN IF NOT EXISTS filter_config JSONB;
                
                DO $$ 
                BEGIN
                    IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'music') = 'text' THEN
                        ALTER TABLE videos ALTER COLUMN music TYPE JSONB USING music::JSONB;
                    END IF;
                EXCEPTION
                    WHEN others THEN 
                        NULL;
                END $$;
                
                -- También nos aseguramos de que los videos rechazados se borren físicamente 
                -- (Esto es por si queda algo pendiente de tareas anteriores)
                DELETE FROM videos WHERE status = 'rejected';
            `);

            console.log('Migration completed successfully on host ' + host);
            await client.end();
            success = true;
            break;
        } catch (err) {
            console.error(`Failed on ${host}:`, err.message);
        }
    }

    if (!success) {
        process.exit(1);
    }
}

run();
