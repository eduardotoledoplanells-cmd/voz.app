const { Client } = require('pg');

const password = 'VozDatabase2026!';
const projRef = 'obdrsqeueivhnbsibhen';

const regions = [
    'eu-central-1',
    'eu-west-1',
    'eu-west-2',
    'eu-west-3',
    'us-east-1',
    'us-east-2',
    'us-west-1',
    'us-west-2'
];

async function tryConnect(host, name) {
    console.log(`\nTesting connect: ${name} (${host})...`);
    const port = host.includes('pooler') ? 6543 : 5432;
    const user = host.includes('pooler') ? `postgres.${projRef}` : 'postgres';

    const client = new Client({
        host,
        port,
        user,
        password,
        database: 'postgres',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
    });

    try {
        await client.connect();
        console.log(`✅ SUCCESS for ${name}!`);

        console.log("Applying filter_config and music JSONB updates...");
        await client.query(`
            ALTER TABLE videos ADD COLUMN IF NOT EXISTS filter_config JSONB;
            
            DO $$ 
            BEGIN
                IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'music') = 'text' THEN
                    ALTER TABLE videos ALTER COLUMN music TYPE JSONB USING nullif(music, '')::JSONB;
                END IF;
            EXCEPTION
                WHEN others THEN 
                    RAISE NOTICE 'Error al convertir music: %', SQLERRM;
            END $$;
            
            NOTIFY pgrst, 'reload schema';
        `);
        console.log("✅ Migration completed successfully!");
        await client.end();
        return true;
    } catch (err) {
        console.error(`❌ Failed:`, err.message);
        return false;
    }
}

async function run() {
    for (const region of regions) {
        const host = `aws-0-${region}.pooler.supabase.com`;
        const success = await tryConnect(host, region);
        if (success) return;
    }

    // Try a few common variations
    await tryConnect(`db.${projRef}.supabase.co`, 'Direct Host (Standard)');
}

run();
