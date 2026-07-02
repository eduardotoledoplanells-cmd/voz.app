import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { supabase } from '@/lib/db';
import { r2Client, R2_BUCKET_NAME } from '@/lib/r2';
import { logSystemAlert } from '@/lib/alerts';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB limit
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska', 'video/avi', 'video/mpeg'];

export async function POST(request: Request) {
    try {
        // 1. Session Validation: Verify Bearer token against Supabase Auth
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'No autorizado. Se requiere token Bearer.' },
                { status: 401 }
            );
        }

        const token = authHeader.split(' ')[1];
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            console.warn('[R2 Upload API] Invalid or expired session token attempt.');
            return NextResponse.json(
                { error: 'Sesión inválida o expirada. Vuelva a iniciar sesión.' },
                { status: 401 }
            );
        }

        // 2. Parse and Validate FormData
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No se ha proporcionado ningún archivo.' },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: 'El archivo supera el límite permitido de 100MB.' },
                { status: 400 }
            );
        }

        // Validate MIME type
        if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: `Tipo de archivo inválido (${file.type}). Solo se permiten formatos de vídeo.` },
                { status: 400 }
            );
        }

        // 3. Generate unique filename
        const timestamp = Date.now();
        const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const key = `videos/${user.id}/${timestamp}-${sanitizedOriginalName}`;

        // 4. Convert file data to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 5. Upload to Cloudflare R2
        console.log(`[R2 Upload API] Uploading ${key} to bucket ${R2_BUCKET_NAME}...`);
        await r2Client.send(
            new PutObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: key,
                Body: buffer,
                ContentType: file.type,
            })
        );

        // 6. Construct Video Public URL
        // Cloudflare R2 public domains are either custom domains (e.g. video.voz.app) or pub-*.r2.dev subdomains.
        // If NEXT_PUBLIC_R2_PUBLIC_URL is not set, we construct a default compatible format or return the bucket key.
        const publicBaseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
        let videoUrl = '';
        if (publicBaseUrl) {
            // Trim trailing slash and append the key
            const formattedBase = publicBaseUrl.endsWith('/') ? publicBaseUrl.slice(0, -1) : publicBaseUrl;
            videoUrl = `${formattedBase}/${key}`;
        } else {
            // Fallback: Use standard S3 endpoint format if no public URL domain is defined (e.g. for developer debug)
            const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
            videoUrl = `https://${R2_BUCKET_NAME}.${accountId}.r2.cloudflarestorage.com/${key}`;
        }

        console.log(`[R2 Upload API] Upload successful. Key: ${key}, URL: ${videoUrl}`);

        return NextResponse.json({
            success: true,
            message: 'Vídeo subido correctamente a R2.',
            key,
            bucket: R2_BUCKET_NAME,
            url: videoUrl,
            size: file.size,
            type: file.type,
            uploadedBy: user.id
        });

    } catch (error: any) {
        console.error('[R2 Upload API] Upload error:', error);
        try {
            await logSystemAlert('R2Upload', `Upload to R2 failed: ${error.message}`);
        } catch (alertError) {
            console.error('Failed to log system alert:', alertError);
        }
        return NextResponse.json(
            { error: 'Error interno del servidor al procesar la subida.' },
            { status: 500 }
        );
    }
}
