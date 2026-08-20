const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: `postgresql://postgres:VozDatabase2026!@db.thiftwzubmvcrdhuwcwm.supabase.co:5432/postgres`,
    ssl: { rejectUnauthorized: false },
    max: 1,
    connectionTimeoutMillis: 15000,
});

const sqlPath = path.join(__dirname, 'migration_ad_engine_ids.sql');
const sqlQuery = fs.readFileSync(sqlPath, 'utf8');

async function main() {
    let client;
    try {
        client = await pool.connect();
        console.log('✅ Connected to Postgres');
        
        await client.query(sqlQuery);
        console.log('✅ Migration applied successfully!');
    } catch (err) {
        console.error('Error applying migration:', err);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

main();
