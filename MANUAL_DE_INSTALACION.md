# REQUISITOS DEL SERVIDOR

Para que la web de **RevoluxBit** funcione correctamente en un entorno de producción (Hosting/VPS), el servidor debe cumplir con los siguientes requisitos mínimos:

1.  **Node.js**: Versión 18.17.0 o superior (recomendada v20.x LTS).
2.  **Administrador de Paquetes**: npm o yarn instalados.
3.  **Sistema Operativo**: Linux (Ubuntu 22.04 LTS recomendado), aunque funciona en cualquier sistema que soporte Node.js.
4.  **Memoria RAM**: Mínimo 1GB (2GB recomendados para el proceso de compilación `build`).
5.  **Espacio en Disco**: Al menos 500MB libres para la aplicación y archivos subidos.
6.  **Acceso a Terminal (SSH)**: Necesario para ejecutar los comandos de instalación y arranque.
7.  **Conectividad**: Acceso a internet para comunicarse con las APIs de Stripe, Resend y OpenAI.

---

# GUÍA DE INSTALACIÓN PASO A PASO

### 1. Preparación de los Archivos
Sube el contenido del proyecto a tu servidor, omitiendo las carpetas `.next` y `node_modules`. Puedes usar FTP (FileZilla) o comandos como `scp`.

### 2. Configuración de Variables de Entorno
Renombra el archivo `.env.example` a `.env.local` y rellena los campos con tus credenciales reales:
*   `STRIPE_SECRET_KEY`: Tu clave secreta de Stripe.
*   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Tu clave pública de Stripe.
*   `RESEND_API_KEY`: Tu clave de API de Resend para el envío de emails.
*   `OPENAI_API_KEY`: Tu clave de OpenAI para las funciones de IA.

### 3. Instalación de Dependencias
Abre una terminal en la carpeta raíz del proyecto y ejecuta:
```bash
npm install
```

### 4. Compilación del Proyecto
Genera la versión optimizada para producción:
```bash
npm run build
```

### 5. Puesta en Marcha (Producción)
Para ejecutar la web de forma permanente (que no se detenga al cerrar la terminal), se recomienda usar **PM2**:

```bash
# Instalar PM2 si no está presente
sudo npm install -g pm2

# Iniciar la aplicación
pm2 start npm --name "revoluxbit-web" -- start

# Guardar la configuración para reinicios del servidor
pm2 startup
pm2 save
```

---

# MANTENIMIENTO Y SEGURIDAD

*   **Base de Datos**: La web utiliza un sistema de archivos JSON (`src/lib/db.json`). Se recomienda hacer copias de seguridad periódicas de este archivo.
*   **Archivos Multimedia**: Las imágenes subidas por los usuarios se guardan en `public/uploads`. No olvides incluir esta carpeta en tus backups.
*   **Actualizaciones**: Para aplicar cambios, simplemente descarga los nuevos archivos, ejecuta `npm update`, `npm run build` y reinicia con `pm2 restart revoluxbit-web`.
