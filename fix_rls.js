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
    console.log(`\nTesting: ${name} (${host})...`);
    const client = new Client({
        host,
        port: 6543,
        user: `postgres.${projRef}`,
        password,
        database: 'postgres',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 3000,
    });

    try {
        await client.connect();
        console.log(`✅ SUCCESS for ${name}!`);

        console.log("Setting RLS on moderation_queue...");
        await client.query(`
            ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;
            
            DO $$ 
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public insert' AND tablename = 'moderation_queue') THEN
                    CREATE POLICY "Allow public insert" ON moderation_queue FOR INSERT TO public, anon, authenticated WITH CHECK (true);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public select' AND tablename = 'moderation_queue') THEN
                    CREATE POLICY "Allow public select" ON moderation_queue FOR SELECT TO public, anon, authenticated USING (true);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public update' AND tablename = 'moderation_queue') THEN
                    CREATE POLICY "Allow public update" ON moderation_queue FOR UPDATE TO public, anon, authenticated USING (true);
                END IF;
            END $$;
            NOTIFY pgrst, 'reload schema';
        `);
        console.log("✅ RLS policies added successfully!");
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

    await tryConnect(`db.${projRef}.supabase.co`, 'Direct Host');
}

run();
