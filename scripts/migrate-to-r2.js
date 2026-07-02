const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Error: Supabase configuration missing in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'voz-videos';
const publicBaseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

if (!accountId || !accessKeyId || !secretAccessKey) {
  console.error("Error: Cloudflare R2 configuration missing in .env.local");
  process.exit(1);
}

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

async function runMigration() {
  console.log("🚀 Starting storage migration from Supabase to Cloudflare R2...");
  
  // 1. Fetch all videos
  const { data: videos, error } = await supabase.from('videos').select('*');
  if (error) {
    console.error("Error fetching videos from Supabase:", error);
    process.exit(1);
  }
  
  console.log(`Found ${videos.length} video records in Supabase.`);
  
  let migratedCount = 0;
  for (const video of videos) {
    const url = video.video_url;
    if (!url) {
      console.log(`- Video ID ${video.id} has no video_url. Skipping.`);
      continue;
    }
    console.log(`\nChecking video ID: ${video.id}, URL: ${url}`);
    
    // Check if the video is already hosted on R2 or doesn't need migration
    const isAlreadyR2 = url.includes('r2.cloudflarestorage.com') || (publicBaseUrl && url.includes(publicBaseUrl));
    if (isAlreadyR2) {
      console.log(`- Video is already on R2. Skipping.`);
      continue;
    }
    
    // Download the video
    try {
      console.log(`- Downloading from Supabase/source URL...`);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.statusText} (${response.status})`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Determine the R2 destination key.
      let key = '';
      if (url.includes('/storage/v1/object/public/media/')) {
        key = url.split('/storage/v1/object/public/media/')[1];
      } else {
        // Fallback: extract last segment
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const lastSegment = pathname.substring(pathname.lastIndexOf('/') + 1);
        key = `videos/${video.user || 'migrated'}/${Date.now()}-${lastSegment}`;
      }
      
      console.log(`- Uploading to R2 with key: ${key}...`);
      await r2Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: 'video/mp4', // default to mp4
      }));
      
      // Construct the new URL
      let newUrl = '';
      if (publicBaseUrl) {
        const formattedBase = publicBaseUrl.endsWith('/') ? publicBaseUrl.slice(0, -1) : publicBaseUrl;
        newUrl = `${formattedBase}/${key}`;
      } else {
        newUrl = `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${key}`;
      }
      
      console.log(`- New R2 URL: ${newUrl}`);
      
      // Update DB record
      console.log(`- Updating database record...`);
      const { error: updateError } = await supabase
        .from('videos')
        .update({ video_url: newUrl })
        .eq('id', video.id);
        
      if (updateError) {
        throw updateError;
      }
      
      console.log(`- Successfully migrated video ${video.id}`);
      migratedCount++;
    } catch (err) {
      console.error(`- Failed to migrate video ${video.id}:`, err.message || err);
    }
  }
  
  console.log(`\n🎉 Migration complete. Migrated ${migratedCount} videos.`);
}

runMigration().catch(console.error);
