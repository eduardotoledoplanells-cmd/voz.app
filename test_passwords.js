const { Client } = require('pg');

const host = 'aws-1-eu-central-1.pooler.supabase.com';
const port = 6543;
const user = 'postgres.thiftwzubmvcrdhuwcwm';
const database = 'postgres';

const passwords = [
    'VozDatabase2026!',
    'VozDatabase2026',
    'Voz2026!',
    'Voz2026',
    'VOZ2026!',
    'VOZ2026',
    'admin123',
    'Admin123!',
    'VOZ_SEC_KEY_2026_ADMPNL_71a',
    'VozDatabase!',
    'VozDatabase2025!',
    'VozDatabase2025',
    'VozDatabase!'
];

async function test() {
    for (const pwd of passwords) {
        console.log(`Testing password: "${pwd}"`);
        const client = new Client({
            host,
            port,
            user,
            password: pwd,
            database,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 3000,
        });

        try {
            await client.connect();
            console.log(`\n🎉 SUCCESS! Password is: "${pwd}"`);
            await client.end();
            process.exit(0);
        } catch (err) {
            console.log(`❌ Fail: ${err.message}`);
        }
    }
    console.log('\n❌ None of the passwords matched.');
}

test().catch(console.error);
