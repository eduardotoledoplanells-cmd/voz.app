import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

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

        const uploadDir = path.join(process.cwd(), 'public', 'uploads', subDir);

        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) { }

        const filePath = path.join(uploadDir, filename);
        await writeFile(filePath, buffer);

        return NextResponse.json({
            success: true,
            url: `/uploads/${subDir}/${filename}`,
            filename
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
