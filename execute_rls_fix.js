const fs = require('fs');
const { Client } = require('pg');
const path = require('path');

async function runRLSFix() {
    console.log("🔐 Starting Supabase RLS Fix Script...");

    // 1. Read SQL file
    const sqlPath = path.join(__dirname, 'fix_rls_manual.sql');
    if (!fs.existsSync(sqlPath)) {
        console.error("❌ SQL File fix_rls_manual.sql not found!");
        process.exit(1);
    }
    const sqlQuery = fs.readFileSync(sqlPath, 'utf8');

    // 2. Database configuration
    const projRef = 'thiftwzubmvcrdhuwcwm';
    const password = process.env.SUPABASE_DB_PASSWORD || 'VozDatabase2026!';

    const regions = [
        'eu-central-1', 'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-north-1',
        'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2', 'ca-central-1',
        'sa-east-1', 'ap-northeast-1', 'ap-northeast-2', 'ap-northeast-3',
        'ap-south-1', 'ap-southeast-1', 'ap-southeast-2'
    ];
    const poolers = ['aws-1', 'aws-0'];

    const targets = [
        { host: `${projRef}.supabase.co`, port: 5432, user: 'postgres' },
        { host: `db.${projRef}.supabase.co`, port: 5432, user: 'postgres' },
        { host: `db.${projRef}.supabase.co`, port: 6543, user: `postgres.${projRef}` }
    ];

    for (const pooler of poolers) {
        for (const region of regions) {
            targets.push({
                host: `${pooler}-${region}.pooler.supabase.com`,
                port: 6543,
                user: `postgres.${projRef}`
            });
        }
    }

    let success = false;
    let errorLog = [];

    for (const target of targets) {
        console.log(`Connecting to ${target.host}:${target.port} with user ${target.user}...`);
        const client = new Client({
            host: target.host,
            port: target.port,
            user: target.user,
            password,
            database: 'postgres',
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 5000,
        });

        try {
            await client.connect();
            console.log(`✅ Connected successfully to ${target.host}:${target.port}!`);
            console.log("🚀 Executing RLS SQL statements...");
            await client.query(sqlQuery);
            console.log("🎉 RLS Fix queries executed successfully!");
            await client.end();
            success = true;
            break;
        } catch (err) {
            errorLog.push({ host: target.host, error: err.message });
            console.error(`❌ Connection failed/error on ${target.host}:`, err.message);
        }
    }

    if (success) {
        console.log("\n✅ Database security settings updated successfully. RLS is now ENABLED on all tables!");
    } else {
        console.error("\n❌ Could not connect to any database instance or error executing SQL. Details:");
        console.error(JSON.stringify(errorLog, null, 2));
        process.exit(1);
    }
}

runRLSFix().catch(err => {
    console.error("Fatal Error:", err);
    process.exit(1);
});
