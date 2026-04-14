const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://obdrsqeueivhnbsibhen.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZHJzcWV1ZWl2aG5ic2liaGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTE4MTksImV4cCI6MjA4NzMyNzgxOX0.6iZ82MtwuC5_Uxyu4xDRMKxITeugq8GiklPkgvq9AUg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
    const { data, error } = await supabase.from('app_users').select('*').eq('handle', '@usuario');
    if (error) {
        console.error(error);
        return;
    }
    console.log("User by eq:", JSON.stringify(data, null, 2));

    const { data: data2, error: error2 } = await supabase.from('app_users').select('*').ilike('handle', '@usuario');
    if (error2) {
        console.error(error2);
        return;
    }
    console.log("User by ilike:", JSON.stringify(data2, null, 2));
}

checkUser();
