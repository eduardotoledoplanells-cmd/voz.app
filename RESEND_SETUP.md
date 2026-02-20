# 📧 Configuración de Resend para Emails

## Paso 1: Crear cuenta en Resend (GRATIS)

1. Ve a https://resend.com
2. Haz clic en "Sign Up" (Registrarse)
3. Regístrate con tu email (revoluxbit.rob@gmail.com)
4. Verifica tu email

## Paso 2: Obtener tu API Key

1. Una vez dentro, ve a "API Keys" en el menú lateral
2. Haz clic en "Create API Key"
3. Dale un nombre (ej: "RevoluxBit Production")
4. Selecciona permisos: "Sending access"
5. Haz clic en "Create"
6. **COPIA LA API KEY** (solo se muestra una vez)

## Paso 3: Añadir la API Key a tu proyecto

1. Abre el archivo `.env.local` en la raíz de tu proyecto
2. Añade esta línea:

```
RESEND_API_KEY=re_tu_api_key_aqui
```

3. Guarda el archivo
4. **REINICIA el servidor** (detén npm run dev y vuelve a ejecutarlo)

## Paso 4: Probar el formulario

1. Ve a tu web
2. Haz clic en "Soporte" en el footer
3. Rellena el formulario
4. Envía un mensaje de prueba
5. Deberías recibir el email en revoluxbit.rob@gmail.com

## 📝 IMPORTANTE

### Mientras NO configures la API Key:
- Los mensajes se mostrarán en la consola (terminal)
- No se enviarán emails reales
- El formulario seguirá funcionando (modo desarrollo)

### Después de configurar la API Key:
- Los emails se enviarán a revoluxbit.rob@gmail.com
- Límite: 3,000 emails/mes (gratis)
- Los usuarios recibirán confirmación de envío

## 🔧 Email "From" (Remitente)

Por defecto, el email viene de: `onboarding@resend.dev`

**Para usar tu propio dominio:**
1. En Resend, ve a "Domains"
2. Añade tu dominio (si tienes uno)
3. Verifica el dominio con los registros DNS
4. Cambia en el código:
   ```typescript
   from: 'RevoluxBit <soporte@tudominio.com>'
   ```

**Si NO tienes dominio:**
- Puedes usar `onboarding@resend.dev` (funciona perfectamente)
- O registrar un dominio más adelante

## ✅ Verificación

Para verificar que funciona:
1. Envía un mensaje de prueba
2. Revisa la consola del servidor (terminal)
3. Deberías ver: "Email enviado correctamente"
4. Revisa tu bandeja de entrada en revoluxbit.rob@gmail.com

## 🆘 Problemas Comunes

**Error: "RESEND_API_KEY no está configurada"**
- Solución: Añade la API key en `.env.local` y reinicia el servidor

**No recibo emails**
- Revisa la carpeta de SPAM
- Verifica que la API key sea correcta
- Revisa los logs en https://resend.com/emails

**Error 401 Unauthorized**
- La API key es incorrecta o ha expirado
- Genera una nueva API key en Resend

## 📊 Monitorear Emails

En https://resend.com/emails puedes ver:
- Emails enviados
- Estado de entrega
- Errores
- Estadísticas
