const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://obdrsqeueivhnbsibhen.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZHJzcWV1ZWl2aG5ic2liaGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTE4MTksImV4cCI6MjA4NzMyNzgxOX0.6iZ82MtwuC5_Uxyu4xDRMKxITeugq8GiklPkgvq9AUg';

const supabase = createClient(supabaseUrl, anonKey);

async function test() {
    console.log("Checking moderation_queue with Anon Key...");
    const { data: modData, error: modError, count: modCount } = await supabase
        .from('moderation_queue')
        .select('*', { count: 'exact' });

    if (modError) {
        console.error("Error with Anon Key:", modError.message);
    } else {
        console.log(`- Total items found: ${modCount}`);
        if (modData && modData.length > 0) {
            const pending = modData.filter(i => i.status === 'pending');
            console.log(`- Pending items: ${pending.length}`);
            console.log("- Status breakdown:", modData.reduce((acc, i) => {
                acc[i.status] = (acc[i.status] || 0) + 1;
                return acc;
            }, {}));
        }
    }
}

test();
