# Arquitectura Híbrida: Cliente-Servidor + P2P Controlado (AntiGravity)

## Objetivo General
Crear una aplicación compatible con **iOS App Store** y **Google Play**, optimizada para **costes bajos de servidor** mediante un modelo híbrido. El sistema reduce la carga del servidor utilizando **P2P oportunista** y **caché local** en los dispositivos, pero **NUNCA** actúa como un servidor permanente ni viola las políticas de segundo plano de los sistemas operativos móviles.

---

## 1. Estructura de Tres Capas

La arquitectura se fundamenta en tres pilares:

1.  **Servidor Central Mínimo (Source of Truth):** Nunca desaparece, garantiza la disponibilidad.
2.  **Clientes Móviles (Android / iOS):** Consumidores que actúan como pares (peers) temporales.
3.  **Distribución Híbrida:** Prioriza P2P local > Servidor Central.

---

## 2. Roles del Sistema

### A. Servidor Central (AntiGravity Backend)
Se encarga exclusivamente de lo que NO se puede delegar:
*   **Autenticación y Perfiles:** Gestión segura de usuarios.
*   **Feed y Algoritmo:** Orden, ranking y recomendaciones personalizadas.
*   **Metadatos:** Títulos, descripciones, likes, comentarios.
*   **Almacenamiento Maestro (Fallback):** Guarda el archivo original del vídeo.
*   **Signaling P2P:** Coordina la conexión entre peers (quién tiene qué chunk).
*   **Moderación y Legal:** Control de contenidos.

*El servidor NO intenta transmitir vídeo directamente si existen peers disponibles.*

### B. Cliente Móvil (App)
*   **Rol Principal:** Reproductor y caché inteligente.
*   **Rol Secundario (Opportunistic Peer):** Solo comparte datos bajo condiciones estrictas.
*   **Restricciones:** 
    *   **NO** ejecuta servicios en segundo plano permanentes.
    *   **NO** actúa como servidor cuando la app está cerrada o suspendida.

---

## 3. Gestión y Distribución de Vídeo

### Formato de Vídeo
*   **Duración Máxima:** 30 segundos.
*   **Procesamiento:**
    *   **Transcodificación:** Formato optimizado para móvil (H.264/H.265).
    *   **Chunking:** Fragmentación en piezas pequeñas (chunks) para facilitar el intercambio P2P.
    *   **Verificación:** Cada vídeo tiene un ID único y un Hash para asegurar integridad.

### Flujo de Reproducción (El "Algoritmo Híbrido")
Cuando un usuario solicita ver un vídeo:
1.  **Consulta:** El cliente pregunta al servidor "¿Quién tiene el vídeo X?".
2.  **Respuesta:** El servidor devuelve:
    *   Lista de Peers Activos (usuarios cercanos/óptimos con el archivo).
    *   URL de Respaldo (CDN/Servidor) por si falla el P2P.
3.  **Intento P2P (WebRTC):** El cliente intenta conectar con los peers para descargar chunks.
4.  **Fallback Transparente:** Si el P2P es lento o falla, cambia automáticamente al streaming del servidor.
    *   *Resultado:* El usuario nunca percibe cortes ("buffering").

---

## 4. Política de P2P y Restricciones (iOS / Android)

El sistema P2P se activa **SOLO** si se cumplen TODAS las condiciones:

| Condición | Estado Requerido |
| :--- | :--- |
| **Estado App** | **Primer Plano (Foreground)** y Activa. |
| **Red** | Preferiblemente **WiFi**. Datos móviles solo si el usuario lo permite explícitamente. |
| **Batería** | Nivel suficiente (>20% y no en modo ahorro). |
| **Recursos** | CPU/Memoria disponibles sin afectar la experiencia de usuario. |

**❌ PROHIBIDO (Store Compliance):**
*   Ejecución en segundo plano para servir datos "ocultos".
*   Uso de la batería o datos del usuario con la app cerrada.
*   Comportamiento tipo "botnet" o servidor permanente.

---

## 5. Caché Local Inteligente

*   **Almacenamiento:** El dispositivo guarda los chunks de los vídeos vistos y los vídeos "siguientes" en el feed (prefetching).
*   **Limpieza:**
    *   Límite de tamaño configurable (ej. 500MB).
    *   Política LRU (Least Recently Used): Se borra lo más antiguo.
    *   Limpieza automática si el SO reclama espacio.

---

## 6. Consentimiento y Privacidad

Para cumplir con GDPR y políticas de Stores:
*   **Opt-in Explícito:** El usuario debe aceptar un diálogo claro: *"Para mantener la app gratuita y rápida, compartimos fragmentos de vídeo con otros usuarios mientras usas la app en WiFi."*
*   **Control Total:** Interruptor en Ajustes para desactivar "Aceleración P2P" (modo solo servidor).
*   **Anonimato:** Las conexiones WebRTC no exponen datos personales, solo direcciones IP transitorias para la transmisión.

---

## 7. Métricas de Éxito

*   **Reducción de Costes:** Egress del servidor reducido en un 60-80%.
*   **Experiencia:** Tiempos de carga iguales o menores a TikTok.
*   **Aprobación:** Validación en App Store y Google Play sin rechazos por uso indebido de recursos.
