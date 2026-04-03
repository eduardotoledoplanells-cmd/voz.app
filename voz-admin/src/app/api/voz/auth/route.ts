import { NextRequest, NextResponse } from "next/server";
import { getAppUsers, addAppUser, updateAppUser, AppUser, supabaseAdmin } from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, email, password, username, language } = body;

        const users = await getAppUsers();

        if (action === 'register') {
            if (!email || !password || !username) {
                return NextResponse.json({ error: "Missing fields" }, { status: 400 });
            }

            if (users.some(u => u.email.toLowerCase() === email.toLowerCase() || u.handle === `@${username}`)) {
                return NextResponse.json({ error: "User already exists" }, { status: 409 });
            }

            // Crear usuario en Supabase Auth usando signUp para enviar email de verificación
            const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: { handle: `@${username}`, language: language || 'es' }
                }
            });

            if (authError || !authData.user) {
                console.error("Supabase Auth Create Error:", authError);
                return NextResponse.json({ error: "Error creando usuario en autenticación", details: authError?.message || "User data missing" }, { status: 500 });
            }

            const newUserId = authData.user.id;

            const newUser: AppUser = {
                id: newUserId,
                handle: `@${username}`,
                email,
                // NO guardamos 'password' nunca más
                status: 'active',
                reputation: 10,
                walletBalance: 0,
                joinedAt: new Date().toISOString()
            };

            const result = await addAppUser(newUser);

            if (!result) {
                // Rollback: El insert en app_users ha fallado, hay que borrar el auth_user fantasma
                await supabaseAdmin.auth.admin.deleteUser(newUserId);
                return NextResponse.json({ error: "Error creando el perfil de usuario en base de datos" }, { status: 500 });
            }

            return NextResponse.json({ success: true, user: newUser });

        } else if (action === 'login') {
            // Usamos Supabase nativo para verificar la contraseña
            const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
                email,
                password
            });

            if (signInError || !signInData.user) {
                return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
            }

            // Obtener el usuario de la tabla app_users usando el email validado
            const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

            if (!user) {
                // El usuario está en Auth pero no en app_users (inconsistencia)
                return NextResponse.json({ error: "User profile not found" }, { status: 404 });
            }

            return NextResponse.json({ success: true, user: user });

        } else if (action === 'verify_signup') {
            const { verificationToken } = body;
            
            if (!verificationToken || verificationToken.length < 6) {
                return NextResponse.json({ error: "El código debe tener al menos 6 dígitos" }, { status: 400 });
            }

            // Verificar el OTP de registro
            const { data: verifyData, error: verifyError } = await supabaseAdmin.auth.verifyOtp({
                email,
                token: verificationToken,
                type: 'signup'
            });

            if (verifyError || !verifyData.user) {
                return NextResponse.json({ error: "Código PIN incorrecto o expirado" }, { status: 400 });
            }

            // El usuario ya está verificado. Le devolvemos los datos de app_users
            const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
            
            if (!user) {
                return NextResponse.json({ error: "Perfil de usuario no encontrado en la base de datos" }, { status: 404 });
            }

            return NextResponse.json({ success: true, user: user });

        } else if (action === 'forgot_password') {
            const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (!user) {
                return NextResponse.json({ error: "No account found with that email" }, { status: 404 });
            }

            // Usar Supabase Auth para enviar el correo de recuperación (OTP de 6 dígitos automático)
            const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email);

            if (resetError) {
                console.error("Supabase Reset Error:", resetError);
                return NextResponse.json({ error: "Error al enviar el correo", details: resetError.message }, { status: 500 });
            }

            return NextResponse.json({ success: true, message: "Código enviado correctamente por Supabase" });

        } else if (action === 'reset_password') {
            const { newPassword, recoveryPin } = body;
            
            if (!recoveryPin || recoveryPin.length < 6 || recoveryPin.length > 8) {
                return NextResponse.json({ error: "El PIN debe tener entre 6 y 8 dígitos" }, { status: 400 });
            }

            // Verificar el OTP (PIN de 6 dígitos) de recuperación
            const { data: verifyData, error: verifyError } = await supabaseAdmin.auth.verifyOtp({
                email,
                token: recoveryPin,
                type: 'recovery'
            });

            if (verifyError || !verifyData.session) {
                return NextResponse.json({ error: "Código PIN incorrecto o expirado" }, { status: 400 });
            }

            // Como la verificación devuelve una sesión, podemos actualizar la contraseña de ese usuario localmente (admin)
            // O directamente con supabaseAdmin.auth.admin.updateUserById()
            if (!verifyData.user?.id) {
                return NextResponse.json({ error: "No se pudo identificar al usuario para cambiar la contraseña" }, { status: 500 });
            }

            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                verifyData.user.id,
                { password: newPassword }
            );

            if (updateError) {
                console.error("Supabase Password Update Error:", updateError);
                return NextResponse.json({ error: "Error al actualizar contraseña", details: updateError.message }, { status: 500 });
            }

            return NextResponse.json({ success: true, message: "Contraseña actualizada con éxito por Supabase" });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error: any) {
        console.error("Auth error:", error);
        return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 });
    }
}
