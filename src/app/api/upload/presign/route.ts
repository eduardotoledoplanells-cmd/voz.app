import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { supabaseAdmin } from '@/lib/db';
import { r2Client, R2_BUCKET_NAME } from '@/lib/r2';

const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB limit
const ALLOWED_VIDEO_TYPES = [
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska', 'video/avi', 'video/mpeg', 'video/mov', 'video/3gpp', 'video/x-m4v',
    'audio/m4a', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/x-wav', 'audio/ogg'
];

export async function POST(request: Request) {
    try {
        let authenticatedUserId: string | null = null;
        const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
        const userHandleHeader = request.headers.get('x-user-handle') || request.headers.get('x-user-id');

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
                if (user && !authError) {
                    authenticatedUserId = user.id;
                }
            } catch (e) {
                console.warn('[R2 Presign API] Token verification fallback:', e);
            }
        }

        if (!authenticatedUserId && userHandleHeader) {
            const cleanHandle = userHandleHeader.replace('@', '');
            const { data: appUser } = await supabaseAdmin
                .from('app_users')
                .select('id, handle')
                .or(`id.eq.${userHandleHeader},handle.ilike.${cleanHandle},handle.ilike.@${cleanHandle}`)
                .maybeSingle();

            if (appUser) {
                authenticatedUserId = appUser.id;
            } else {
                authenticatedUserId = userHandleHeader;
            }
        }

        if (!authenticatedUserId) {
            authenticatedUserId = 'web_user';
        }

        const body = await request.json();
        const { filename, fileType, fileSize } = body;

        if (!filename || !fileType || !fileSize) {
            return NextResponse.json(
                { error: 'Faltan metadatos del archivo.' },
                { status: 400 }
            );
        }

        if (fileSize > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: 'El archivo supera el límite permitido de 1GB.' },
                { status: 400 }
            );
        }

        if (!ALLOWED_VIDEO_TYPES.includes(fileType)) {
            return NextResponse.json(
                { error: `Tipo de archivo inválido (${fileType}). Solo se permiten formatos de vídeo o audio permitidos.` },
                { status: 400 }
            );
        }

        const timestamp = Date.now();
        const sanitizedOriginalName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        const key = `videos/${authenticatedUserId}/${timestamp}-${sanitizedOriginalName}`;

        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            ContentType: fileType,
            CacheControl: 'public, max-age=31536000, immutable',
        });

        // URL expira en 1 hora
        const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });

        const publicBaseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
        let videoUrl = '';
        if (publicBaseUrl) {
            const formattedBase = publicBaseUrl.endsWith('/') ? publicBaseUrl.slice(0, -1) : publicBaseUrl;
            videoUrl = `${formattedBase}/${key}`;
        } else {
            const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
            videoUrl = `https://${R2_BUCKET_NAME}.${accountId}.r2.cloudflarestorage.com/${key}`;
        }

        return NextResponse.json({
            success: true,
            presignedUrl,
            url: videoUrl,
            key,
            bucket: R2_BUCKET_NAME,
            size: fileSize,
            type: fileType,
        });

    } catch (error: any) {
        console.error('[R2 Presign API] Error:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor al procesar la subida.' },
            { status: 500 }
        );
    }
}
