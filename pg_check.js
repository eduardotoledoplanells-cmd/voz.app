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
        console.log("Connected to PostgreSQL pooler!");

        // Check videos table
        const res = await client.query('SELECT count(*) FROM videos');
        console.log("Videos in DB:", res.rows[0].count);

        // Check what the old JWT secret is so I can use it to sign the service role key!
        // wait, we don't need the service role key if public inserts are allowed and we just use the ANON key for the server!

        // Create the media bucket using SQL
        await client.query(`
        INSERT INTO storage.buckets (id, name, public) 
        VALUES ('media', 'media', true)
        ON CONFLICT (id) DO NOTHING;
    `);
        console.log("Bucket 'media' ensured.");

        // And ensure the policy allows public inserts 
        await client.query(`
        DROP POLICY IF EXISTS "public_reads_media" ON storage.objects;
        CREATE POLICY "public_reads_media" ON storage.objects FOR SELECT USING (bucket_id = 'media');
        
        DROP POLICY IF EXISTS "public_inserts_media" ON storage.objects;
        CREATE POLICY "public_inserts_media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media');
    `);
        console.log("Bucket policies created.");

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}
run();
