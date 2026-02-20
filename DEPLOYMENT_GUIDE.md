# Guía de Despliegue (Deployment)

Esta web es una aplicación **Next.js Full Stack** que utiliza una base de datos local y almacenamiento de archivos local.
**NO** es una web estática (como un simple HTML), por lo que **requiere un Servidor (VPS)** para funcionar.

> [!IMPORTANT]
> **No subir la carpeta `node_modules` ni `.next`**. Estas se generan en el servidor.

## Requisitos del Hosting (VPS)
Necesitas un servidor VPS (Virtual Private Server) con acceso a terminal (SSH).
*   **Proveedores recomendados**: DigitalOcean, Hetzner, AWS Lightsail, OVH.
*   **Sistema Operativo**: Ubuntu 22.04 LTS (recomendado).
*   **Software**: Node.js v18.17.0 o superior.

## Pasos para Desplegar

### 1. Preparar Archivos
Sube los archivos de tu ordenador al servidor (puedes usar FileZilla o `scp`), **EXCEPTO**:
- `node_modules/` (pesa mucho y se instala allí).
- `.next/` (se genera al construir).
- `.git/` (opcional).

Asegúrate de subir:
- `package.json` y `package-lock.json`
- `next.config.ts`
- `src/` (todo el código fuente)
- `public/` (imágenes, uploads, etc.)
- `.env.local` (¡Importante! Contiene tus claves de Stripe)

### 2. Instalación en el Servidor
Conéctate por terminal (SSH) a tu servidor y ve a la carpeta donde subiste la web.

```bash
# 1. Instalar dependencias
npm install

# 2. Construir la aplicación para producción
npm run build
```

### 3. Ejecución (Modo Producción)
Para que la web siga funcionando aunque cierres la terminal, usa `pm2` (un gestor de procesos).

```bash
# Instalar pm2 globalmente (si no lo tienes)
sudo npm install -g pm2

# Iniciar la web en el puerto 3000
pm2 start npm --name "mi-tienda" -- start

# Hacer que se reinicie automáticamente si el servidor se apaga
pm2 startup
pm2 save
```

## Mantenimiento
*   **Copia de seguridad**: Descarga regularmente el archivo `src/lib/db.json` y la carpeta `public/uploads` para no perder tus datos si el servidor falla.
