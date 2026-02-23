import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("audio") as File;

        if (!file) {
            return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${uuidv4()}.m4a`; // Asumimos m4a desde Expo, ajustar si es necesario

        // Upload to Supabase Storage
        const { data, error: uploadError } = await supabase.storage
            .from('media')
            .upload(`voice/${filename}`, buffer, {
                contentType: file.type,
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('Supabase storage error (voice):', uploadError);
            return NextResponse.json({ error: 'Failed to upload to storage' }, { status: 500 });
        }

        const { data: { publicUrl } } = supabase.storage
            .from('media')
            .getPublicUrl(`voice/${filename}`);

        return NextResponse.json({
            success: true,
            audioUrl: publicUrl,
            filename: filename
        });

    } catch (error) {
        console.error("Error uploading voice comment:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
