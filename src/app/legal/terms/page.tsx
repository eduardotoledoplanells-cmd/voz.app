import React from 'react';
import Link from 'next/link';

export default function TermsPage() {
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0B0B12', color: '#F1F1F5', fontFamily: 'Inter, sans-serif', padding: '40px 20px 80px' }}>
            <div style={{ maxWidth: '980px', margin: '0 auto' }}>
                {/* Header Superior */}
                <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                    <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: '20px', background: 'rgba(142, 45, 226, 0.15)', border: '1px solid rgba(142, 45, 226, 0.4)', color: '#C084FC', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>
                        Documento Legal Oficial • LYVO Media
                    </div>
                    <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 10px', background: 'linear-gradient(135deg, #FFFFFF 0%, #A855F7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Términos y Condiciones Generales de Uso, Monetización y Pasarelas de Pago
                    </h1>
                    <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>
                        Última actualización: {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })} • Legislación Española y Comunitaria Europea
                    </p>
                </div>

                {/* Contenedor Principal */}
                <div style={{ backgroundColor: '#13131F', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '36px 32px', lineHeight: '1.75', fontSize: '15px', color: 'rgba(255, 255, 255, 0.85)' }}>

                    {/* 1. INFORMACIÓN GENERAL Y TITULAR */}
                    <section style={{ marginBottom: '36px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px', marginBottom: '16px' }}>
                            1. Información General y Titularidad del Servicio
                        </h2>
                        <p style={{ marginBottom: '14px' }}>
                            En cumplimiento de lo dispuesto en el artículo 10 de la <strong>Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE)</strong>, se informa a los usuarios de los datos identificativos del prestador y titular de la plataforma digital, aplicación móvil y portal web <strong>LYVO</strong>:
                        </p>
                        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px', padding: '16px 20px', marginBottom: '16px', borderLeft: '4px solid #8E2DE2' }}>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                <li style={{ marginBottom: '6px' }}><strong>• Titular / Denominación:</strong> LYVO Media</li>
                                <li style={{ marginBottom: '6px' }}><strong>• N.I.F.:</strong> 43148082J</li>
                                <li style={{ marginBottom: '6px' }}><strong>• Domicilio Social:</strong> Calle del General Luque, 42, 07300 Inca, Palma de Mallorca (Illes Balears, España)</li>
                                <li style={{ marginBottom: '6px' }}><strong>• Correo Electrónico de Contacto:</strong> <a href="mailto:lyvo@lyvo.media" style={{ color: '#C084FC', textDecoration: 'none' }}>lyvo@lyvo.media</a></li>
                                <li><strong>• Sitio Web Oficial:</strong> <a href="https://lyvo.media" style={{ color: '#C084FC', textDecoration: 'none' }}>https://lyvo.media</a></li>
                            </ul>
                        </div>
                        <p>
                            El acceso, descarga, navegación y uso de los servicios de LYVO atribuye la condición de <strong>Usuario</strong>, lo que implica la adhesión plena y sin reservas a las presentes condiciones contractuales y a nuestra Política de Privacidad.
                        </p>
                    </section>

                    {/* 2. REQUISITOS DE ACCESO Y EDAD MÍNIMA */}
                    <section style={{ marginBottom: '36px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px', marginBottom: '16px' }}>
                            2. Requisitos de Registro y Edad Mínima
                        </h2>
                        <p style={{ marginBottom: '12px' }}>
                            Para utilizar los servicios de LYVO, el usuario debe tener al menos <strong>16 años de edad</strong> (edad legal mínima para el consentimiento de servicios digitales en España conforme al artículo 7 de la <strong>Ley Orgánica 3/2018 - LOPDGDD</strong> y el RGPD).
                        </p>
                        <p style={{ marginBottom: '12px' }}>
                            Para participar en los programas de <strong>Monetización y Cobro de Ganancias (Payouts)</strong>, el usuario debe ser <strong>mayor de edad (18 años)</strong> o contar con plena capacidad de obrar según la legislación aplicable en su país de residencia fiscal. LYVO y sus proveedores bancarios autorizados se reservan el derecho de exigir verificación de identidad documental (KYC) en cualquier momento.
                        </p>
                    </section>

                    {/* 3. NATURALEZA DEL SERVICIO Y RESPONSABILIDAD UGC */}
                    <section style={{ marginBottom: '36px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px', marginBottom: '16px' }}>
                            3. Naturaleza del Servicio y Contenido Generado por el Usuario (UGC)
                        </h2>
                        <p style={{ marginBottom: '12px' }}>
                            LYVO es una plataforma tecnológica y red social audiovisual que permite a los usuarios compartir vídeos cortos, grabar reacciones sincronizadas, interactuar mediante notas de voz y apoyar el trabajo de creadores de contenido.
                        </p>
                        <p style={{ marginBottom: '12px' }}>
                            De conformidad con la <strong>Digital Services Act (DSA - Reglamento UE 2022/2065)</strong> y los artículos 14 a 17 de la <strong>LSSI-CE</strong>, LYVO actúa como intermediario técnico prestador de servicios de alojamiento de datos (Hosting). Todo el contenido publicado en la plataforma es <em>Contenido Generado por el Usuario (UGC)</em>, siendo cada autor el único y exclusivo responsable legal de sus publicaciones y opiniones.
                        </p>
                        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: '10px', padding: '16px 20px', borderLeft: '4px solid #EF4444', marginTop: '14px' }}>
                            <strong style={{ color: '#F87171' }}>⚠️ Política de Tolerancia Cero:</strong>
                            <p style={{ margin: '6px 0 0', fontSize: '14px' }}>
                                Queda terminantemente prohibido el contenido que vulnere la legislación penal o civil: material de abuso o explotación sexual infantil (CSAM), apología del terrorismo, violencia explícita, ciberacoso, amenazas, estafas, discursos de odio o infracción de derechos de propiedad intelectual. Las infracciones derivarán en la expulsión fulminante de la cuenta y el reporte a los Cuerpos de Seguridad del Estado.
                            </p>
                        </div>
                    </section>

                    {/* 4. PASARELA DE PAGO SEGURA (STRIPE) Y REGULACIÓN BANCARIA */}
                    <section style={{ marginBottom: '36px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px', marginBottom: '16px' }}>
                            4. Pasarela de Pago Oficial, Infraestructura Bancaria y Seguridad (Stripe)
                        </h2>
                        <p style={{ marginBottom: '14px' }}>
                            Para garantizar la máxima seguridad, confianza y transparencia económica en todas las transacciones, LYVO no almacena ni procesa directamente datos sensibles de tarjetas de crédito o cuentas bancarias. Todas las operaciones de recarga y cobros a creadores se gestionan a través de <strong>Stripe</strong>, líder mundial en infraestructura de pagos y servicios financieros.
                        </p>

                        <div style={{ backgroundColor: 'rgba(142, 45, 226, 0.08)', borderRadius: '12px', border: '1px solid rgba(142, 45, 226, 0.25)', padding: '20px', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                                <span style={{ fontSize: '24px', marginRight: '10px' }}>🔒</span>
                                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#E9D5FF', margin: 0 }}>
                                    Entidad Regulada y Estándares Bancarios Internacionales
                                </h3>
                            </div>
                            <ul style={{ paddingLeft: '20px', margin: '10px 0 0', fontSize: '14px', color: 'rgba(255, 255, 255, 0.85)' }}>
                                <li style={{ marginBottom: '8px' }}>
                                    <strong>Regulación Bancaria Oficial:</strong> En el Espacio Económico Europeo (EEE), los servicios de pago son provistos por <em>Stripe Technology Europe, Limited</em>, entidad de dinero electrónico (EMI) autorizada y regulada por el <strong>Banco Central de Irlanda (Central Bank of Ireland - Referencia C187865)</strong> con pasaporte legal comunitario para operar en toda España y la Unión Europea.
                                </li>
                                <li style={{ marginBottom: '8px' }}>
                                    <strong>Certificación PCI-DSS Nivel 1:</strong> Stripe cuenta con el nivel más alto de certificación de seguridad en la industria de pagos y tarjetas (PCI Service Provider Level 1), auditado por auditores de seguridad independientes.
                                </li>
                                <li style={{ marginBottom: '8px' }}>
                                    <strong>Cifrado Avanzado:</strong> Todas las transacciones se realizan bajo protocolos de cifrado de grado militar <strong>TLS 1.3 / AES-256</strong>, impidiendo cualquier interceptación de datos.
                                </li>
                                <li style={{ marginBottom: '8px' }}>
                                    <strong>Autenticación Reforzada (SCA / 3D Secure 2.0):</strong> Cumplimiento estricto de la directiva europea <strong>PSD2</strong> sobre servicios de pago, verificando la identidad del titular de la tarjeta mediante autenticación biométrica o código bancario de un solo uso.
                                </li>
                                <li>
                                    <strong>Stripe Connect para Creadores:</strong> Los pagos a creadores se procesan a través de <em>Stripe Connect Custom/Express</em> con cuentas bancarias segregadas y supervisadas, garantizando que el dinero llegue directamente al titular legítimo sin intermediaciones dudosas.
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* 5. SISTEMA ECONÓMICO, MONEDAS Y DESGLOSE DE PORCENTAJES */}
                    <section style={{ marginBottom: '36px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px', marginBottom: '16px' }}>
                            5. Sistema Económico, Monedas Virtuales y Desglose Exacto de Porcentajes
                        </h2>
                        <p style={{ marginBottom: '14px' }}>
                            La plataforma integra unidades de cuenta virtuales internas denominadas <strong>Monedas LYVO</strong>. Las monedas no constituyen divisa de curso legal ni producto financiero, sino licencias digitales de uso para interacción y apoyo a creadores.
                        </p>

                        <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#C084FC', marginTop: '20px', marginBottom: '10px' }}>
                            5.1. Adquisición de Monedas (Recargas Web) y Exclusión de Desistimiento
                        </h3>
                        <p style={{ marginBottom: '12px' }}>
                            La compra de monedas se realiza a través de la pasarela oficial segura en la web (<em>https://lyvo.media</em>) impulsada por Stripe. La tasa de referencia de adquisición es de <strong>1 Moneda = 1,00 €</strong> con el <strong>IVA (21% en España) ya incluido</strong> en el precio final de venta.
                        </p>
                        <p style={{ marginBottom: '12px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.75)' }}>
                            <em>* Conforme al artículo 103, letra m) del Real Decreto Legislativo 1/2007 (Ley General para la Defensa de los Consumidores y Usuarios), al adquirir contenido y saldo digital de acreditación inmediata, el usuario consiente de forma expresa el inicio del suministro y reconoce la pérdida de su derecho legal de desistimiento una vez abonadas las monedas en su cuenta.</em>
                        </p>

                        <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#C084FC', marginTop: '24px', marginBottom: '10px' }}>
                            5.2. Desglose Exacto de Comisiones y Porcentajes por Tipo de Interacción
                        </h3>
                        <p style={{ marginBottom: '14px' }}>
                            Cuando un usuario utiliza sus monedas para apoyar o interactuar con un creador, el reparto de ingresos brutos entre el Creador y la Plataforma se distribuye de acuerdo con las siguientes reglas transparentes:
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                            {/* Card 1: Donaciones */}
                            <div style={{ backgroundColor: 'rgba(142, 45, 226, 0.1)', border: '1px solid rgba(142, 45, 226, 0.3)', borderRadius: '12px', padding: '18px' }}>
                                <div style={{ fontWeight: 700, color: '#E9D5FF', fontSize: '16px', marginBottom: '8px' }}>🎁 Donaciones Directas</div>
                                <div style={{ fontSize: '24px', fontWeight: 800, color: '#10B981', marginBottom: '4px' }}>75% <span style={{ fontSize: '14px', color: '#A7F3D0', fontWeight: 500 }}>para el Creador</span></div>
                                <div style={{ fontSize: '14px', color: '#9CA3AF', marginBottom: '10px' }}>25% de comisión de plataforma</div>
                                <p style={{ fontSize: '13px', margin: 0, color: 'rgba(255, 255, 255, 0.7)' }}>
                                    Aportaciones voluntarias de apoyo en el perfil o stream del creador.
                                </p>
                            </div>

                            {/* Card 2: Regalos en Feed */}
                            <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', padding: '18px' }}>
                                <div style={{ fontWeight: 700, color: '#BFDBFE', fontSize: '16px', marginBottom: '8px' }}>⚡ Regalos en Vídeos (Feed)</div>
                                <div style={{ fontSize: '24px', fontWeight: 800, color: '#38BDF8', marginBottom: '4px' }}>65% <span style={{ fontSize: '14px', color: '#BAE6FD', fontWeight: 500 }}>para el Creador</span></div>
                                <div style={{ fontSize: '14px', color: '#9CA3AF', marginBottom: '10px' }}>35% de comisión de plataforma</div>
                                <p style={{ fontSize: '13px', margin: 0, color: 'rgba(255, 255, 255, 0.7)' }}>
                                    Premios interactivos enviados a publicaciones y vídeos de la comunidad.
                                </p>
                            </div>

                            {/* Card 3: Mensajería con Escrow */}
                            <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px', padding: '18px' }}>
                                <div style={{ fontWeight: 700, color: '#FDE68A', fontSize: '16px', marginBottom: '8px' }}>💬 Mensajes Privados Prioritarios</div>
                                <div style={{ fontSize: '24px', fontWeight: 800, color: '#FBBF24', marginBottom: '4px' }}>60% <span style={{ fontSize: '14px', color: '#FEF08A', fontWeight: 500 }}>para el Creador</span></div>
                                <div style={{ fontSize: '14px', color: '#9CA3AF', marginBottom: '10px' }}>40% de comisión de plataforma</div>
                                <p style={{ fontSize: '13px', margin: 0, color: 'rgba(255, 255, 255, 0.7)' }}>
                                    Sistema con <strong>custodia (Escrow)</strong>: si el creador no responde en <strong>30 días</strong>, se reembolsa el 100% al remitente.
                                </p>
                            </div>
                        </div>

                        <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.75)' }}>
                            Las comisiones de la plataforma cubren los costes bancarios y comisiones de pasarela de Stripe, alojamiento de medios en servidores y clústeres CDN de alta velocidad, transcodificación de vídeo, análisis de seguridad por Inteligencia Artificial y mantenimiento técnico del servicio.
                        </p>

                        <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#C084FC', marginTop: '24px', marginBottom: '10px' }}>
                            5.3. Retiro de Ganancias (Payouts) y Obligaciones Fiscales
                        </h3>
                        <ul style={{ paddingLeft: '20px', marginBottom: '14px' }}>
                            <li style={{ marginBottom: '8px' }}>
                                <strong>Conversión:</strong> Los creadores monetizan su saldo a razón de <strong>1 Moneda Ganada = 1,00 €</strong> neto a transferir a su cuenta bancaria a través de Stripe Connect, sin comisiones ocultas añadidas en el momento del cobro.
                            </li>
                            <li style={{ marginBottom: '8px' }}>
                                <strong>Período de Retención Preventivo:</strong> Todo saldo generado permanece en retención cautelar durante <strong>7 a 14 días naturales</strong> para verificar la legitimidad de las transacciones y prevenir fraudes o retrocesos bancarios (chargebacks).
                            </li>
                            <li style={{ marginBottom: '8px' }}>
                                <strong>Fiscalidad:</strong> Cada creador es responsable exclusivo de declarar los ingresos percibidos ante la <strong>Agencia Estatal de Administración Tributaria (AEAT)</strong> u organismo tributario de su país de residencia fiscal (IRPF, IVA o régimen de autónomos aplicable).
                            </li>
                        </ul>

                        <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#C084FC', marginTop: '24px', marginBottom: '10px' }}>
                            5.4. Procedimiento de Alta en Stripe Connect para Activar Cobros y Envíos
                        </h3>
                        <p style={{ marginBottom: '12px' }}>
                            Para poder recibir ingresos, donaciones o solicitar transferencias bancarias (Payouts), el usuario creador debe vincular obligatoriamente su cuenta con la pasarela bancaria oficial. El proceso se realiza en 4 pasos guiados y seguros:
                        </p>
                        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '18px 20px', marginBottom: '16px' }}>
                            <ol style={{ paddingLeft: '20px', margin: 0, fontSize: '14px', lineHeight: '1.8' }}>
                                <li style={{ marginBottom: '8px' }}>
                                    <strong>Paso 1 - Solicitud de Creador:</strong> Desde el panel web oficial en <em>https://lyvo.media/profile/monetization</em>, pulsa en el botón <strong>"Registrarse como Creador en Stripe"</strong>.
                                </li>
                                <li style={{ marginBottom: '8px' }}>
                                    <strong>Paso 2 - Portal Bancario Seguro de Stripe:</strong> Serás redirigido al entorno cifrado de Stripe Technology Europe para completar tus datos fiscales (DNI/NIE o NIF, Nombre/Razón Social), cuenta bancaria destinataria (IBAN) y verificación de identidad oficial (KYC).
                                </li>
                                <li style={{ marginBottom: '8px' }}>
                                    <strong>Paso 3 - Validación y Aprobación:</strong> Los sistemas automatizados y compliance de Stripe validan la información bancaria en cuestión de minutos.
                                </li>
                                <li>
                                    <strong>Paso 4 - Activación del Servicio:</strong> Una vez completada el alta, tu cuenta queda vinculada y el botón de <strong>"Solicitar Retiro a Cuenta Bancaria"</strong> se activa en verde, permitiéndote operar, recibir donaciones y transferir tu saldo a tu banco con total seguridad.
                                </li>
                            </ol>
                        </div>
                    </section>

                    {/* 6. PRIVACIDAD, IA Y RETENCIÓN DE DATOS */}
                    <section style={{ marginBottom: '36px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px', marginBottom: '16px' }}>
                            6. Privacidad, Transcripciones de Audio e Inteligencia Artificial
                        </h2>
                        <p style={{ marginBottom: '12px' }}>
                            De conformidad con el <strong>Reglamento General de Protección de Datos (RGPD UE 2016/679)</strong> y la <strong>LOPDGDD 3/2018</strong>, los datos personales recabados son tratados con la exclusiva finalidad de prestar el servicio, gestionar cuentas, procesar pagos y garantizar la seguridad de la comunidad.
                        </p>
                        <p style={{ marginBottom: '12px' }}>
                            <strong>Transcripciones y Procesamiento por IA:</strong> Para mejorar la accesibilidad, permitir la búsqueda de contenido por voz y prevenir conductas ilícitas, los audios enviados son procesados mediante tecnologías de Inteligencia Artificial seguras. El usuario consiente de forma informada este tratamiento técnico.
                        </p>
                        <p style={{ marginBottom: '12px' }}>
                            <strong>Ciclo de Vida de Mensajes y Audios:</strong> Los archivos de audio de conversaciones privadas se purgan automáticamente de los servidores transcurridos <strong>30 días</strong> tras su lectura, salvo en caso de reporte de moderación abierto o requerimiento legal.
                        </p>
                        <p>
                            Los usuarios pueden ejercer sus derechos de Acceso, Rectificación, Supresión (Olvido), Limitación, Oposición y Portabilidad dirigiendo una comunicación a <a href="mailto:lyvo@lyvo.media" style={{ color: '#C084FC', textDecoration: 'none' }}>lyvo@lyvo.media</a>.
                        </p>
                    </section>

                    {/* 7. PROPIEDAD INTELECTUAL */}
                    <section style={{ marginBottom: '36px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px', marginBottom: '16px' }}>
                            7. Propiedad Intelectual y Licencia de Contenido
                        </h2>
                        <p style={{ marginBottom: '12px' }}>
                            El usuario conserva todos los derechos de propiedad intelectual sobre el contenido original que cree y publique en LYVO.
                        </p>
                        <p>
                            Al publicar contenido en las áreas públicas de la plataforma, el usuario otorga a LYVO una licencia no exclusiva, gratuita, mundial y transferible con el único fin de alojar, indexar, transcodificar, reproducir y distribuir dicho contenido dentro de la aplicación móvil y servicios web de LYVO.
                        </p>
                    </section>

                    {/* 8. LEY APLICABLE Y JURISDICCIÓN */}
                    <section style={{ marginBottom: '10px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px', marginBottom: '16px' }}>
                            8. Legislación Aplicable y Resolución de Conflictos
                        </h2>
                        <p style={{ marginBottom: '12px' }}>
                            Los presentes Términos y Condiciones se rigen por la <strong>legislación española</strong> y la normativa comunitaria de la Unión Europea.
                        </p>
                        <p style={{ marginBottom: '16px' }}>
                            Para la resolución de cualquier controversia derivada de la interpretación o ejecución de este contrato, las partes se someten a los <strong>Juzgados y Tribunales del domicilio del consumidor</strong> o, en su defecto, a los Juzgados de Inca / Palma de Mallorca (España).
                        </p>
                        <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
                            Conforme al Art. 14.1 del Reglamento (UE) 524/2013, la Comisión Europea facilita una plataforma de resolución de litigios en línea accesible en: <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" style={{ color: '#C084FC', textDecoration: 'none' }}>https://ec.europa.eu/consumers/odr/</a>.
                        </p>
                    </section>
                </div>

                {/* Footer nav */}
                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                    <Link href="/legal/privacy" style={{ color: '#A855F7', textDecoration: 'none', marginRight: '20px', fontSize: '14px' }}>
                        Política de Privacidad
                    </Link>
                    <Link href="/" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '14px' }}>
                        Volver a LYVO
                    </Link>
                </div>
            </div>
        </div>
    );
}
