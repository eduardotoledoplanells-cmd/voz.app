import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { reporterHandle, reportedHandle, reason, type } = body;

        if (!reporterHandle || !reportedHandle || !reason || !type) {
            return NextResponse.json({ success: false, error: "Faltan datos requeridos para la denuncia." }, { status: 400 });
        }

        // Generate a random ID for the moderation item
        const moderationId = uuidv4();

        // Insert into the moderation_queue table using the anonymous auth client (now allowed by RLS)
        const { data, error } = await supabase
            .from('moderation_queue')
            .insert([{
                id: moderationId,
                type: type, // 'profile'
                url: `https://voz.app/profile/${reportedHandle.replace('@', '')}`,
                user_handle: reportedHandle,
                report_reason: `Reportado por ${reporterHandle}: ${reason}`,
                content: `Perfil de usuario`,
                status: 'pending',
                timestamp: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) {
            console.error("Error inserting moderation item:", error);
            return NextResponse.json({ success: false, error: "Error al registrar la denuncia en la base de datos." }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Denuncia registrada con éxito.", item: data });
    } catch (e: any) {
        console.error("Error in /api/voz/users/report:", e);
        return NextResponse.json({ success: false, error: "Ocurrió un error inesperado al procesar la denuncia." }, { status: 500 });
    }
}
