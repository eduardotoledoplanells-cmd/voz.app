import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env.production' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function checkColumns() {
  const { data, error } = await supabase.from('app_users').select('*').limit(1);
  if (error) {
    console.error("Error fetching app_users:", error);
    return;
  }
  const user = data[0];
  console.log("Existing columns in app_users:", Object.keys(user));
  
  if (!('nationality' in user)) console.log("MISSING: nationality");
  if (!('dob' in user)) console.log("MISSING: dob");
}

checkColumns();
