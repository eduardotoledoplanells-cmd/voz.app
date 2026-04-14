const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://obdrsqeueivhnbsibhen.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZHJzcWV1ZWl2aG5ic2liaGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTE4MTksImV4cCI6MjA4NzMyNzgxOX0.6iZ82MtwuC5_Uxyu4xDRMKxITeugq8GiklPkgvq9AUg';

const supabase = createClient(supabaseUrl, anonKey);

async function testReport() {
    console.log("Submitting test report...");
    const testItem = {
        type: 'video',
        url: 'https://example.com/test-video.mp4',
        user_handle: '@testuser',
        report_reason: 'Prueba de diagnóstico de Antigravity',
        status: 'pending',
        timestamp: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('moderation_queue')
        .insert([testItem])
        .select();

    if (error) {
        console.error("Error submitting report:", error.message);
    } else {
        console.log("Report submitted successfully!", data);
    }
}

testReport();
