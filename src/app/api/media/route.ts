import { NextResponse } from 'next/server';
import { readdir, unlink, stat } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const CATEGORIES_DIR = path.join(process.cwd(), 'public', 'categories');
const PUBLIC_DIR = path.join(process.cwd(), 'public');

export async function GET() {
    try {
        const media: any[] = [];

        // Helper to read directory and add files
        const readDir = async (dirPath: string, urlPrefix: string, type: 'image' | 'video') => {
            try {
                const files = await readdir(dirPath);
                for (const file of files) {
                    const filePath = path.join(dirPath, file);
                    const stats = await stat(filePath);
                    if (stats.isFile()) {
                        media.push({
                            filename: file,
                            url: `${urlPrefix}/${file}`,
                            type: type,
                            size: stats.size,
                            createdAt: stats.birthtime
                        });
                    }
                }
            } catch (error) {
                // Ignore if directory missing
                // console.log(`Directory not found or empty: ${dirPath}`);
            }
        };

        // Read images from uploads
        await readDir(path.join(UPLOAD_DIR, 'images'), '/uploads/images', 'image');

        // Read videos from uploads
        await readDir(path.join(UPLOAD_DIR, 'videos'), '/uploads/videos', 'video');

        // Read category images
        await readDir(CATEGORIES_DIR, '/categories', 'image');

        // Sort by creation date (newest first)
        media.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return NextResponse.json(media);
    } catch (error) {
        console.error('Error listing media:', error);
        return NextResponse.json({ error: 'Failed to list media' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const body = await request.json();

        // Handle both single url (legacy/simple) and array of urls (bulk)
        const urls: string[] = body.urls || (body.url ? [body.url] : []);

        if (urls.length === 0) {
            return NextResponse.json({ error: 'No URLs provided' }, { status: 400 });
        }

        let deletedCount = 0;
        const errors: string[] = [];

        for (const url of urls) {
            let filePath = '';

            // Determine file path based on URL prefix
            // Normalize slashes for Windows compatibility logic
            const normalizedUrl = url.split('/').join(path.sep);

            // Reconstruct path manually to avoid double separator issues when checking startswith
            // Ideally we check against the original url prefix logic
            if (url.startsWith('/uploads/')) {
                // Remove leading slash for join to work correctly if needed, or join directly
                // path.join with /foo acts as absolute path on linux, on windows it might change drive
                // safest is to strip leading slash
                const relativeUrl = normalizedUrl.startsWith(path.sep) ? normalizedUrl.substring(1) : normalizedUrl;
                filePath = path.join(PUBLIC_DIR, relativeUrl); // This might be double joining

                // Better approach:
                filePath = path.join(process.cwd(), 'public', ...url.split('/').filter(p => p));
            } else if (url.startsWith('/categories/')) {
                filePath = path.join(process.cwd(), 'public', ...url.split('/').filter(p => p));
            } else {
                errors.push(`Invalid URL prefix: ${url}`);
                continue;
            }

            // Security check to prevent directory traversal
            // Ensure the resolved path is inside the public directory
            const resolvedPath = path.resolve(filePath);

            // Simple check to ensure we are deleting files inside public
            if (!resolvedPath.startsWith(PUBLIC_DIR)) {
                errors.push(`Security violation: ${url}`);
                continue;
            }

            try {
                // Check if file exists before deleting
                await stat(resolvedPath);
                await unlink(resolvedPath);
                deletedCount++;
            } catch (err: any) {
                if (err.code === 'ENOENT') {
                    // File doesn't exist, consider it deleted
                    deletedCount++;
                } else {
                    console.error(`Error deleting file ${resolvedPath}:`, err);
                    errors.push(`Failed to delete ${url}`);
                }
            }
        }

        return NextResponse.json({
            success: true,
            deletedCount,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json({ error: 'Failed to delete file(s)' }, { status: 500 });
    }
}
