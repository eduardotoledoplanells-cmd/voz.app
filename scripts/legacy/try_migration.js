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

        console.log("Creating table user_follows...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_follows (
                follower_handle TEXT NOT NULL,
                following_handle TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (follower_handle, following_handle)
            );
            ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
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
        console.log("✅ Table created successfully!");
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

    // Try one absolute direct host just in case
    await tryConnect(`db.${projRef}.supabase.co`, 'Direct Host');
}

run();
