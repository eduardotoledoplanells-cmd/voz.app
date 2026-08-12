import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
    const email = 'cocinaparatios@gmail.com';
    console.log(`Buscando al usuario ${email}...`);
    
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) {
        console.error('Error listando usuarios:', error);
        return;
    }

    const user = users.users.find(u => u.email === email);
    if (!user) {
        console.log(`Usuario con email ${email} no encontrado en Supabase Auth.`);
    } else {
        console.log(`Eliminando usuario de Auth (ID: ${user.id})...`);
        const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
        if (delError) console.error('Error eliminando de Auth:', delError);
        else console.log('Usuario eliminado de Supabase Auth con éxito.');
    }

    console.log(`Eliminando de app_users (email: ${email})...`);
    const { error: dbError } = await supabaseAdmin.from('app_users').delete().eq('email', email);
    if (dbError) console.error('Error eliminando de app_users:', dbError);
    else console.log('Usuario eliminado de app_users con éxito.');
}

main().catch(console.error);
