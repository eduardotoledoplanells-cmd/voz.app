import { NextRequest, NextResponse } from "next/server";
import { getAppUsers, addAppUser, updateAppUser, AppUser } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, email, password, username } = body;

        const users = await getAppUsers();

        if (action === 'register') {
            if (!email || !password || !username) {
                return NextResponse.json({ error: "Missing fields" }, { status: 400 });
            }

            if (users.some(u => u.email === email || u.handle === `@${username}`)) {
                return NextResponse.json({ error: "User already exists" }, { status: 409 });
            }

            const newUser: AppUser = {
                id: uuidv4(),
                handle: `@${username}`,
                email,
                password, // En un sistema real, usar bcrypt aquí
                status: 'active',
                reputation: 10,
                walletBalance: 0,
                joinedAt: new Date().toISOString()
            };

            await addAppUser(newUser);

            const { password: _, ...userWithoutPassword } = newUser;
            return NextResponse.json({ success: true, user: userWithoutPassword });

        } else if (action === 'login') {
            const user = users.find(u => u.email === email && u.password === password);

            if (!user) {
                return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
            }

            const { password: _, ...userWithoutPassword } = user;
            return NextResponse.json({ success: true, user: userWithoutPassword });
        } else if (action === 'forgot_password') {
            console.log("[DEBUG] forgot_password action triggered for:", email);
            const user = users.find(u => u.email === email);
            if (!user) {
                console.log("[DEBUG] User not found in database:", email);
                return NextResponse.json({ error: "No account found with that email" }, { status: 404 });
            }

            // Generar un PIN de 8 dígitos
            const resetPin = Math.floor(10000000 + Math.random() * 90000000).toString();
            console.log("[DEBUG] Generated 8-digit PIN:", resetPin);
            
            // Guardar PIN en la base de datos para verificación posterior
            await updateAppUser(user.id, { resetPin });
            console.log("[DEBUG] PIN saved to database for user ID:", user.id);

            // Enviar email real si la API Key está configurada
            console.log("[DEBUG] Checking RESEND_API_KEY presence:", !!process.env.RESEND_API_KEY);
            if (process.env.RESEND_API_KEY) {
                try {
                    console.log("[DEBUG] Attempting to send email via Resend to:", email);
                    const { data: resendData, error: resendError } = await resend.emails.send({
                        from: 'VOZ <onboarding@resend.dev>',
                        to: email,
                        subject: 'Recuperación de contraseña - VOZ',
                        html: `
                            <div style="font-family: sans-serif; padding: 20px; color: #333;">
                                <h2 style="color: #8E2DE2;">Recuperación de contraseña</h2>
                                <p>Has solicitado restablecer tu contraseña en la aplicación VOZ.</p>
                                <p>Tu código de seguridad de 8 dígitos es:</p>
                                <div style="background: #f4f4f4; padding: 15px; font-size: 28px; font-weight: bold; text-align: center; letter-spacing: 5px; border-radius: 8px;">
                                    ${resetPin}
                                </div>
                                <p style="margin-top: 20px; font-size: 13px; color: #666;">
                                    Si no has solicitado este cambio, puedes ignorar este correo.
                                </p>
                            </div>
                        `
                    });

                    if (resendError) {
                        console.error("[DEBUG] Resend error details:", resendError);
                    } else {
                        console.log("[DEBUG] Email sent successfully via Resend. ID:", resendData?.id);
                    }
                } catch (emailError) {
                    console.error("[DEBUG] Resend caught exception:", emailError);
                }
            } else {
                console.warn("[DEBUG] RESEND_API_KEY is NOT set. Skipping email send.");
            }

            // Ya no enviamos el simuladoToken al cliente por seguridad
            return NextResponse.json({ success: true, message: "Código enviado correctamente" });

        } else if (action === 'reset_password') {
            const { newPassword, recoveryPin } = body;
            const user = users.find(u => u.email === email);

            if (!user) {
                return NextResponse.json({ error: "Usuario no encontrado" }, { status: 400 });
            }

            // Verificar el PIN
            if (!user.resetPin || user.resetPin !== recoveryPin) {
                return NextResponse.json({ error: "Código PIN incorrecto o expirado" }, { status: 400 });
            }

            // Actualizar contraseña y limpiar el PIN usado
            await updateAppUser(user.id, { 
                password: newPassword,
                resetPin: null as any // Limpiar el PIN
            });

            return NextResponse.json({ success: true, message: "Contraseña actualizada con éxito" });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error: any) {
        console.error("Auth error:", error);
        return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 });
    }
}
