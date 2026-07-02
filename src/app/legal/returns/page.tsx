export default function ReturnsPage() {
    return (
        <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px' }}>
            <h1 style={{ marginBottom: '30px' }}>Política de Devoluciones y Reembolsos</h1>

            <div style={{ background: 'white', padding: '40px', borderRadius: '8px', lineHeight: '1.8' }}>
                <p style={{ marginBottom: '20px' }}><strong>Última actualización:</strong> {new Date().toLocaleDateString('es-ES')}</p>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>1. Derecho de Desistimiento</h2>
                <p>
                    De conformidad con el Real Decreto Legislativo 1/2007, de 16 de noviembre, por el que se aprueba el texto
                    refundido de la Ley General para la Defensa de los Consumidores y Usuarios, usted tiene derecho a desistir
                    del contrato en un plazo de <strong>14 días naturales</strong> sin necesidad de justificación.
                </p>
                <p>
                    El plazo de desistimiento expirará a los 14 días naturales del día que usted o un tercero por usted
                    indicado, distinto del transportista, adquirió la posesión material de los bienes.
                </p>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>2. Cómo Ejercer el Derecho de Desistimiento</h2>
                <p>
                    Para ejercer su derecho de desistimiento, deberá notificarnos su decisión mediante una declaración
                    inequívoca. Puede hacerlo:
                </p>
                <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
                    <li>
                        <strong>Por email:</strong> Enviando un correo a <strong>voz@appvoz.com</strong> indicando:
                        <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
                            <li>Número de pedido</li>
                            <li>Fecha de compra</li>
                            <li>Productos que desea devolver</li>
                            <li>Motivo de la devolución (opcional)</li>
                        </ul>
                    </li>
                    <li style={{ marginTop: '10px' }}>
                        <strong>Por correo postal:</strong> Enviando una carta a:<br />
                        VOZ<br />
                        Calle del General Luque, 42<br />
                        07300, Inca, Palma de Mallorca
                    </li>
                </ul>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>3. Condiciones del Producto Devuelto</h2>
                <p>Para que la devolución sea aceptada, el producto debe cumplir las siguientes condiciones:</p>
                <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
                    <li>Estar en perfecto estado, sin usar y sin signos de uso</li>
                    <li>Conservar el embalaje original en perfectas condiciones</li>
                    <li>Incluir todos los accesorios, manuales y documentación original</li>
                    <li>No haber sido personalizado o modificado</li>
                    <li>Conservar los precintos originales (si aplica)</li>
                </ul>

                <div style={{ padding: '15px', background: '#fff3cd', borderLeft: '4px solid #ffc107', marginBottom: '20px' }}>
                    <p style={{ margin: 0 }}>
                        <strong>⚠️ Importante:</strong> Los productos de software, videojuegos o contenido digital que hayan
                        sido desprecintados no podrán ser devueltos, salvo que sean defectuosos.
                    </p>
                </div>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>4. Proceso de Devolución</h2>
                <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>Paso 1: Notificación</h3>
                <p>
                    Envíenos un email a <strong>voz@appvoz.com</strong> dentro del plazo de 14 días desde la
                    recepción del producto.
                </p>

                <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>Paso 2: Confirmación</h3>
                <p>
                    Le enviaremos un email de confirmación con las instrucciones para realizar la devolución y la dirección
                    de envío.
                </p>

                <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>Paso 3: Envío del Producto</h3>
                <p>
                    Deberá devolver el producto en un plazo máximo de 14 días desde que nos comunique su decisión de desistir.
                    Recomendamos utilizar un servicio de mensajería con seguimiento.
                </p>

                <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>Paso 4: Inspección</h3>
                <p>
                    Una vez recibido el producto, procederemos a su inspección para verificar que cumple las condiciones
                    de devolución.
                </p>

                <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>Paso 5: Reembolso</h3>
                <p>
                    Si la devolución es aceptada, procederemos al reembolso en un plazo máximo de 14 días desde que recibamos
                    el producto devuelto.
                </p>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>5. Gastos de Devolución</h2>
                <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
                    <li>
                        <strong>Devolución por desistimiento:</strong> Los gastos de envío de la devolución correrán a cargo
                        del cliente.
                    </li>
                    <li>
                        <strong>Producto defectuoso o error en el envío:</strong> VOZ asumirá todos los gastos de
                        devolución y envío del producto correcto o de sustitución.
                    </li>
                </ul>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>6. Reembolsos</h2>
                <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>6.1. Método de Reembolso</h3>
                <p>
                    El reembolso se realizará utilizando el mismo método de pago que utilizó para la compra original,
                    salvo que haya acordado expresamente otro método.
                </p>

                <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>6.2. Importe del Reembolso</h3>
                <p>Se reembolsará:</p>
                <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
                    <li>El precio del producto</li>
                    <li>Los gastos de envío estándar (solo si devuelve todos los productos del pedido)</li>
                </ul>
                <p>No se reembolsarán:</p>
                <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
                    <li>Los gastos de devolución</li>
                    <li>Gastos de envío express o urgente (solo se reembolsa el envío estándar)</li>
                </ul>

                <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>6.3. Plazo de Reembolso</h3>
                <p>
                    El reembolso se realizará en un plazo máximo de 14 días desde que recibamos el producto devuelto y
                    verifiquemos que cumple las condiciones. El tiempo que tarde en reflejarse en su cuenta dependerá de
                    su entidad bancaria (normalmente entre 3-5 días laborables).
                </p>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>7. Productos Defectuosos</h2>
                <p>
                    Si el producto recibido es defectuoso o no se corresponde con lo solicitado:
                </p>
                <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
                    <li>Contacte con nosotros inmediatamente en <strong>voz@appvoz.com</strong></li>
                    <li>Proporcione fotografías del defecto o error</li>
                    <li>Indique el número de pedido</li>
                </ul>
                <p>
                    En estos casos, asumiremos todos los gastos de devolución y le enviaremos un producto de sustitución o
                    procederemos al reembolso completo, según su preferencia.
                </p>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>8. Garantía Legal</h2>
                <p>
                    Todos nuestros productos cuentan con la garantía legal de 2 años establecida por la normativa europea.
                    Esta garantía cubre defectos de fabricación y conformidad.
                </p>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>9. Excepciones al Derecho de Desistimiento</h2>
                <p>
                    De acuerdo con la legislación vigente, no se admiten devoluciones en los siguientes casos:
                </p>
                <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
                    <li>Productos precintados que hayan sido desprecintados tras la entrega (software, videojuegos)</li>
                    <li>Productos personalizados o hechos a medida</li>
                    <li>Productos perecederos</li>
                    <li>Productos que por razones de higiene o salud no puedan ser devueltos</li>
                </ul>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>10. Contacto</h2>
                <p>
                    Para cualquier consulta sobre devoluciones y reembolsos, puede contactarnos en:
                </p>
                <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
                    <li><strong>Email:</strong> voz@appvoz.com</li>
                    <li><strong>Dirección:</strong> Calle del General Luque, 42, 07300, Inca, Palma de Mallorca</li>
                    <li><strong>Titular:</strong> VOZ</li>
                    <li><strong>NIF:</strong> 43148082J</li>
                </ul>

                <div style={{ marginTop: '40px', padding: '20px', background: '#e7f3ff', borderLeft: '4px solid #2196F3', borderRadius: '4px' }}>
                    <p style={{ margin: 0 }}>
                        <strong>💡 Consejo:</strong> Antes de devolver un producto, asegúrese de que cumple todas las
                        condiciones mencionadas. Esto agilizará el proceso y evitará rechazos.
                    </p>
                </div>
            </div>
        </div>
    );
}
