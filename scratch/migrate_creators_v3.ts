import { Client } from 'pg';

async function migrate() {
    const password = process.env.DB_PASSWORD || 'VozDatabase2026!';
    const projRef = 'obdrsqeueivhnbsibhen';
    const host = `db.${projRef}.supabase.co`;

    const client = new Client({
        host,
        port: 5432,
        user: 'postgres', // Or postgres.obdrsqeueivhnbsibhen ?
        password,
        database: 'postgres',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
    });

    try {
        console.log(`Connecting to Supabase PostgreSQL (${host})...`);
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
        console.error(`Migration failed:`, (err as Error).message);
        process.exit(1);
    }
}

migrate();
