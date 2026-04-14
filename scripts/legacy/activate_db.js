const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function tryCreate() {
    console.log("Starting DB activation script...");

    const possiblePaths = [
        'c:/Users/Mis Documentos.RETROTIENDAS-HO/Desktop/APP/VOZ/server/voz-admin/.env.local',
        'c:/Users/Mis Documentos.RETROTIENDAS-HO/Desktop/APP/VOZ/server/.env.local',
        'c:/Users/Mis Documentos.RETROTIENDAS-HO/Desktop/futura web/.env.local',
        'c:/Users/Mis Documentos.RETROTIENDAS-HO/Desktop/futura web/voz-admin/.env.local'
    ];

    let url = "";
    let key = "";

    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            const content = fs.readFileSync(p, 'utf8');
            const lines = content.split('\n');
            for (const line of lines) {
                if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
                if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].trim();
            }
        }
        if (url && key) break;
    }

    if (!url || !key) {
        console.error("Could not find both URL and SERVICE_ROLE_KEY in .env files.");
        console.log("Found URL:", url ? "Yes" : "No");
        console.log("Found KEY:", key ? "Yes" : "No");
        process.exit(1);
    }

    const supabase = createClient(url, key);

    console.log("Attempting to create video_bookmarks table via RPC or PostgREST trick if available...");

    // Since we don't have raw SQL execution via JS client easily without extensions,
    // we'll try to at least verify the connection and maybe the user can provide the key if this fails.

    const sql = `
    CREATE TABLE IF NOT EXISTS video_bookmarks (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
      user_handle TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
      UNIQUE(video_id, user_handle)
    );
    `;

    console.log("Please copy-paste this into Supabase SQL Editor if I can't run it:");
    console.log(sql);

    // Some Supabase setups have an 'exec_sql' or similar RPC. Let's try to check.
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });

    if (error) {
        console.log("RPC 'exec_sql' not found or failed (common). Reason:", error.message);
        console.log("FALLBACK: I will check if I can at least list tables.");
        const { data: tData, error: tErr } = await supabase.from('videos').select('count', { count: 'exact', head: true });
        if (tErr) console.error("Could not even connect to 'videos' table:", tErr.message);
        else console.log("Connection to 'videos' table confirmed. Please use the SQL Editor for the table creation.");
    } else {
        console.log("Table created successfully via RPC!");
    }
}

tryCreate();
