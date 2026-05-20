import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui, sans-serif', maxWidth: '800px', margin: '0 auto', color: '#fff', backgroundColor: '#000', minHeight: '100vh' }}>
      <h1 style={{ color: '#8E2DE2' }}>Política de Privacidad de VOZ</h1>
      <p><strong>Última actualización:</strong> 5 de Mayo de 2026</p>

      <h2>1. Información que recopilamos</h2>
      <p>VOZ recopila información necesaria para el funcionamiento de la red social, incluyendo:</p>
      <ul>
        <li>Información de la cuenta (nombre de usuario, correo electrónico, número de teléfono).</li>
        <li>Contenido generado por el usuario (vídeos, audios, comentarios, transcripciones).</li>
        <li>Información de uso y datos de interacción (likes, visualizaciones, guardados).</li>
      </ul>

      <h2>2. Uso de la información</h2>
      <p>Utilizamos tu información para:</p>
      <ul>
        <li>Proporcionar y mejorar nuestros servicios.</li>
        <li>Personalizar tu feed (algoritmo de recomendación).</li>
        <li>Procesar pagos y regalos mediante Stripe.</li>
        <li>Hacer cumplir nuestras políticas de moderación.</li>
      </ul>

      <h2>3. Permisos del Dispositivo</h2>
      <p>Para funcionar correctamente, la App requiere acceso a:</p>
      <ul>
        <li><strong>Cámara y Micrófono:</strong> Para grabar vídeos y notas de voz.</li>
        <li><strong>Galería:</strong> Para subir contenido preexistente.</li>
      </ul>
      <p>Ningún contenido es grabado o subido sin la acción explícita del usuario.</p>

      <h2>4. Retención y Eliminación de Datos</h2>
      <p>Los vídeos con más de 1 año de antigüedad y menos de 50 visualizaciones son eliminados de nuestros servidores automáticamente, incluyendo todas sus notas de voz. Tienes el derecho de eliminar tu cuenta y todos tus datos personales en cualquier momento desde los "Ajustes de Perfil" de la aplicación.</p>

      <h2>5. Compartir Información</h2>
      <p>No vendemos tus datos a terceros. Compartimos información estrictamente necesaria con proveedores de servicios esenciales (ej. Stripe para pagos, Supabase para almacenamiento de base de datos) bajo estrictos acuerdos de confidencialidad.</p>

      <h2>6. Contacto</h2>
      <p>Para dudas sobre privacidad, puedes contactar al soporte de VOZ dentro de la aplicación o a través de nuestros canales oficiales.</p>
    </div>
  );
}
