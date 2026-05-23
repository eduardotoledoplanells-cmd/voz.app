import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logSystemAlert } from '@/lib/alerts';

// Use Anon Key for server-side uploads since the media bucket is configured for public inserts
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });


const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/mov'];
const ALLOWED_AUDIO_TYPES = ['audio/m4a', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a'];
const ALLOWED_DOC_TYPES = ['application/pdf'];

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: 'File size exceeds 100MB limit' }, { status: 400 });
        }

        // Validate file type
        const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
        const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
        const isAudio = ALLOWED_AUDIO_TYPES.includes(file.type);
        const isDoc = ALLOWED_DOC_TYPES.includes(file.type);

        if (!isImage && !isVideo && !isAudio && !isDoc) {
            return NextResponse.json({
                error: 'Invalid file type. Allowed: JPG, PNG, GIF, WebP, MP4, WebM, M4A, MP3, PDF'
            }, { status: 400 });
        }

        // Determine subdirectory (folder in bucket)
        let subDir = 'other';
        if (isImage) subDir = 'images';
        else if (isVideo) subDir = 'videos';
        else if (isAudio) subDir = 'audio';
        else if (isDoc) subDir = 'documents';

        // Get target bucket from search parameters
        const { searchParams } = new URL(request.url);
        const requestedBucket = searchParams.get('bucket') || 'media';
        const allowedBuckets = ['media', 'kyc_documents'];
        const targetBucket = allowedBuckets.includes(requestedBucket) ? requestedBucket : 'media';

        // Generate unique filename
        const timestamp = Date.now();
        const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${subDir}/${timestamp}-${originalName}`;

        // Convert file to buffer and upload to Supabase
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const { data, error: uploadError } = await supabaseAdmin.storage
            .from(targetBucket)
            .upload(fileName, buffer, {
                contentType: file.type,
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('Supabase storage error:', uploadError);
            const service = targetBucket === 'kyc_documents' ? 'KYC' : 'Upload';
            await logSystemAlert(service, `Storage upload failed (File: ${fileName}): ${uploadError.message}`);
            return NextResponse.json({
                error: 'Failed to upload to storage',
                message: uploadError.message,
                fileName,
                fileType: file.type
            }, { status: 500 });
        }

        // Get public URL
        const { data: { publicUrl } } = supabaseAdmin.storage
            .from(targetBucket)
            .getPublicUrl(fileName);

        return NextResponse.json({
            success: true,
            url: publicUrl,
            filename: fileName,
            type: subDir,
            size: file.size
        });

    } catch (error: any) {
        console.error('Upload error:', error);
        await logSystemAlert('Upload', `Upload process error: ${error.message}`);
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }
}
