
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://obdrsqeueivhnbsibhen.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZHJzcWV1ZWl2aG5ic2liaGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTE4MTksImV4cCI6MjA4NzMyNzgxOX0.6iZ82MtwuC5_Uxyu4xDRMKxITeugq8GiklPkgvq9AUg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const userId = '537f8352-6f80-497a-a65e-128564bb4aba';
    // Let's try to update the handle and see if there's an error
    const { data, error } = await supabase.from('app_users').update({ handle: '@Edu_82_test' }).eq('id', userId).select();
    if (error) {
        console.error('Error updating handle:', error);
    } else {
        console.log('Update success:', data);
        // Revert it
        await supabase.from('app_users').update({ handle: '@Edu_82' }).eq('id', userId);
        console.log('Reverted');
    }
}
check();
