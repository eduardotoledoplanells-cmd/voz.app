const { Client } = require('pg');

const host = 'aws-1-eu-central-1.pooler.supabase.com';
const port = 6543;
const user = 'postgres.thiftwzubmvcrdhuwcwm';
const password = 'VozDatabase2026!';
const database = 'postgres';

async function migrate() {
    console.log('Connecting to active pooler...');
    const client = new Client({
        host,
        port,
        user,
        password,
        database,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
    });

    try {
        await client.connect();
        console.log('✅ Connected! Running queries...');
        
        const query = `
            ALTER TABLE employees ADD COLUMN IF NOT EXISTS totp_secret TEXT;
            ALTER TABLE employees ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT FALSE;
        `;
        
        await client.query(query);
        console.log('✅ Migration succeeded! totp_secret and totp_enabled columns added to employees table.');
        
        await client.query("NOTIFY pgrst, 'reload schema';");
        console.log('✅ PostgREST schema cache reloaded.');
        
        await client.end();
    } catch (e) {
        console.error('❌ Migration failed:', e);
    }
}

migrate();
