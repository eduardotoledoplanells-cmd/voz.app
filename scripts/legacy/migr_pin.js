const { Client } = require('pg');

const password = 'VozDatabase2026!';
const host = '2a05:d016:571:a42a:2c9e:ad7a:a789:b45e';

async function run() {
    console.log(`Connecting to the database via IPv6 to add the is_pinned column...`);
    const client = new Client({
        host,
        port: 5432,
        user: `postgres`,
        password,
        database: 'postgres',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
    });

    try {
        await client.connect();

        console.log("Checking if is_pinned column exists...");
        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='videos' and column_name='is_pinned';
        `);

        if (res.rows.length === 0) {
            console.log("Column not found. Adding is_pinned boolean column to videos table...");
            await client.query(`ALTER TABLE videos ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE;`);
            console.log("✅ Column added successfully! Reloading schema cache...");

            // Reload rest schema cache
            await client.query(`NOTIFY pgrst, 'reload schema';`);
            console.log("✅ Schema cache reloaded.");
        } else {
            console.log("✅ Column is_pinned already exists.");
        }

    } catch (err) {
        console.error(`❌ Failed:`, err);
    } finally {
        await client.end();
    }
}

run();
