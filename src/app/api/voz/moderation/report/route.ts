import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { targetId, reporter, reason, content, type } = body;

        if (!reporter || !reason || !targetId) {
            return NextResponse.json({ success: false, error: "Faltan datos requeridos para la denuncia." }, { status: 400 });
        }

        const moderationId = uuidv4();

        // Determinar URL y usuario reportado basándonos en el contenido reportado
        let url = "";
        let reportedUser = "Desconocido";
        let modType = type || 'video';

        if (content) {
            if (content.videoUrl) {
                url = content.videoUrl.startsWith('http') ? content.videoUrl : `https://voz.app${content.videoUrl}`;
                reportedUser = content.user;
                modType = 'video';
            } else if (content.uri) {
                // Audio comment
                url = content.uri.startsWith('http') ? content.uri : `https://voz.app${content.uri}`;
                reportedUser = content.user;
                modType = 'audio';
            }
        }

        const { error } = await supabase
            .from('moderation_queue')
            .insert([{
                id: moderationId,
                type: modType,
                url: url,
                user_handle: reportedUser,
                report_reason: `Reportado por ${reporter}: ${reason}`,
                content: targetId, // Guarda el ID del contenido
                status: 'pending',
                timestamp: new Date().toISOString()
            }]);

        if (error) {
            console.error("Error inserting moderation item:", error);
            return NextResponse.json({ success: false, error: "Error al registrar la denuncia en la base de datos." }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Denuncia registrada con éxito.", item: null });
    } catch (e: any) {
        console.error("Error in /api/voz/moderation/report:", e);
        return NextResponse.json({ success: false, error: "Ocurrió un error inesperado al procesar la denuncia." }, { status: 500 });
    }
}
