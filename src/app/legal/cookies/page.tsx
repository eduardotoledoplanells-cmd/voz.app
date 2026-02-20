export default function CookiePolicyPage() {
    return (
        <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px' }}>
            <h1 style={{ marginBottom: '30px' }}>Política de Cookies</h1>

            <div style={{ background: 'white', padding: '40px', borderRadius: '8px', lineHeight: '1.8' }}>
                <p style={{ marginBottom: '20px' }}><strong>Última actualización:</strong> {new Date().toLocaleDateString('es-ES')}</p>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>1. ¿Qué son las Cookies?</h2>
                <p>
                    Las cookies son pequeños archivos de texto que se almacenan en su dispositivo (ordenador, tablet o móvil)
                    cuando visita un sitio web. Las cookies permiten que el sitio web recuerde sus acciones y preferencias
                    durante un período de tiempo.
                </p>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>2. ¿Qué Cookies Utilizamos?</h2>

                <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>2.1. Cookies Técnicas (Necesarias)</h3>
                <p>
                    Estas cookies son esenciales para el funcionamiento del sitio web y no pueden ser desactivadas.
                    Se utilizan para:
                </p>
                <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
                    <li><strong>Autenticación:</strong> Mantener su sesión iniciada</li>
                    <li><strong>Carrito de compra:</strong> Recordar los productos que ha añadido</li>
                    <li><strong>Seguridad:</strong> Proteger contra ataques y fraudes</li>
                    <li><strong>Preferencias:</strong> Recordar sus configuraciones (idioma, etc.)</li>
                </ul>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                    <thead>
                        <tr style={{ background: '#f5f5f5' }}>
                            <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Cookie</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Finalidad</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Duración</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>auth_token</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>Mantener sesión de usuario</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>30 días</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>cart_items</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>Almacenar carrito de compra</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>7 días</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>cookie_consent</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>Guardar preferencias de cookies</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>1 año</td>
                        </tr>
                    </tbody>
                </table>

                <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>2.2. Cookies de Terceros</h3>
                <p>
                    Utilizamos servicios de terceros que pueden establecer sus propias cookies:
                </p>
                <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
                    <li>
                        <strong>Stripe:</strong> Procesamiento de pagos. Estas cookies son necesarias para procesar
                        transacciones de forma segura.
                    </li>
                </ul>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>3. ¿Cómo Gestionar las Cookies?</h2>

                <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>3.1. Panel de Configuración</h3>
                <p>
                    Puede gestionar sus preferencias de cookies a través del banner que aparece en su primera visita o
                    accediendo a la configuración de cookies en cualquier momento.
                </p>

                <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>3.2. Configuración del Navegador</h3>
                <p>
                    Puede configurar su navegador para rechazar cookies o para que le notifique cuando se envíe una cookie.
                    A continuación, le indicamos cómo hacerlo en los navegadores más comunes:
                </p>
                <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
                    <li>
                        <strong>Chrome:</strong> Configuración → Privacidad y seguridad → Cookies y otros datos de sitios
                    </li>
                    <li>
                        <strong>Firefox:</strong> Opciones → Privacidad y seguridad → Cookies y datos del sitio
                    </li>
                    <li>
                        <strong>Safari:</strong> Preferencias → Privacidad → Cookies y datos de sitios web
                    </li>
                    <li>
                        <strong>Edge:</strong> Configuración → Privacidad, búsqueda y servicios → Cookies
                    </li>
                </ul>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>4. Consecuencias de Desactivar las Cookies</h2>
                <p>
                    Si desactiva las cookies, algunas funcionalidades del sitio web pueden no funcionar correctamente:
                </p>
                <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
                    <li>No podrá mantener su sesión iniciada</li>
                    <li>El carrito de compra no funcionará correctamente</li>
                    <li>No podrá completar compras</li>
                    <li>Sus preferencias no se guardarán</li>
                </ul>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>5. Actualización de la Política de Cookies</h2>
                <p>
                    Podemos actualizar esta Política de Cookies ocasionalmente. Le recomendamos revisar esta página
                    periódicamente para estar informado sobre cómo utilizamos las cookies.
                </p>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>6. Más Información</h2>
                <p>
                    Para más información sobre cómo protegemos su privacidad, consulte nuestra Política de Privacidad.
                </p>
                <p>
                    Si tiene alguna pregunta sobre nuestra Política de Cookies, puede contactarnos en:
                </p>
                <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
                    <li><strong>Email:</strong> revoluxbit.rob@gmail.com</li>
                    <li><strong>Titular:</strong> RevoluxBit</li>
                    <li><strong>NIF:</strong> 43148082J</li>
                </ul>

                <div style={{ marginTop: '40px', padding: '20px', background: '#f5f5f5', borderRadius: '4px' }}>
                    <p style={{ margin: 0 }}>
                        <strong>Nota:</strong> Al continuar navegando por este sitio web, acepta el uso de cookies de acuerdo
                        con esta política. Puede cambiar sus preferencias en cualquier momento.
                    </p>
                </div>
            </div>
        </div>
    );
}
