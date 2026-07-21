import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin, deleteVideo, addNotification } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

async function moderateVideoWithAI(videoId: string, videoUrl: string, thumbnailUrl: string, description: string, userHandle: string) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.warn("[AI Moderation] OPENAI_API_KEY no configurado. Omitiendo moderación automática.");
        return;
    }

    try {
        console.log(`[AI Moderation] Iniciando moderación automática por IA para el video ${videoId}...`);
        let isSafe = true;
        let aiReason = "";

        // 1. Verificar la miniatura (si existe) con GPT-4o-mini (Vision)
        if (thumbnailUrl) {
            const absoluteThumbnailUrl = thumbnailUrl.startsWith('http') ? thumbnailUrl : `https://voz.app${thumbnailUrl}`;
            console.log(`[AI Moderation] Analizando miniatura: ${absoluteThumbnailUrl}`);
            
            const thumbRes = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: 'Analyze this video thumbnail. Does it contain nudity, sexually explicit content, pornography, graphic violence, gore, blood, or murders? Answer strictly with either "SAFE" or "UNSAFE" and nothing else.'
                                },
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: absoluteThumbnailUrl
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens: 5,
                    temperature: 0.0
                })
            });

            if (thumbRes.ok) {
                const data = await thumbRes.json();
                const result = data.choices?.[0]?.message?.content?.trim()?.toUpperCase() || 'SAFE';
                console.log(`[AI Moderation] Resultado miniatura: ${result}`);
                if (result === 'UNSAFE') {
                    isSafe = false;
                    aiReason = "Imagen de portada no permitida: detectado contenido explícito, pornográfico o de violencia/sangre.";
                }
            } else {
                console.error("[AI Moderation] Error en llamada a OpenAI Vision:", await thumbRes.text());
            }
        }

        // 2. Si sigue siendo segura, verificar la descripción con la API de moderación de OpenAI (Gratuita y rápida)
        if (isSafe && description) {
            console.log(`[AI Moderation] Analizando texto de descripción: "${description}"`);
            const textRes = await fetch('https://api.openai.com/v1/moderations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    input: description
                })
            });

            if (textRes.ok) {
                const data = await textRes.json();
                const result = data.results?.[0];
                if (result && result.flagged) {
                    const categories = result.categories || {};
                    const isViolated = categories.sexual || categories['sexual/minors'] || categories.violence || categories['violence/graphic'] || categories.harassment;
                    if (isViolated) {
                        isSafe = false;
                        aiReason = "El texto de la descripción infringe las normas de la comunidad (contenido inapropiado o violento).";
                    }
                }
            } else {
                console.error("[AI Moderation] Error en llamada a OpenAI Moderation:", await textRes.text());
            }
        }

        // 3. Si la IA detecta que es UNSAFE: borrar video de la base de datos, marcar reportes como resueltos (rejected) y notificar al creador
        if (!isSafe) {
            console.log(`[AI Moderation] Video ${videoId} clasificado como INSEGURO por IA. Procediendo a eliminar.`);

            // Eliminar video
            await deleteVideo(videoId, userHandle);

            // Actualizar estado en la cola de moderación a 'rejected' para todas las denuncias asociadas a este video
            await supabaseAdmin
                .from('moderation_queue')
                .update({ status: 'rejected' })
                .eq('content', videoId);

            // Notificar al usuario creador
            await addNotification({
                id: `ai-mod-del-${videoId}-${Date.now()}`,
                recipientId: userHandle,
                type: 'moderation',
                title: '⛔ Contenido eliminado por IA',
                message: `Tu video ha sido eliminado automáticamente tras recibir múltiples denuncias. La Inteligencia Artificial de seguridad ha determinado que infringe las normas comunitarias: ${aiReason}`,
                timestamp: new Date().toISOString(),
                readStatus: false
            });
        } else {
            console.log(`[AI Moderation] El video ${videoId} superó la verificación automática de IA (SAFE). Queda pendiente de revisión manual si el moderador lo considera.`);
        }

    } catch (err) {
        console.error("[AI Moderation] Error durante la moderación por IA:", err);
    }
}

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
        let userId = 'anonymous';
        const authHeader = req.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const { data: { user }, error: authError } = await supabase.auth.getUser(token);
            if (!authError && user) {
                userId = user.id;
            }
        }

        // 2. Rate Limiting: Key on user ID + client IP
        const clientIp = req.headers.get('x-forwarded-for') || (req as any).ip || 'unknown-ip';
        const rateLimitKey = `${userId}:${clientIp}`;

        if (isRateLimited(rateLimitKey)) {
            console.warn(`[REPORT_RATE_LIMIT] Rate limit exceeded for user ${userId} (${clientIp})`);
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

        // --- LÓGICA DE MODERACIÓN AUTOMÁTICA POR IA ---
        // Si el contenido denunciado es un vídeo y es la décima denuncia (o superior), disparamos la IA
        if (modType === 'video') {
            try {
                // Contar denuncias en la cola para este video
                const { count, error: countError } = await supabaseAdmin
                    .from('moderation_queue')
                    .select('id', { count: 'exact', head: true })
                    .eq('content', targetId);

                if (!countError && count !== null && count >= 10) {
                    console.log(`[AI Moderation Trigger] El video ${targetId} ha alcanzado ${count} denuncias. Lanzando moderación por IA...`);
                    
                    // Obtener detalles del video
                    const { data: videoData } = await supabaseAdmin
                        .from('videos')
                        .select('thumbnail_url, description, user_handle')
                        .eq('id', targetId)
                        .single();

                    if (videoData) {
                        // Lanzar el proceso de moderación por IA de forma asíncrona sin bloquear la respuesta del cliente
                        moderateVideoWithAI(
                            targetId,
                            url,
                            videoData.thumbnail_url,
                            videoData.description,
                            videoData.user_handle
                        ).catch(aiErr => console.error("Error in asynchronous AI moderation:", aiErr));
                    }
                }
            } catch (triggerError) {
                console.error("Error checking report threshold for AI moderation:", triggerError);
            }
        }

        return NextResponse.json({ success: true, message: "Denuncia registrada con éxito.", item: null });
    } catch (e: any) {
        console.error("Error in /api/voz/moderation/report:", e);
        return NextResponse.json({ success: false, error: "Ocurrió un error inesperado al procesar la denuncia." }, { status: 500 });
    }
}
