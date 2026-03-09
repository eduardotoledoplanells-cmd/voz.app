require('dotenv').config({ path: '.env.prod' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://obdrsqeueivhnbsibhen.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZHJzcWV1ZWl2aG5ic2liaGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTE4MTksImV4cCI6MjA4NzMyNzgxOX0.6iZ82MtwuC5_Uxyu4xDRMKxITeugq8GiklPkgvq9AUg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkColumn() {
    const { data, error } = await supabase.from('videos').select('is_pinned').limit(1);
    if (error) {
        console.error("Error fetching is_pinned:", error);
    } else {
        console.log("Success! is_pinned exists.", data);
    }
}

checkColumn();
