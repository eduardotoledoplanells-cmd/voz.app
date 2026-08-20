require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function deleteUser() {
  const email = 'cocinaparatios@gmail.com';
  
  // 1. Delete from app_users
  console.log('Deleting from app_users...');
  const { error: error1 } = await supabase.from('app_users').delete().eq('email', email);
  if (error1) console.error('Error deleting from app_users:', error1);
  else console.log('Deleted from app_users.');

  // 2. Find user in auth
  console.log('Finding user in auth.users...');
  const { data: usersData, error: error2 } = await supabase.auth.admin.listUsers();
  if (error2) {
    console.error('Error listing users:', error2);
    return;
  }
  
  const user = usersData.users.find(u => u.email === email);
  if (user) {
    console.log(`Found auth user ${user.id}, deleting...`);
    const { error: error3 } = await supabase.auth.admin.deleteUser(user.id);
    if (error3) console.error('Error deleting auth user:', error3);
    else console.log('Deleted auth user successfully.');
  } else {
    console.log('User not found in auth.users.');
  }
}

deleteUser();
