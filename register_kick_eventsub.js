// Archivo: register_kick_eventsub.js
// Ejecución: node register_kick_eventsub.js
// Requiere: Node.js instalado (v18+)

// NOTA: Debes sustituir estas credenciales por las de tu aplicación de Kick (https://dev.kick.com)
const CLIENT_ID = '01KWC09ST46Z9K3P5BQJ1CC5ZK';
const CLIENT_SECRET = 'eb226551200dabc5bc3e14c9a2e5e757d4a716c8b5afcc42c896c3ffcd9c1f62';
const WEBHOOK_SECRET = 'SecretoSuperSeguroVozApp123!'; // Debe coincidir con KICK_WEBHOOK_SECRET en .NET
const NGROK_URL = 'https://stimulant-chokehold-mountable.ngrok-free.dev'; // Túnel activo hacia el puerto 5005
const BROADCASTER_USER_ID = 'ID_DEL_CANAL_DE_KICK_AQUI'; // El ID numérico o slug del canal de Kick

async function registerEventSub() {
    console.log("1. Obteniendo App Access Token de Kick...");
    // Endpoint aproximado según la API de Kick. Podría requerir ajuste según la documentación oficial de dev.kick.com
    const tokenRes = await fetch(`https://api.kick.com/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'client_credentials'
        })
    });
    
    if (!tokenRes.ok) {
        console.error("Error al obtener token de Kick:", await tokenRes.text());
        return;
    }
    
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    console.log("Token obtenido exitosamente.");

    console.log(`2. Registrando suscripción 'livestream.status.updated' para el canal ${BROADCASTER_USER_ID}...`);
    // Endpoint oficial de webhooks de Kick
    const subRes = await fetch('https://api.kick.com/v1/events/subscriptions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "type": "livestream.status.updated",
            "version": "1",
            "condition": {
                "broadcaster_user_id": BROADCASTER_USER_ID
            },
            "transport": {
                "method": "webhook",
                "callback": `${NGROK_URL}/api/webhooks/kick`,
                "secret": WEBHOOK_SECRET
            }
        })
    });

    if (subRes.ok) {
        const result = await subRes.json();
        console.log("✅ Suscripción a Kick exitosa:", result);
    } else {
        console.error("❌ Error al suscribirse a Kick:", await subRes.text());
    }
}

registerEventSub();
