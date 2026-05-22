import admin from 'firebase-admin';
import serviceAccountJson from '../../service-account.json';

// Inicializar Firebase Admin SDK si no está ya inicializado
if (!admin.apps.length) {
    try {
        const projectId = process.env.FIREBASE_PROJECT_ID || serviceAccountJson.project_id;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || serviceAccountJson.client_email;
        const privateKey = (process.env.FIREBASE_PRIVATE_KEY || serviceAccountJson.private_key)?.replace(/\\n/g, '\n');

        if (projectId && clientEmail && privateKey) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            });
            console.log("Firebase Admin SDK inicializado exitosamente.");
        } else {
            console.warn("Aviso: No se encontraron credenciales de Firebase válidas.");
        }
    } catch (err) {
        console.error("Error inicializando Firebase Admin SDK:", err);
    }
}

export async function sendNativePush(
    fcmToken: string,
    title: string,
    body: string,
    dataPayload: Record<string, string> = {}
): Promise<{ success: boolean; messageId?: string; error?: any; code?: string; stack?: string; rawError?: any; token?: string }> {
    if (!admin.apps.length) {
        console.error("Fallo al enviar push: Firebase Admin no está inicializado.");
        return { success: false, error: "Firebase Admin no inicializado", token: fcmToken };
    }

    try {
        const message: admin.messaging.Message = {
            token: fcmToken,
            notification: {
                title,
                body,
            },
            android: {
                priority: "high",
                notification: {
                    channelId: "voz_high_priority",
                    sound: "default",
                    defaultSound: true,
                    defaultVibrateTimings: true,
                    visibility: "public",
                    priority: "max",
                    color: "#8E2DE2"
                }
            },
            data: {
                ...dataPayload,
                click_action: "FLUTTER_NOTIFICATION_CLICK"
            }
        };

        const messageId = await admin.messaging().send(message);
        console.log(`[FCM Real] Push nativa enviada exitosamente al token ${fcmToken.substring(0, 15)}... ID: ${messageId}`);
        return { success: true, messageId, token: fcmToken };
    } catch (error: any) {
        const isDeadToken = error.code === 'messaging/registration-token-not-registered' || 
                           (error.message && error.message.includes('Requested entity was not found'));
        
        if (isDeadToken) {
            console.log(`[FCM Real] Token caducado detectado silenciosamente. Será limpiado. (${fcmToken.substring(0, 15)}...)`);
        } else {
            console.error("[FCM Real Error] Fallo al enviar push nativa:", error.message || error);
        }

        return { 
            success: false, 
            error: error.message || error, 
            code: isDeadToken ? 'messaging/registration-token-not-registered' : error.code, 
            stack: error.stack, 
            rawError: JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error))),
            token: fcmToken
        };
    }
}
