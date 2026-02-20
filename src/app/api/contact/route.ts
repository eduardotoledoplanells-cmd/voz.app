import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const { name, email, subject, message } = await request.json();

        // Validar campos requeridos
        if (!name || !email || !subject || !message) {
            return NextResponse.json({
                error: 'Todos los campos son obligatorios'
            }, { status: 400 });
        }

        // Validar que la API key esté configurada
        if (!process.env.RESEND_API_KEY) {
            console.error('⚠️  RESEND_API_KEY no está configurada');
            console.log('=== MENSAJE DE CONTACTO (SIN ENVIAR) ===');
            console.log(`De: ${name} <${email}>`);
            console.log(`Asunto: ${subject}`);
            console.log(`Mensaje: ${message}`);
            console.log('========================================');

            return NextResponse.json({
                success: true,
                message: 'Mensaje recibido (modo desarrollo). Configura RESEND_API_KEY para enviar emails reales.'
            });
        }

        // Enviar email usando Resend
        const data = await resend.emails.send({
            from: 'RevoluxBit <onboarding@resend.dev>', // Cambiar cuando tengas dominio verificado
            to: ['revoluxbit.rob@gmail.com'],
            subject: `[Contacto Web] ${subject}`,
            replyTo: email,
            html: `
                <h2>Nuevo mensaje de contacto</h2>
                <p><strong>Nombre:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Asunto:</strong> ${subject}</p>
                <hr />
                <h3>Mensaje:</h3>
                <p>${message.replace(/\n/g, '<br>')}</p>
            `,
        });

        console.log('✅ Email enviado correctamente:', data);

        return NextResponse.json({
            success: true,
            message: 'Mensaje enviado correctamente. Te responderemos pronto.'
        });
    } catch (error: any) {
        console.error('❌ Error al enviar mensaje de contacto:', error);

        return NextResponse.json({
            error: 'Error al enviar el mensaje. Por favor, inténtalo de nuevo.',
            details: error.message
        }, { status: 500 });
    }
}
