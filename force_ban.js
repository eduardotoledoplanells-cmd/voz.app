const { Client } = require('pg');

const handleToBan = '@usuario';
const projRef = 'obdrsqeueivhnbsibhen';
const password = 'VozDatabase2026!';

async function forceBan() {
    const host = `aws-0-eu-central-1.pooler.supabase.com`; // Trying default region
    const client = new Client({
        host,
        port: 6543,
        user: `postgres.${projRef}`,
        password,
        database: 'postgres',
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("Connected to Postgres!");

        // 1. Ban user
        const resUser = await client.query("UPDATE app_users SET status = 'banned' WHERE handle ILIKE $1", [handleToBan]);
        console.log(`Banned user ${handleToBan}: ${resUser.rowCount} rows updated.`);

        // 2. Clear moderation queue
        const resQueue = await client.query("UPDATE moderation_queue SET status = 'rejected', moderated_by = 'SYSTEM_FORCE_BAN' WHERE user_handle ILIKE $1 AND status = 'pending'", [handleToBan]);
        console.log(`Cleared moderation queue for ${handleToBan}: ${resQueue.rowCount} rows updated.`);

        await client.end();
        console.log("Force ban completed successfully.");
    } catch (err) {
        console.error("Force ban failed:", err.message);
    }
}

forceBan();
