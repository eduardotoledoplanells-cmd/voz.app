import { Client } from 'pg';

async function migrate() {
    const password = process.env.DB_PASSWORD || 'VozDatabase2026!';
    const projRef = 'obdrsqeueivhnbsibhen';
    // Using the official connection string format for Supabase
    const connectionString = `postgresql://postgres.${projRef}:${password}@db.${projRef}.supabase.co:5432/postgres`;

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false },
    });

    try {
        console.log(`Connecting to Supabase PostgreSQL via connection string...`);
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
