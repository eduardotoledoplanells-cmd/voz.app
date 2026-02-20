export default function PrivacyPolicyPage() {
    return (
        <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px' }}>
            <h1 style={{ marginBottom: '30px' }}>Política de Privacidad</h1>

            <div style={{ background: 'white', padding: '40px', borderRadius: '8px', lineHeight: '1.8' }}>
                <p style={{ marginBottom: '20px' }}><strong>Última actualización:</strong> {new Date().toLocaleDateString('es-ES')}</p>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>1. Responsable del Tratamiento</h2>
                <p>
                    De conformidad con el Reglamento General de Protección de Datos (RGPD) y la Ley Orgánica de Protección de Datos (LOPD),
                    le informamos que los datos personales que nos proporcione serán tratados por:
                </p>
                <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
                    <li><strong>Titular:</strong> RevoluxBit</li>
                    <li><strong>NIF:</strong> 43148082J</li>
                    <li><strong>Dirección:</strong> Calle del General Luque, 42, 07300, Inca, Palma de Mallorca</li>
                    <li><strong>Email:</strong> revoluxbit.rob@gmail.com</li>
                    <li><strong>Responsable de Protección de Datos:</strong> Eduardo Toledo Planells</li>
                </ul>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>2. Finalidad del Tratamiento</h2>
                <p>Los datos personales que recabamos serán utilizados para las siguientes finalidades:</p>
                <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
                    <li>Gestión de pedidos y ventas</li>
                    <li>Procesamiento de pagos</li>
                    <li>Envío de productos adquiridos</li>
                    <li>Atención al cliente y soporte</li>
                    <li>Gestión de devoluciones y garantías</li>
                    <li>Envío de comunicaciones comerciales (solo con su consentimiento)</li>
                    <li>Cumplimiento de obligaciones legales</li>
                </ul>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>3. Legitimación</h2>
                <p>La base legal para el tratamiento de sus datos es:</p>
                <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
                    <li><strong>Ejecución de un contrato:</strong> Para procesar sus pedidos y entregas</li>
                    <li><strong>Consentimiento:</strong> Para envío de comunicaciones comerciales</li>
                    <li><strong>Obligación legal:</strong> Para cumplir con normativas fiscales y contables</li>
                    <li><strong>Interés legítimo:</strong> Para mejorar nuestros servicios</li>
                </ul>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>4. Datos Recabados</h2>
                <p>Recogemos los siguientes tipos de datos personales:</p>
                <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
                    <li>Datos de identificación (nombre, apellidos, DNI/NIF)</li>
                    <li>Datos de contacto (email, teléfono, dirección postal)</li>
                    <li>Datos de facturación y envío</li>
                    <li>Datos de navegación (cookies, IP, dispositivo)</li>
                    <li>Historial de compras y preferencias</li>
                </ul>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>5. Destinatarios de los Datos</h2>
                <p>Sus datos podrán ser comunicados a:</p>
                <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
                    <li><strong>Stripe:</strong> Procesador de pagos (transferencia internacional a EE.UU. con cláusulas contractuales tipo)</li>
                    <li><strong>Empresas de mensajería:</strong> Para la entrega de productos</li>
                    <li><strong>Administraciones públicas:</strong> Cuando sea legalmente obligatorio</li>
                    <li><strong>Proveedores de servicios:</strong> Hosting, email, etc. (con acuerdos de confidencialidad)</li>
                </ul>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>6. Conservación de Datos</h2>
                <p>
                    Sus datos se conservarán durante el tiempo necesario para cumplir con la finalidad para la que se recabaron:
                </p>
                <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
                    <li><strong>Datos de clientes:</strong> Durante la relación comercial y 6 años adicionales (obligaciones fiscales)</li>
                    <li><strong>Datos de marketing:</strong> Hasta que retire su consentimiento</li>
                    <li><strong>Datos de navegación:</strong> Máximo 2 años</li>
                </ul>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>7. Derechos del Usuario</h2>
                <p>Usted tiene derecho a:</p>
                <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
                    <li><strong>Acceso:</strong> Conocer qué datos tenemos sobre usted</li>
                    <li><strong>Rectificación:</strong> Corregir datos inexactos o incompletos</li>
                    <li><strong>Supresión:</strong> Solicitar la eliminación de sus datos</li>
                    <li><strong>Oposición:</strong> Oponerse al tratamiento de sus datos</li>
                    <li><strong>Limitación:</strong> Solicitar la limitación del tratamiento</li>
                    <li><strong>Portabilidad:</strong> Recibir sus datos en formato estructurado</li>
                    <li><strong>Retirar consentimiento:</strong> En cualquier momento</li>
                </ul>
                <p>
                    Para ejercer estos derechos, puede contactarnos en <strong>revoluxbit.rob@gmail.com</strong> adjuntando
                    copia de su DNI o documento identificativo equivalente.
                </p>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>8. Reclamaciones</h2>
                <p>
                    Si considera que el tratamiento de sus datos no es adecuado, puede presentar una reclamación ante la
                    Agencia Española de Protección de Datos (AEPD) en <strong>www.aepd.es</strong>
                </p>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>9. Medidas de Seguridad</h2>
                <p>
                    Hemos implementado medidas técnicas y organizativas apropiadas para proteger sus datos personales contra
                    acceso no autorizado, pérdida, destrucción o alteración, incluyendo:
                </p>
                <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
                    <li>Cifrado SSL/TLS en todas las comunicaciones</li>
                    <li>Sistemas de autenticación seguros</li>
                    <li>Copias de seguridad regulares</li>
                    <li>Control de acceso a datos personales</li>
                </ul>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>10. Menores de Edad</h2>
                <p>
                    Nuestros servicios están dirigidos a mayores de 18 años. No recabamos intencionadamente datos de menores.
                    Si detectamos que hemos recogido datos de un menor, procederemos a su eliminación inmediata.
                </p>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>11. Modificaciones</h2>
                <p>
                    Nos reservamos el derecho a modificar esta Política de Privacidad. Cualquier cambio será publicado en esta
                    página con la fecha de actualización correspondiente.
                </p>

                <div style={{ marginTop: '40px', padding: '20px', background: '#f5f5f5', borderRadius: '4px' }}>
                    <p style={{ margin: 0 }}>
                        <strong>Contacto:</strong> Para cualquier consulta sobre esta política, puede contactarnos en
                        <strong> revoluxbit.rob@gmail.com</strong>
                    </p>
                </div>
            </div>
        </div>
    );
}
