const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.prod' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for admin checks
);

async function diagnose() {
    console.log("--- Supabase Diagnostics ---");
    console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

    // 1. Check moderation_queue
    console.log("\n1. Checking moderation_queue:");
    const { data: modData, error: modError, count: modCount } = await supabase
        .from('moderation_queue')
        .select('*', { count: 'exact' });

    if (modError) {
        console.error("Error with moderation_queue:", modError.message);
    } else {
        console.log(`- Total items: ${modCount}`);
        const statusCounts = modData.reduce((acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
        }, {});
        console.log("- Stats by status:", statusCounts);
        if (modData.length > 0) {
            console.log("- Sample item:", JSON.stringify(modData[0], null, 2));
        }
    }

    // 2. Check video_views
    console.log("\n2. Checking video_views:");
    const { error: viewError } = await supabase.from('video_views').select('id').limit(1);
    if (viewError) {
        console.log("- Status: MISSING or ERROR:", viewError.message);
    } else {
        console.log("- Status: EXISTS");
    }

    // 3. Check app_users
    console.log("\n3. Checking app_users:");
    const { count: userCount, error: userError } = await supabase.from('app_users').select('*', { count: 'exact', head: true });
    if (userError) {
        console.log("- Status: ERROR:", userError.message);
    } else {
        console.log(`- Total users: ${userCount}`);
    }
}

diagnose();
