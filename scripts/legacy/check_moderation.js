require('dotenv').config({ path: '.env.prod' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkModeration() {
    console.log("Checking moderation_queue table...");
    const { data, error, count } = await supabase
        .from('moderation_queue')
        .select('*', { count: 'exact' });

    if (error) {
        console.error("Error fetching moderation_queue:", error);
    } else {
        console.log(`Found ${count} total items in moderation_queue.`);
        if (data && data.length > 0) {
            console.log("Latest items:");
            data.slice(0, 5).forEach(item => {
                console.log(`- [${item.status}] ${item.type}: ${item.report_reason} (ID: ${item.id})`);
            });
        }
    }

    console.log("\nChecking for missing 'video_views' table...");
    const { error: viewError } = await supabase.from('video_views').select('id').limit(1);
    if (viewError) {
        console.log("Confirmado: La tabla 'video_views' no responde o no existe:", viewError.message);
    } else {
        console.log("La tabla 'video_views' sí existe.");
    }
}

checkModeration();
