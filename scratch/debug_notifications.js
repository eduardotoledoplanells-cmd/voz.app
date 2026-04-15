const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'C:/Users/Mis Documentos.RETROTIENDAS-HO/Desktop/APP/VOZ/server/.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNotifications() {
    console.log('--- Ultimas 5 notificaciones en la tabla ---');
    const { data, error } = await supabase.from('notifications').select('*').order('timestamp', { ascending: false }).limit(5);
    if (error) {
        console.error('Error:', error);
    } else {
        console.log(JSON.stringify(data, null, 2));
    }
}

checkNotifications();
