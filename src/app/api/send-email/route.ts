import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { to, orderNumber, trackingNumber, shippingCompany } = await request.json();

        // En un entorno de producción, aquí usarías un servicio como SendGrid, Resend, o Nodemailer
        // Por ahora, solo simularemos el envío del email

        console.log('=== EMAIL NOTIFICATION ===');
        console.log(`To: ${to}`);
        console.log(`Subject: Tu pedido ${orderNumber} ha sido enviado`);
        console.log(`Body:`);
        console.log(`
            Hola,

            ¡Buenas noticias! Tu pedido ${orderNumber} ha sido enviado.

            Detalles del envío:
            - Compañía de envío: ${shippingCompany}
            - Número de seguimiento: ${trackingNumber}

            Puedes hacer seguimiento de tu pedido usando el número de seguimiento proporcionado.

            Gracias por tu compra en RevoluxBit.

            Saludos,
            El equipo de RevoluxBit
        `);
        console.log('========================');

        // Simular éxito del envío
        return NextResponse.json({
            success: true,
            message: 'Email enviado correctamente (simulado)'
        });
    } catch (error) {
        console.error('Error sending email:', error);
        return NextResponse.json({
            error: 'Failed to send email'
        }, { status: 500 });
    }
}
