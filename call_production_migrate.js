const fs = require('fs');
const path = require('path');

const API_URL = 'https://server-taupe-six.vercel.app/api/voz/db/migrate';

async function trigger() {
    console.log(`🔐 Triggering production migration API to apply RLS fix...`);
    console.log(`📡 URL: ${API_URL}`);

    // Load RLS SQL file
    const sqlPath = path.join(__dirname, 'fix_rls_manual.sql');
    if (!fs.existsSync(sqlPath)) {
        console.error("❌ SQL File fix_rls_manual.sql not found!");
        process.exit(1);
    }
    const sqlQuery = fs.readFileSync(sqlPath, 'utf8');

    // Trigger API without dbPassword so it falls back to Vercel's production process.env.SUPABASE_DB_PASSWORD
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sqlQuery: sqlQuery
        })
    });

    console.log(`HTTP Status: ${res.status}`);
    const data = await res.json();
    console.log('\n📊 Response from server:', JSON.stringify(data, null, 2));
}

trigger().catch(console.error);
