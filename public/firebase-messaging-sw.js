importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-messaging-compat.js');

// SUSTITUIR CON TU CONFIGURACIÓN DE FIREBASE (El Service Worker estático no puede leer process.env directamente)
// Puedes encontrar esto en tu consola de Firebase > Configuración del proyecto
const firebaseConfig = {
  apiKey: "API_KEY_AQUI",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "SENDER_ID_AQUI",
  appId: "APP_ID_AQUI"
};

// Intenta inicializar Firebase. En producción, asegúrate de reemplazar apiKey, projectId, etc.
try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification?.title || payload.data?.title || 'Nueva notificación';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.message || 'Tienes una alerta nueva',
      icon: '/logo.png', // Ajusta a tu logo (que exista en public/)
      data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (error) {
  console.error("Error inicializando Firebase en Service Worker:", error);
}
