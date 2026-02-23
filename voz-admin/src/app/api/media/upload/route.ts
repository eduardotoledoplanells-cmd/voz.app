import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const originalName = file.name.replace(/\s+/g, '_');
        const filename = `${Date.now()}-${originalName}`;

        // Determine subdirectory based on mime type
        let subDir = 'images';
        if (file.type.startsWith('video/')) subDir = 'videos';
        else if (file.type.startsWith('audio/')) subDir = 'audio';

        // Upload to Supabase Storage
        const { data, error: uploadError } = await supabase.storage
            .from('media')
            .upload(filename, buffer, {
                contentType: file.type,
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('Supabase storage error:', uploadError);
            return NextResponse.json({ error: 'Failed to upload to storage' }, { status: 500 });
        }

        const { data: { publicUrl } } = supabase.storage
            .from('media')
            .getPublicUrl(filename);

        return NextResponse.json({
            success: true,
            url: publicUrl,
            filename: filename,
            type: subDir,
            size: file.size
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
