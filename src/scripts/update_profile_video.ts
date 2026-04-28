
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.production') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, serviceKey!);

const VIDEO_FILE_PATH = 'c:/Users/Mis Documentos.RETROTIENDAS-HO/Desktop/APP/VOZ/Countdown8 (1).mp4';
const VIDEO_ID = 'e6c44e7d-3a76-4841-bc49-b2e935ac4d56';

async function updateVideo() {
    console.log('Starting video update process...');
    
    // 1. Read the file
    if (!fs.existsSync(VIDEO_FILE_PATH)) {
        console.error('Video file not found at:', VIDEO_FILE_PATH);
        return;
    }
    const fileBuffer = fs.readFileSync(VIDEO_FILE_PATH);
    const fileName = `videos/countdown_${Date.now()}.mp4`;

    // 2. Upload to Supabase Storage
    console.log('Uploading to Supabase Storage...');
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, fileBuffer, {
            contentType: 'video/mp4',
            upsert: true
        });

    if (uploadError) {
        console.error('Upload error:', uploadError);
        return;
    }

    console.log('Upload successful:', uploadData.path);

    // 3. Get Public URL
    const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);

    console.log('New Public URL:', publicUrl);

    // 4. Update Database
    console.log('Updating database record...');
    const { data: updateData, error: updateError } = await supabase
        .from('videos')
        .update({ video_url: publicUrl })
        .eq('id', VIDEO_ID);

    if (updateError) {
        console.error('Database update error:', updateError);
        return;
    }

    console.log('Database updated successfully.');
    console.log('Process completed.');
}

updateVideo();
