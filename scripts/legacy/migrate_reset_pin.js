const { Client } = require('pg');

const password = 'VozDatabase2026!';
const host = '2a05:d016:571:a42a:2c9e:ad7a:a789:b45e';

async function migrate() {
    console.log(`Connecting to database via IPv6: ${host}...`);
    const client = new Client({
        host,
        port: 5432,
        user: `postgres`,
        password,
        database: 'postgres',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
    });

    try {
        await client.connect();
        console.log("✅ Connected to Supabase Postgres.");

        console.log("Adding reset_pin column to app_users...");
        await client.query(`ALTER TABLE app_users ADD COLUMN IF NOT EXISTS reset_pin TEXT;`);
        
        console.log("Reloading PostgREST schema...");
        await client.query(`NOTIFY pgrst, 'reload schema';`);
        
        console.log("✅ Column 'reset_pin' added successfully!");
    } catch (err) {
        console.error("❌ Migration failed:", err.message);
        if (err.stack) console.error(err.stack);
    } finally {
        await client.end();
    }
}

migrate();
