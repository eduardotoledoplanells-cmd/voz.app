import { Client } from 'pg';

async function migrate() {
    const password = process.env.DB_PASSWORD || 'VozDatabase2026!';
    const projRef = 'obdrsqeueivhnbsibhen';
    const host = `aws-0-eu-central-1.pooler.supabase.com`; // Trial host

    const client = new Client({
        host,
        port: 6543,
        user: `postgres.${projRef}`,
        password,
        database: 'postgres',
        ssl: { rejectUnauthorized: false },
    });

    try {
        console.log("Connecting to Supabase PostgreSQL...");
        await client.connect();
        
        console.log("Adding columns for creators...");
        await client.query(`
            ALTER TABLE app_users ADD COLUMN IF NOT EXISTS real_name TEXT;
            ALTER TABLE app_users ADD COLUMN IF NOT EXISTS dni TEXT;
            ALTER TABLE app_users ADD COLUMN IF NOT EXISTS iban TEXT;
            ALTER TABLE app_users ADD COLUMN IF NOT EXISTS payment_info JSONB;
        `);
        
        console.log("Migration completed successfully.");
        await client.end();
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
