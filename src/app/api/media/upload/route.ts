import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
const ALLOWED_AUDIO_TYPES = ['audio/m4a', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a'];

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

        if (!isImage && !isVideo && !isAudio) {
            return NextResponse.json({
                error: 'Invalid file type. Allowed: JPG, PNG, GIF, WebP, MP4, WebM, M4A, MP3'
            }, { status: 400 });
        }

        // Determine subdirectory (folder in bucket)
        let subDir = 'other';
        if (isImage) subDir = 'images';
        else if (isVideo) subDir = 'videos';
        else if (isAudio) subDir = 'audio';

        // Generate unique filename
        const timestamp = Date.now();
        const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${subDir}/${timestamp}-${originalName}`;

        // Convert file to buffer and upload to Supabase
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const { data, error: uploadError } = await supabase.storage
            .from('media')
            .upload(fileName, buffer, {
                contentType: file.type,
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('Supabase storage error:', uploadError);
            return NextResponse.json({
                error: 'Failed to upload to storage',
                message: uploadError.message,
                fileName,
                fileType: file.type
            }, { status: 500 });
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('media')
            .getPublicUrl(fileName);

        return NextResponse.json({
            success: true,
            url: publicUrl,
            filename: fileName,
            type: subDir,
            size: file.size
        });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }
}
