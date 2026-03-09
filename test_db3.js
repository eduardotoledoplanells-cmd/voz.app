const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://obdrsqeueivhnbsibhen.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZHJzcWV1ZWl2aG5ic2liaGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTE4MTksImV4cCI6MjA4NzMyNzgxOX0.6iZ82MtwuC5_Uxyu4xDRMKxITeugq8GiklPkgvq9AUg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase.from('moderation_queue').select('*');
    console.log('Error:', error);
    console.log('Data count:', data?.length);
    if (data?.length > 0) {
        console.log('Last item:', data[data.length - 1]);
    }
}

check();
