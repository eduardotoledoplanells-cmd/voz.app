const { Client } = require('pg');

const passwords = [
    'VozDatabase2026!',
    'VozDatabase2026',
    'VOZ_SEC_KEY_2026_ADMPNL_71a',
    'VozApp2026!',
    'Voz2026!',
    'VozDatabase2025!',
    'VozDatabase2026!?'
];

async function run() {
    const host = 'aws-1-eu-central-1.pooler.supabase.com';
    const port = 6543;
    const user = 'postgres.thiftwzubmvcrdhuwcwm';
    
    for (const pw of passwords) {
        console.log(`Trying password: ${pw}...`);
        const client = new Client({
            host,
            port,
            user,
            password: pw,
            database: 'postgres',
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 5000,
        });

        try {
            await client.connect();
            console.log(`🎉 SUCCESS! Password is: ${pw}`);
            await client.end();
            break;
        } catch (e) {
            console.log(`❌ Failed: ${e.message}`);
        }
    }
}

run();
