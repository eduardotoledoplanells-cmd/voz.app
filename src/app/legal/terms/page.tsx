export default function TermsPage() {
    return (
        <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px' }}>
            <h1 style={{ marginBottom: '30px' }}>Términos y Condiciones de Venta</h1>

            <div style={{ background: 'white', padding: '40px', borderRadius: '8px', lineHeight: '1.8' }}>
                <p style={{ marginBottom: '20px' }}><strong>Última actualización:</strong> {new Date().toLocaleDateString('es-ES')}</p>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>1. Información General</h2>
                <p>
                    Los presentes Términos y Condiciones regulan la compraventa de productos a través de la plataforma web
                    operada por:
                </p>
                <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
                    <li><strong>Titular:</strong> RevoluxBit</li>
                    <li><strong>NIF:</strong> 43148082J</li>
                    <li><strong>Dirección:</strong> Calle del General Luque, 42, 07300, Inca, Palma de Mallorca</li>
                    <li><strong>Email:</strong> revoluxbit.rob@gmail.com</li>
                </ul>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>2. Objeto del Contrato</h2>
                <p>
                    El presente contrato tiene por objeto regular la relación contractual de compraventa que surge entre
                    RevoluxBit y el usuario al realizar un pedido a través de nuestra plataforma web.
                </p>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>3. Proceso de Compra</h2>
                <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>3.1. Selección de Productos</h3>
                <p>
                    El usuario puede seleccionar los productos que desee adquirir y añadirlos al carrito de compra.
                    Los productos están sujetos a disponibilidad de stock.
                </p>

                <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>3.2. Registro y Datos</h3>
                <p>
                    Para completar una compra, el usuario deberá proporcionar sus datos personales y de envío.
                    Es responsabilidad del usuario asegurar que los datos proporcionados sean correctos y completos.
                </p>

                <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>3.3. Confirmación del Pedido</h3>
                <p>
                    Una vez completado el pago, el usuario recibirá un email de confirmación con los detalles del pedido.
                    Este email constituye la aceptación del pedido por parte de RevoluxBit.
                </p>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>4. Precios y Formas de Pago</h2>
                <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>4.1. Precios</h3>
                <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
                    <li>Todos los precios están expresados en euros (€) e incluyen IVA</li>
                    <li>Los precios pueden estar sujetos a cambios sin previo aviso</li>
                    <li>El precio aplicable será el vigente en el momento de realizar el pedido</li>
                    <li>Los gastos de envío se calcularán y mostrarán antes de finalizar la compra</li>
                </ul>

                <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>4.2. Formas de Pago</h3>
                <p>Aceptamos las siguientes formas de pago:</p>
                <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
                    <li>Tarjeta de crédito/débito (Visa, Mastercard, American Express)</li>
                    <li>Procesamiento seguro a través de Stripe</li>
                </ul>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>5. Envío y Entrega</h2>
                <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>5.1. Zona de Envío</h3>
                <p>Realizamos envíos a toda España peninsular e islas.</p>

                <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>5.2. Plazos de Entrega</h3>
                <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
                    <li>El plazo estimado de entrega es de 3-7 días laborables</li>
                    <li>Los plazos pueden variar según la disponibilidad del producto y la zona de entrega</li>
                    <li>Los retrasos por causas ajenas a RevoluxBit no generarán derecho a indemnización</li>
                </ul>

                <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>5.3. Gastos de Envío</h3>
                <p>Los gastos de envío son de 4,95€ para toda España.</p>

                <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>5.4. Recepción del Pedido</h3>
                <p>
                    Es responsabilidad del usuario verificar el estado del paquete en el momento de la entrega.
                    Si el paquete presenta daños evidentes, debe rechazarlo o hacer constar la incidencia en el albarán de entrega.
                </p>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>6. Derecho de Desistimiento</h2>
                <p>
                    De conformidad con la Ley de Consumidores y Usuarios, el cliente tiene derecho a desistir del contrato
                    en un plazo de 14 días naturales desde la recepción del producto, sin necesidad de justificación.
                </p>
                <p>Para ejercer este derecho:</p>
                <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
                    <li>Contacte con nosotros en revoluxbit.rob@gmail.com</li>
                    <li>El producto debe estar en perfecto estado, sin usar y con su embalaje original</li>
                    <li>Los gastos de devolución correrán a cargo del cliente</li>
                    <li>El reembolso se realizará en un plazo máximo de 14 días desde la recepción de la devolución</li>
                </ul>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>7. Garantías</h2>
                <p>
                    Todos nuestros productos cuentan con la garantía legal de conformidad de 2 años establecida en el
                    Real Decreto Legislativo 1/2007.
                </p>
                <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
                    <li>La garantía cubre defectos de fabricación y conformidad</li>
                    <li>No cubre daños por uso indebido, accidentes o desgaste normal</li>
                    <li>Para hacer efectiva la garantía, conserve el justificante de compra</li>
                </ul>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>8. Responsabilidad</h2>
                <p>RevoluxBit no se hace responsable de:</p>
                <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
                    <li>Errores en los datos proporcionados por el usuario</li>
                    <li>Retrasos en la entrega por causas ajenas a nuestra voluntad</li>
                    <li>Uso indebido de los productos adquiridos</li>
                    <li>Daños indirectos o lucro cesante</li>
                </ul>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>9. Propiedad Intelectual</h2>
                <p>
                    Todos los contenidos de este sitio web (textos, imágenes, logos, diseños) son propiedad de RevoluxBit
                    o de terceros que han autorizado su uso. Queda prohibida su reproducción sin autorización expresa.
                </p>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>10. Protección de Datos</h2>
                <p>
                    El tratamiento de datos personales se rige por nuestra Política de Privacidad, disponible en este sitio web.
                </p>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>11. Resolución de Conflictos</h2>
                <p>
                    Para cualquier controversia derivada de estos Términos y Condiciones, las partes se someten a los
                    Juzgados y Tribunales del domicilio del consumidor.
                </p>
                <p>
                    El usuario puede acceder a la plataforma de resolución de litigios en línea de la UE en:
                    <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
                        https://ec.europa.eu/consumers/odr
                    </a>
                </p>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>12. Modificaciones</h2>
                <p>
                    RevoluxBit se reserva el derecho a modificar estos Términos y Condiciones. Los cambios serán efectivos
                    desde su publicación en el sitio web.
                </p>

                <div style={{ marginTop: '40px', padding: '20px', background: '#f5f5f5', borderRadius: '4px' }}>
                    <p style={{ margin: 0 }}>
                        <strong>Contacto:</strong> Para cualquier consulta, puede contactarnos en
                        <strong> revoluxbit.rob@gmail.com</strong>
                    </p>
                </div>
            </div>
        </div>
    );
}
