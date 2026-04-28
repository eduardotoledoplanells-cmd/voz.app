
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.production') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, serviceKey!);

async function listVideos() {
    const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('user_handle', '@Edu55');
    
    if (error) {
        console.error('Error fetching videos:', error);
    } else {
        console.log('VIDEOS_LIST_START');
        console.log(JSON.stringify(data, null, 2));
        console.log('VIDEOS_LIST_END');
    }
}

listVideos();
