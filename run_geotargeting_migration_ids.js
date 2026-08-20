const fs = require('fs');
const path = require('path');

const API_URL = 'https://server-taupe-six.vercel.app/api/voz/db/migrate';

async function trigger() {
    console.log(`🔐 Triggering production migration API to apply AD ENGINE IDS...`);

    const sqlPath = path.join(__dirname, 'migration_ad_engine_ids.sql');
    if (!fs.existsSync(sqlPath)) {
        console.error("❌ SQL File migration_ad_engine_ids.sql not found!");
        process.exit(1);
    }
    const sqlQuery = fs.readFileSync(sqlPath, 'utf8');

    const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sqlQuery: sqlQuery,
            dbPassword: 'VozDatabase2026!'
        })
    });

    console.log(`HTTP Status: ${res.status}`);
    const data = await res.json();
    console.log('\n📊 Response from server:', JSON.stringify(data, null, 2));
}

trigger().catch(console.error);
