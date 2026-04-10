require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://obdrsqeueivhnbsibhen.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('Starting user synchronization...');

    // 1. Find and delete @Muestra from auth.users (if it exists) and app_users
    console.log('Looking for user @Muestra in app_users...');
    const { data: muestraData, error: muestraErr } = await supabase
        .from('app_users')
        .select('id')
        .eq('username', '@Muestra')
        .single();
    
    if (muestraData) {
        console.log(`Found @Muestra in app_users with id: ${muestraData.id}. Deleting from auth.users...`);
        const { error: deleteAuthErr } = await supabase.auth.admin.deleteUser(muestraData.id);
        if (deleteAuthErr) {
            console.error('Error deleting @Muestra from auth:', deleteAuthErr.message);
        } else {
            console.log('Deleted @Muestra from auth.users');
        }

        // It should cascade or we explicitly delete from app_users
        const { error: deleteAppErr } = await supabase.from('app_users').delete().eq('id', muestraData.id);
        if (deleteAppErr) {
            console.error('Error deleting @Muestra from app_users:', deleteAppErr.message);
        } else {
            console.log('Deleted @Muestra from app_users');
        }
    } else {
        console.log('@Muestra not found in app_users.');
    }

    // 2. Check if Papi2 exists in app_users
    console.log('Looking for user @Papi2 in app_users...');
    const { data: papi2Data } = await supabase
        .from('app_users')
        .select('*')
        .eq('username', '@Papi2')
        .single();
    
    if (papi2Data) {
        console.log('@Papi2 already exists in app_users:', papi2Data);
    } else {
        console.log('@Papi2 not found in app_users. Creating user in auth.users...');
        const email = 'papi2@voz.app'; // generic email
        
        // try to find by email first
        const { data: usersData, error: checkErr } = await supabase.auth.admin.listUsers();
        let authUser = usersData?.users.find(u => u.email === email);
        
        if (!authUser) {
            const { data: newAuthData, error: createErr } = await supabase.auth.admin.createUser({
                email,
                password: 'password123',
                email_confirm: true,
                user_metadata: { name: 'Papi2', username: '@Papi2' }
            });

            if (createErr) {
                console.error('Error creating auth user for @Papi2:', createErr.message);
                return;
            }
            console.log('Created auth user for @Papi2 with id:', newAuthData.user.id);
            authUser = newAuthData.user;
        } else {
            console.log('Auth user already exists with email', email, 'id:', authUser.id);
        }

        // Insert into app_users
        console.log('Inserting @Papi2 into app_users...');
        const { error: insertErr } = await supabase
            .from('app_users')
            .upsert({
                id: authUser.id,
                username: '@Papi2',
                email: email,
                display_name: 'Papi2',
                language: 'en'
            });
        
        if (insertErr) {
            console.error('Error inserting @Papi2 into app_users:', insertErr.message);
        } else {
            console.log('Successfully inserted @Papi2 into app_users.');
        }
    }

    console.log('Synchronization complete.');
}

main().catch(console.error);
