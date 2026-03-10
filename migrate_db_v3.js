const { Client } = require('pg');

async function run() {
    const host = 'obdrsqeueivhnbsibhen.supabase.co';
    console.log(`Connecting to ${host}...`);
    const client = new Client({
        host,
        port: 5432,
        user: 'postgres',
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
        `);

        console.log('Migration successful!');
        await client.end();
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
}

run();
