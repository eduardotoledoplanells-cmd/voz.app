export default function ReturnsPage() {
    return (
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px', color: 'white' }}>
            <h1 style={{ marginBottom: '30px', textAlign: 'center' }}>Política de Reembolsos y Transacciones Digitales</h1>

            <div style={{ backgroundColor: '#111', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '40px', borderRadius: '16px', lineHeight: '1.8' }}>
                <p style={{ marginBottom: '20px', color: '#888' }}><strong>Última actualización:</strong> {new Date().toLocaleDateString('es-ES')}</p>

                <h2 style={{ marginTop: '30px', marginBottom: '15px', color: '#8E2DE2' }}>1. Naturaleza de los Servicios</h2>
                <p>
                    VOZ es una plataforma de contenido social en formato de audio y vídeo. Los artículos de intercambio dentro de la plataforma (Monedas de apoyo virtual y Regalos) son bienes digitales consumibles y no tienen carácter de mercancía física.
                </p>

                <h2 style={{ marginTop: '30px', marginBottom: '15px', color: '#8E2DE2' }}>2. Adquisición y Consumo de Monedas</h2>
                <p>
                    La adquisición de Monedas se realiza de forma voluntaria a través de la pasarela de pagos oficial en el portal web. Una vez adquiridas, las monedas pueden ser utilizadas para enviar detalles y regalos a los creadores de contenido. 
                </p>
                <p>
                    De acuerdo con la legislación de bienes digitales y contenido de consumo inmediato, una vez que las monedas han sido consumidas o regaladas a un creador, la transacción es final y no admite devolución ni reembolso alguno.
                </p>

                <h2 style={{ marginTop: '30px', marginBottom: '15px', color: '#8E2DE2' }}>3. Cancelaciones y Reclamaciones</h2>
                <p>
                    En caso de incidencias técnicas durante el proceso de recarga (por ejemplo, cobros duplicados o fallos en la asignación del saldo en cuenta), el usuario puede ponerse en contacto con nuestro equipo de soporte técnico escribiendo a <strong>voz@appvoz.com</strong> aportando el comprobante de pago para proceder a la regularización del saldo correspondiente de forma manual.
                </p>

                <h2 style={{ marginTop: '30px', marginBottom: '15px', color: '#8E2DE2' }}>4. Exclusiones</h2>
                <p>
                    No se realizarán reembolsos en los siguientes supuestos:
                </p>
                <ul style={{ marginLeft: '20px', marginBottom: '20px', color: '#aaa' }}>
                    <li>Monedas ya consumidas en forma de regalos a creadores.</li>
                    <li>Cuentas suspendidas o canceladas por violación de las Normas de la Comunidad de VOZ.</li>
                    <li>Reclamaciones realizadas después de 14 días naturales desde la fecha de compra de las monedas no consumidas.</li>
                </ul>

                <h2 style={{ marginTop: '30px', marginBottom: '15px', color: '#8E2DE2' }}>5. Contacto</h2>
                <p>
                    Para cualquier aclaración adicional sobre transacciones, el usuario puede dirigirse a:
                </p>
                <ul style={{ marginLeft: '20px', marginBottom: '20px', color: '#aaa' }}>
                    <li><strong>Email:</strong> voz@appvoz.com</li>
                    <li><strong>Titular de la plataforma:</strong> VOZ</li>
                </ul>
            </div>
        </div>
    );
}
