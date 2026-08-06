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
                console.warn('[Presign API] Token verification fallback:', e);
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

        if (!filename || !fileSize) {
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

        let sanitizedFileType = (fileType || '').toLowerCase();

        // Infer from file extension if fileType is missing, generic or octet-stream
        if (!ALLOWED_VIDEO_TYPES.includes(sanitizedFileType)) {
            const ext = filename.split('.').pop()?.toLowerCase();
            if (ext === 'mp4' || ext === 'm4v') sanitizedFileType = 'video/mp4';
            else if (ext === 'mov') sanitizedFileType = 'video/quicktime';
            else if (ext === 'webm') sanitizedFileType = 'video/webm';
            else if (ext === 'mkv') sanitizedFileType = 'video/x-matroska';
            else if (ext === 'avi') sanitizedFileType = 'video/avi';
            else if (ext === 'mp3') sanitizedFileType = 'audio/mpeg';
            else if (ext === 'm4a') sanitizedFileType = 'audio/m4a';
            else if (ext === 'wav') sanitizedFileType = 'audio/wav';
            else sanitizedFileType = 'video/mp4'; // Default fallback for video files
        }

        const timestamp = Date.now();
        const sanitizedOriginalName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `videos/${authenticatedUserId}/${timestamp}-${sanitizedOriginalName}`;

        // 1. Primary: Supabase Storage Direct Signed Upload URL (CORS guaranteed for web browsers)
        let supabaseSignedUrl = '';
        let supabasePublicUrl = '';
        try {
            const { data: supaData, error: supaErr } = await supabaseAdmin.storage
                .from('media')
                .createSignedUploadUrl(storagePath);
            if (supaData && !supaErr) {
                supabaseSignedUrl = supaData.signedUrl;
                const { data: pubData } = supabaseAdmin.storage.from('media').getPublicUrl(storagePath);
                supabasePublicUrl = pubData?.publicUrl || '';
            }
        } catch (e) {
            console.warn('[Presign API] Supabase signed URL error:', e);
        }

        // 2. Secondary: R2 Presigned Upload URL
        let presignedUrl = '';
        let r2PublicUrl = '';
        try {
            const command = new PutObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: storagePath,
                ContentType: sanitizedFileType,
            });
            presignedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
            const publicBaseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
            if (publicBaseUrl) {
                const formattedBase = publicBaseUrl.endsWith('/') ? publicBaseUrl.slice(0, -1) : publicBaseUrl;
                r2PublicUrl = `${formattedBase}/${storagePath}`;
            } else {
                const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
                r2PublicUrl = `https://${R2_BUCKET_NAME}.${accountId}.r2.cloudflarestorage.com/${storagePath}`;
            }
        } catch (e) {
            console.warn('[Presign API] R2 signed URL error:', e);
        }

        return NextResponse.json({
            success: true,
            supabaseSignedUrl,
            supabasePublicUrl,
            presignedUrl,
            url: supabasePublicUrl || r2PublicUrl,
            r2Url: r2PublicUrl,
            key: storagePath,
            size: fileSize,
            type: sanitizedFileType,
        });

    } catch (error: any) {
        console.error('[Presign API] Error:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor al procesar la subida.' },
            { status: 500 }
        );
    }
}
