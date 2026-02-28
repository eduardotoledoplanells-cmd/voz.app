const { Client } = require('pg');

const client = new Client({
    host: 'db.obdrsqeueivhnbsibhen.supabase.co',
    port: 5432,
    user: 'postgres',
    password: 'VozDatabase2026!',
    database: 'postgres',
});

async function run() {
    try {
        await client.connect();
        console.log("Connected to direct PostgreSQL database!");

        await client.query(`
        ALTER TABLE videos 
        ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
        ADD COLUMN IF NOT EXISTS is_ad BOOLEAN DEFAULT false;
        NOTIFY pgrst, 'reload schema';
    `);
        console.log("Added thumbnail_url and is_ad column to videos, and triggered schema reload!");

    } catch (err) {
        console.error("Error connecting to DB directly:", err);
    } finally {
        await client.end();
    }
}
run();
