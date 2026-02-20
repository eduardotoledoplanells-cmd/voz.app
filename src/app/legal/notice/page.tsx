export default function LegalNoticePage() {
    return (
        <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px' }}>
            <h1 style={{ marginBottom: '30px' }}>Aviso Legal</h1>

            <div style={{ background: 'white', padding: '40px', borderRadius: '8px', lineHeight: '1.8' }}>
                <p style={{ marginBottom: '20px' }}><strong>Última actualización:</strong> {new Date().toLocaleDateString('es-ES')}</p>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>1. Datos Identificativos</h2>
                <p>
                    En cumplimiento de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de
                    Comercio Electrónico (LSSI-CE), se informa de los siguientes datos:
                </p>
                <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
                    <li><strong>Titular:</strong> RevoluxBit</li>
                    <li><strong>NIF:</strong> 43148082J</li>
                    <li><strong>Domicilio:</strong> Calle del General Luque, 42, 07300, Inca, Palma de Mallorca</li>
                    <li><strong>Email:</strong> revoluxbit.rob@gmail.com</li>
                    <li><strong>Actividad:</strong> Comercio electrónico de productos tecnológicos y videojuegos</li>
                </ul>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>2. Objeto</h2>
                <p>
                    El presente Aviso Legal regula el uso del sitio web de RevoluxBit (en adelante, "el sitio web").
                    El acceso y uso del sitio web implica la aceptación plena y sin reservas de todas las disposiciones
                    incluidas en este Aviso Legal.
                </p>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>3. Condiciones de Uso</h2>
                <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>3.1. Uso Permitido</h3>
                <p>El usuario se compromete a utilizar el sitio web de conformidad con la ley y el presente Aviso Legal, y a:</p>
                <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
                    <li>No realizar actividades ilícitas o contrarias a la buena fe</li>
                    <li>No difundir contenidos o propaganda de carácter racista, xenófobo, pornográfico, de apología del terrorismo o que atenten contra los derechos humanos</li>
                    <li>No provocar daños en los sistemas físicos y lógicos del sitio web</li>
                    <li>No introducir o difundir virus informáticos o cualquier otro sistema que pueda causar daños</li>
                    <li>No intentar acceder a áreas restringidas del sitio web</li>
                </ul>

                <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>3.2. Uso Prohibido</h3>
                <p>Queda expresamente prohibido:</p>
                <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
                    <li>La reproducción, distribución o modificación de los contenidos sin autorización</li>
                    <li>El uso comercial no autorizado de la información del sitio web</li>
                    <li>La extracción y reutilización de contenidos</li>
                    <li>Cualquier acción que suponga una carga excesiva para la infraestructura del sitio</li>
                </ul>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>4. Propiedad Intelectual e Industrial</h2>
                <p>
                    Todos los contenidos del sitio web, incluyendo pero no limitándose a textos, fotografías, gráficos,
                    imágenes, iconos, tecnología, software, links y demás contenidos audiovisuales o sonoros, así como su
                    diseño gráfico y códigos fuente, son propiedad intelectual de RevoluxBit o de terceros, sin que puedan
                    entenderse cedidos al usuario ninguno de los derechos de explotación reconocidos por la normativa vigente
                    en materia de propiedad intelectual sobre los mismos.
                </p>
                <p>
                    Las marcas, nombres comerciales o signos distintivos son titularidad de RevoluxBit o de terceros, sin que
                    pueda entenderse que el acceso al sitio web atribuya ningún derecho sobre las citadas marcas, nombres
                    comerciales y/o signos distintivos.
                </p>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>5. Responsabilidad</h2>
                <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>5.1. Contenidos</h3>
                <p>
                    RevoluxBit no se hace responsable de la veracidad, exactitud o actualización de los contenidos publicados
                    por terceros. El usuario es el único responsable de las manifestaciones falsas o inexactas que realice y
                    de los perjuicios que cause a RevoluxBit o a terceros.
                </p>

                <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>5.2. Disponibilidad</h3>
                <p>
                    RevoluxBit no garantiza la disponibilidad y continuidad del funcionamiento del sitio web. Cuando sea
                    razonablemente posible, advertirá previamente de las interrupciones en el funcionamiento del sitio web.
                </p>

                <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>5.3. Enlaces</h3>
                <p>
                    El sitio web puede contener enlaces a otros sitios web. RevoluxBit no se hace responsable del contenido,
                    políticas de privacidad o prácticas de sitios web de terceros.
                </p>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>6. Protección de Datos</h2>
                <p>
                    RevoluxBit se compromete a cumplir con la normativa vigente en materia de protección de datos personales.
                    Para más información, consulte nuestra Política de Privacidad.
                </p>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>7. Cookies</h2>
                <p>
                    Este sitio web utiliza cookies. Para más información sobre el uso de cookies, consulte nuestra
                    Política de Cookies.
                </p>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>8. Legislación Aplicable y Jurisdicción</h2>
                <p>
                    El presente Aviso Legal se rige por la legislación española. Para la resolución de cualquier controversia
                    derivada del acceso o uso del sitio web, RevoluxBit y el usuario se someten a los Juzgados y Tribunales
                    del domicilio del usuario.
                </p>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>9. Modificaciones</h2>
                <p>
                    RevoluxBit se reserva el derecho a modificar el presente Aviso Legal en cualquier momento. Los cambios
                    serán efectivos desde su publicación en el sitio web. Se recomienda revisar periódicamente este Aviso Legal.
                </p>

                <h2 style={{ marginTop: '30px', marginBottom: '15px' }}>10. Contacto</h2>
                <p>
                    Para cualquier consulta o sugerencia relacionada con este Aviso Legal, puede contactarnos en:
                </p>
                <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
                    <li><strong>Email:</strong> revoluxbit.rob@gmail.com</li>
                    <li><strong>Dirección:</strong> Calle del General Luque, 42, 07300, Inca, Palma de Mallorca</li>
                </ul>

                <div style={{ marginTop: '40px', padding: '20px', background: '#f5f5f5', borderRadius: '4px' }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                        Al acceder y utilizar este sitio web, usted acepta quedar vinculado por este Aviso Legal.
                        Si no está de acuerdo con estos términos, le rogamos que no utilice este sitio web.
                    </p>
                </div>
            </div>
        </div>
    );
}
