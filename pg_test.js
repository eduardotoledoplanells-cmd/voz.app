const { Client } = require('pg');

const client = new Client({
    host: 'aws-0-eu-north-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.obdrsqueuivhnbsibhen',
    password: 'VozDatabase2026!',
    database: 'postgres',
});

async function run() {
    try {
        await client.connect();
        const res = await client.query('SELECT handle, profile_image FROM app_users');
        console.log(res.rows);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}
run();
