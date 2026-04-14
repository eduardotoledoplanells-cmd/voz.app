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
    console.log(`\nTesting pooler connect: ${name} (${host})...`);
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

        console.log("Adding is_pinned column to videos table...");
        await client.query(`
            ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
            NOTIFY pgrst, 'reload schema';
        `);
        console.log("✅ Column added successfully!");
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
