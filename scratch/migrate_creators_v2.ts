import { Client } from 'pg';

async function migrate() {
    const password = process.env.DB_PASSWORD || 'VozDatabase2026!';
    const projRef = 'obdrsqeueivhnbsibhen';
    const regions = [
        'eu-central-1',
        'eu-west-1',
        'eu-north-1',
        'us-east-1',
        'us-east-2'
    ];

    let success = false;
    for (const region of regions) {
        const host = `aws-0-${region}.pooler.supabase.com`;
        const client = new Client({
            host,
            port: 6543,
            user: `postgres.${projRef}`,
            password,
            database: 'postgres',
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 5000,
        });

        try {
            console.log(`Connecting to Supabase PostgreSQL (${region})...`);
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
            success = true;
            break;
        } catch (err) {
            console.error(`Migration failed for ${region}:`, (err as Error).message);
        }
    }

    if (!success) {
        console.error("Failed to migrate any region.");
        process.exit(1);
    }
}

migrate();
