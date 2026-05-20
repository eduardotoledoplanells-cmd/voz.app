import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

// Simple in-memory rate limiter
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REPORTS_PER_WINDOW = 5; // Allow at most 5 reports per minute per user/IP

function isRateLimited(key: string): boolean {
    const now = Date.now();
    const clientData = requestCounts.get(key);
    
    if (!clientData || now > clientData.resetTime) {
        requestCounts.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
        return false;
    }
    
    if (clientData.count >= MAX_REPORTS_PER_WINDOW) {
        return true;
    }
    
    clientData.count++;
    return false;
}

export async function POST(req: NextRequest) {
    try {
        // 1. Session Validation: Verify bearer token against Supabase Auth
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, error: "No autorizado. Inicie sesión para enviar reportes." }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError || !user) {
            console.warn("[REPORT_SPAM_PREVENTION] Invalid session token attempt:", authError);
            return NextResponse.json({ success: false, error: "Sesión inválida o expirada. Vuelva a iniciar sesión." }, { status: 401 });
        }

        // 2. Rate Limiting: Key on user ID + client IP
        const clientIp = req.headers.get('x-forwarded-for') || (req as any).ip || 'unknown-ip';
        const rateLimitKey = `${user.id}:${clientIp}`;

        if (isRateLimited(rateLimitKey)) {
            console.warn(`[REPORT_RATE_LIMIT] Rate limit exceeded for user ${user.id} (${clientIp})`);
            return NextResponse.json({ 
                success: false, 
                error: "Has enviado demasiados reportes en poco tiempo. Por favor, espera un minuto." 
            }, { status: 429 });
        }

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
