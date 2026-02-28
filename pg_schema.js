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

        // Add parent_id to voice_comments if it doesn't exist
        await client.query(`
        ALTER TABLE voice_comments 
        ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES voice_comments(id) ON DELETE CASCADE;
    `);
        console.log("Added parent_id column to voice_comments!");

        // Also create the voice_comment_likes table since it probably doesn't exist either!
        await client.query(`
        CREATE TABLE IF NOT EXISTS voice_comment_likes (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            comment_id UUID REFERENCES voice_comments(id) ON DELETE CASCADE,
            user_handle TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
            UNIQUE(comment_id, user_handle)
        );
    `);
        console.log("Created voice_comment_likes table!");

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}
run();
