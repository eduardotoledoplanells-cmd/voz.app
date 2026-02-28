const { Client } = require('pg');

const client = new Client({
    host: 'aws-0-eu-north-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.obdrsqeueivhnbsibhen',
    password: 'VozDatabase2026!',
    database: 'postgres',
});

async function run() {
    try {
        await client.connect();
        console.log("Connected to PostgreSQL pooler!");

        await client.query(`
        ALTER TABLE videos 
        ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
        ADD COLUMN IF NOT EXISTS is_ad BOOLEAN DEFAULT false;
    `);
        console.log("Added thumbnail_url and is_ad column to videos!");

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}
run();
