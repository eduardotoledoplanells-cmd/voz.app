import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0B0B12', color: '#F1F1F5', fontFamily: 'Inter, sans-serif', padding: '40px 20px 80px' }}>
            <div style={{ maxWidth: '980px', margin: '0 auto' }}>
                {/* Header Superior */}
                <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                    <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: '20px', background: 'rgba(142, 45, 226, 0.15)', border: '1px solid rgba(142, 45, 226, 0.4)', color: '#C084FC', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>
                        Privacidad y Protección de Datos • LYVO Media
                    </div>
                    <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 10px', background: 'linear-gradient(135deg, #FFFFFF 0%, #A855F7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Política de Privacidad
                    </h1>
                    <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>
                        Última actualización: {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })} • Reglamento General de Protección de Datos (RGPD UE 2016/679) y LOPDGDD 3/2018
                    </p>
                </div>

                <div style={{ backgroundColor: '#13131F', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '36px 32px', lineHeight: '1.75', fontSize: '15px', color: 'rgba(255, 255, 255, 0.85)' }}>
                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px', marginBottom: '16px' }}>
                            1. Responsable del Tratamiento
                        </h2>
                        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px', padding: '16px 20px', borderLeft: '4px solid #8E2DE2' }}>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                <li style={{ marginBottom: '6px' }}><strong>• Titular / Denominación:</strong> LYVO Media</li>
                                <li style={{ marginBottom: '6px' }}><strong>• N.I.F.:</strong> 43148082J</li>
                                <li style={{ marginBottom: '6px' }}><strong>• Domicilio:</strong> Calle del General Luque, 42, 07300 Inca, Palma de Mallorca (Illes Balears, España)</li>
                                <li style={{ marginBottom: '6px' }}><strong>• Correo de Contacto y DPO:</strong> <a href="mailto:lyvo@lyvo.media" style={{ color: '#C084FC', textDecoration: 'none' }}>lyvo@lyvo.media</a></li>
                            </ul>
                        </div>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px', marginBottom: '16px' }}>
                            2. Datos que Recabamos y Finalidades
                        </h2>
                        <p style={{ marginBottom: '12px' }}>LYVO recaba los datos estrictamente necesarios para la prestación del servicio de red social audiovisual y monetización:</p>
                        <ul style={{ paddingLeft: '20px', marginBottom: '14px' }}>
                            <li style={{ marginBottom: '6px' }}><strong>Datos de Cuenta:</strong> Nombre de usuario, email, número de teléfono y fotografía de perfil para gestionar tu acceso e identidad en la plataforma.</li>
                            <li style={{ marginBottom: '6px' }}><strong>Contenido Multimedia y Transcripciones:</strong> Vídeos cortos, reacciones y grabaciones de audio enviadas por el usuario.</li>
                            <li style={{ marginBottom: '6px' }}><strong>Procesamiento de Audio por IA:</strong> Las notas de voz son procesadas mediante algoritmos de Inteligencia Artificial para fines de accesibilidad, transcripción y detección proactiva de contenidos ilícitos o de odio.</li>
                            <li style={{ marginBottom: '6px' }}><strong>Datos de Pagos y Cobros:</strong> Gestión de recargas de monedas y transferencias de ganancias (Payouts) a creadores a través de la infraestructura bancaria certificada de <strong>Stripe</strong>.</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px', marginBottom: '16px' }}>
                            3. Conservación y Ciclo de Vida de los Datos
                        </h2>
                        <ul style={{ paddingLeft: '20px', marginBottom: '14px' }}>
                            <li style={{ marginBottom: '6px' }}><strong>Mensajería Privada y Audios:</strong> Los archivos de audio de conversaciones privadas se eliminan automáticamente de los servidores transcurridos <strong>30 días</strong> naturales desde su lectura.</li>
                            <li style={{ marginBottom: '6px' }}><strong>Vídeos Antiguos Inactivos:</strong> Los vídeos con más de 1 año de antigüedad y bajo nivel de visualizaciones son purgados periódicamente de los clústeres CDN para optimizar el almacenamiento.</li>
                            <li style={{ marginBottom: '6px' }}><strong>Datos de Creadores y Fiscalidad:</strong> Los registros de transacciones se conservan durante el plazo legal de 6 años exigido por la normativa tributaria española (AEAT).</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px', marginBottom: '16px' }}>
                            4. Destinatarios y Proveedores de Confianza
                        </h2>
                        <p style={{ marginBottom: '12px' }}>No comercializamos ni vendemos tus datos a terceros. Compartimos información estrictamente con proveedores esenciales bajo acuerdos de protección de datos (DPA):</p>
                        <ul style={{ paddingLeft: '20px', marginBottom: '14px' }}>
                            <li style={{ marginBottom: '6px' }}><strong>Stripe Technology Europe, Ltd.:</strong> Entidad de Dinero Electrónico autorizada por el Banco Central de Irlanda para el procesamiento de pagos y transferencias a creadores.</li>
                            <li style={{ marginBottom: '6px' }}><strong>Supabase & Cloud Infrastructure:</strong> Alojamiento de bases de datos seguras y servidores de contenido multimedia.</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '10px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px', marginBottom: '16px' }}>
                            5. Derechos ARCO+ (RGPD)
                        </h2>
                        <p style={{ marginBottom: '12px' }}>
                            Puedes ejercitar en cualquier momento tus derechos de Acceso, Rectificación, Supresión (Derecho al Olvido), Limitación, Oposición y Portabilidad enviando un correo a <a href="mailto:lyvo@lyvo.media" style={{ color: '#C084FC', textDecoration: 'none' }}>lyvo@lyvo.media</a>.
                        </p>
                    </section>
                </div>

                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                    <Link href="/legal/terms" style={{ color: '#A855F7', textDecoration: 'none', marginRight: '20px', fontSize: '14px' }}>
                        Términos y Condiciones
                    </Link>
                    <Link href="/" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '14px' }}>
                        Volver a LYVO
                    </Link>
                </div>
            </div>
        </div>
    );
}
