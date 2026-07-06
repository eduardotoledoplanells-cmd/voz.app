const fs = require('fs');

const sql = fs.readFileSync('migration_geotargeting.sql', 'utf8');

async function runMigration() {
    console.log('Sending Geotargeting SQL migration to production /api/voz/db/migrate...');
    try {
        const res = await fetch('https://www.appvoz.com/api/voz/db/migrate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                dbPassword: 'VozDatabase2026!',
                sqlQuery: sql
            })
        });
        const data = await res.json();
        console.log('Response:', data);
    } catch (e) {
        console.error('Error sending request:', e);
    }
}

runMigration();
