import { Client } from 'pg';

async function migrate() {
    const password = process.env.DB_PASSWORD || 'VozDatabase2026!';
    const projRef = 'obdrsqeueivhnbsibhen';
    const host = `db.${projRef}.supabase.co`;

    const client = new Client({
        host,
        port: 5432,
        user: 'postgres',
        password,
        database: 'postgres',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
    });

    try {
        console.log(`Connecting to Supabase PostgreSQL (${host})...`);
        await client.connect();
        
        console.log("Adding 'phone' column to app_users and creator_verifications...");
        await client.query(`
            ALTER TABLE app_users ADD COLUMN IF NOT EXISTS phone TEXT;
            ALTER TABLE creator_verifications ADD COLUMN IF NOT EXISTS phone TEXT;
        `);
        
        console.log("Migration completed successfully.");
        await client.end();
    } catch (err) {
        console.error(`Migration failed:`, (err as Error).message);
        process.exit(1);
    }
}

migrate();
