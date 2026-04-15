const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'C:/Users/Mis Documentos.RETROTIENDAS-HO/Desktop/APP/VOZ/server/.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data, error } = await supabase.from('notifications').select('*').limit(1);
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Sample Notification keys:', data.length > 0 ? Object.keys(data[0]) : 'No data found');
    }
}

checkSchema();
