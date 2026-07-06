const { Client } = require('pg');

async function testDirect() {
    const client = new Client({
        host: 'thiftwzubmvcrdhuwcwm.supabase.co',
        port: 5432,
        user: 'postgres',
        password: 'VozDatabase2026!',
        database: 'postgres',
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('Connecting directly to db.thiftwzubmvcrdhuwcwm.supabase.co...');
        await client.connect();
        console.log('✅ Connected successfully!');
        const res = await client.query('SELECT current_database();');
        console.log('Query result:', res.rows);
        await client.end();
    } catch (e) {
        console.error('❌ Connection failed:', e.message);
    }
}

testDirect();
