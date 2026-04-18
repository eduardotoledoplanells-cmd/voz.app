import { Client } from 'pg';

async function migrate_support() {
    const password = process.env.DB_PASSWORD || 'VozDatabase2026!';
    const projRef = 'obdrsqeueivhnbsibhen';
    const connectionString = `postgresql://postgres.${projRef}:${password}@db.${projRef}.supabase.co:5432/postgres`;

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false },
    });

    try {
        console.log(`Connecting to Supabase PostgreSQL...`);
        await client.connect();
        
        console.log("Creating support_messages table if not exists...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS public.support_messages (
                id uuid default gen_random_uuid() primary key,
                user_handle text not null,
                message text not null,
                is_from_admin boolean default false,
                read_status boolean default false,
                created_at timestamp with time zone default now()
            );

            ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

            DROP POLICY IF EXISTS "Allow public inserts to support_messages" ON public.support_messages;
            CREATE POLICY "Allow public inserts to support_messages" ON public.support_messages
                FOR INSERT WITH CHECK (true);

            DROP POLICY IF EXISTS "Allow public select on support_messages" ON public.support_messages;
            CREATE POLICY "Allow public select on support_messages" ON public.support_messages
                FOR SELECT USING (true);
        `);
        
        console.log("Table created successfully!");
        await client.end();
    } catch (err) {
        console.error(`Script failed:`, (err as Error).message);
        process.exit(1);
    }
}

migrate_support();
