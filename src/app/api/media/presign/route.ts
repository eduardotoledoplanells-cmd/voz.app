import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
});

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/mov'];
const ALLOWED_AUDIO_TYPES = ['audio/m4a', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a'];

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { filename, fileType } = body;

        if (!filename || !fileType) {
            return NextResponse.json({ error: 'filename and fileType are required' }, { status: 400 });
        }

        const isImage = ALLOWED_IMAGE_TYPES.includes(fileType);
        const isVideo = ALLOWED_VIDEO_TYPES.includes(fileType);
        const isAudio = ALLOWED_AUDIO_TYPES.includes(fileType);

        if (!isImage && !isVideo && !isAudio) {
            return NextResponse.json({
                error: 'Invalid file type. Allowed: JPG, PNG, GIF, WebP, MP4, WebM, M4A, MP3'
            }, { status: 400 });
        }

        let subDir = 'other';
        if (isImage) subDir = 'images';
        else if (isVideo) subDir = 'videos';
        else if (isAudio) subDir = 'audio';

        const timestamp = Date.now();
        const originalName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        const finalPath = `${subDir}/${timestamp}-${originalName}`;

        let signedUrl = '';
        let publicUrl = '';
        let token = 'r2-upload';
        let returnPath = finalPath;

        if (isVideo) {
            const { r2Client, R2_BUCKET_NAME } = require('@/lib/r2');
            const { PutObjectCommand } = require('@aws-sdk/client-s3');
            const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
            
            const command = new PutObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: finalPath,
                ContentType: fileType
            });
            
            signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
            
            const publicBaseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
            if (publicBaseUrl) {
                const formattedBase = publicBaseUrl.endsWith('/') ? publicBaseUrl.slice(0, -1) : publicBaseUrl;
                publicUrl = `${formattedBase}/${finalPath}`;
            } else {
                const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
                publicUrl = `https://${R2_BUCKET_NAME}.${accountId}.r2.cloudflarestorage.com/${finalPath}`;
            }
        } else {
            const { data, error } = await supabaseAdmin.storage
                .from('media')
                .createSignedUploadUrl(finalPath);

            if (error) {
                console.error('Supabase createSignedUploadUrl error:', error);
                return NextResponse.json({ error: 'Failed to create presigned URL', message: error.message }, { status: 500 });
            }
            
            const { data: publicData } = supabaseAdmin.storage
                .from('media')
                .getPublicUrl(finalPath);
                
            signedUrl = data.signedUrl;
            token = data.token;
            returnPath = data.path;
            publicUrl = publicData.publicUrl;
        }

        return NextResponse.json({
            success: true,
            signedUrl,
            token,
            path: returnPath,
            publicUrl
        });

    } catch (error) {
        console.error('Presign error:', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
