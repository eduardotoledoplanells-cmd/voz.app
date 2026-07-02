// Archivo: register_twitch_eventsub.js
// Ejecución: node register_twitch_eventsub.js
// Requiere: Node.js instalado (v18+)

const CLIENT_ID = '8jptdh9o287yhf47kjs2y4grnnjdhp';
const CLIENT_SECRET = 'n5lgreohtj8igo0afws56pvjtyqzeb';
const WEBHOOK_SECRET = 'SecretoSuperSeguroVozApp123!'; // Debe coincidir con TWITCH_WEBHOOK_SECRET en .NET
const NGROK_URL = 'https://stimulant-chokehold-mountable.ngrok-free.dev'; // Túnel activo hacia el puerto 5005
const BROADCASTER_USER_ID = 'ID_DEL_CANAL_DE_PRUEBA_AQUI'; // El ID numérico del canal a escuchar (ej. 12345678)

async function registerEventSub() {
    console.log("1. Obteniendo App Access Token...");
    const tokenRes = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`, {
        method: 'POST'
    });
    
    if (!tokenRes.ok) {
        console.error("Error al obtener token:", await tokenRes.text());
        return;
    }
    
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    console.log("Token obtenido exitosamente.");

    console.log(`2. Registrando suscripción 'stream.online' para el usuario ${BROADCASTER_USER_ID}...`);
    const subRes = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
        method: 'POST',
        headers: {
            'Client-Id': CLIENT_ID,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "type": "stream.online",
            "version": "1",
            "condition": {
                "broadcaster_user_id": BROADCASTER_USER_ID
            },
            "transport": {
                "method": "webhook",
                "callback": `${NGROK_URL}/api/webhooks/twitch`,
                "secret": WEBHOOK_SECRET
            }
        })
    });

    if (subRes.ok) {
        const result = await subRes.json();
        console.log("✅ Suscripción Stream Online exitosa:", result.data[0].status);
    } else {
        console.error("❌ Error al suscribirse:", await subRes.text());
    }
}

registerEventSub();
