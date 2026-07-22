import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { supabaseAdmin } from "@/lib/db";
import { logSystemAlert } from '@/lib/alerts';

export async function POST(request: NextRequest) {
    try {
        // Autenticación estricta con Token Bearer de Supabase Auth
        let authenticatedUserId: string | null = null;
        const authHeader = request.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const { data: authUser } = await supabaseAdmin.auth.getUser(token);
                if (authUser?.user) {
                    authenticatedUserId = authUser.user.id;
                }
            } catch (e) {
                console.warn("Auth token validation failed in voice upload:", e);
            }
        }

        if (!authenticatedUserId) {
            return NextResponse.json({ error: 'Acceso denegado: Token de sesión inválido o inexistente' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("audio") as File;

        if (!file) {
            return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${uuidv4()}.m4a`;

        // Upload to Supabase Storage con Caché Inmutable Edge
        const { data, error: uploadError } = await supabaseAdmin.storage
            .from('media')
            .upload(`voice/${filename}`, buffer, {
                contentType: file.type,
                cacheControl: '31536000',
                upsert: false
            });

        if (uploadError) {
            console.error('Supabase storage error (voice):', uploadError);
            return NextResponse.json({ error: 'Failed to upload to storage' }, { status: 500 });
        }

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('media')
            .getPublicUrl(`voice/${filename}`);

        return NextResponse.json({
            success: true,
            audioUrl: publicUrl,
            filename: filename
        });

    } catch (error) {
        console.error("Error uploading voice comment:", error);
        await logSystemAlert('VoiceUpload', error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
