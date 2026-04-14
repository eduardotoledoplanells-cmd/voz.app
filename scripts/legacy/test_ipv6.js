const { Client } = require('pg');

const password = 'VozDatabase2026!';
const projRef = 'obdrsqeueivhnbsibhen';

// Attempt direct DB connection via its resolved IPv6 address
const host = '2a05:d016:571:a42a:2c9e:ad7a:a789:b45e';

async function run() {
    console.log(`Testing direct IPv6 connection...`);
    const client = new Client({
        host,
        port: 5432,
        user: `postgres`, // For direct connection, user is just "postgres"
        password,
        database: 'postgres',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
    });

    try {
        await client.connect();
        console.log(`✅ SUCCESS for direct IPv6!`);

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
            
            -- also make sure profile insert is possible
        `);
        console.log("✅ RLS policies added successfully!");
        await client.end();
    } catch (err) {
        console.error(`❌ Failed:`, err.message);
    }
}

run();
