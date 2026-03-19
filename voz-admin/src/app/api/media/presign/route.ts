import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/mov'];
const ALLOWED_AUDIO_TYPES = ['audio/m4a', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a'];

export async function POST(request: Request) {
    let rawBody = '';
    try {
        rawBody = await request.text();
        const body = JSON.parse(rawBody);
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

        // DEBUG: List buckets to verify if the key works at all
        const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets();
        console.log('[Supabase] Available buckets:', buckets?.map(b => b.name), 'Error:', bucketError);

        const { data, error } = await supabaseAdmin.storage
            .from('media')
            .createSignedUploadUrl(finalPath);

        if (error) {
            console.error('Supabase createSignedUploadUrl error:', error);
            return NextResponse.json({ error: 'Failed to create presigned URL', message: error.message }, { status: 500 });
        }

        // Get public URL in advance so the client knows where it will be
        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('media')
            .getPublicUrl(finalPath);

        return NextResponse.json({
            success: true,
            signedUrl: data.signedUrl,
            token: data.token,
            path: data.path,
            publicUrl: publicUrl
        });

    } catch (error: any) {
        console.error('Presign error:', error, 'Raw body:', rawBody);
        return NextResponse.json({ error: 'Failed to process request', details: error.message }, { status: 500 });
    }
}
