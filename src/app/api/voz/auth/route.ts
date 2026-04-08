import { NextRequest, NextResponse } from "next/server";
import { getAppUsers, addAppUser, updateAppUser, AppUser, supabase } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, email, password, username, language } = body;
        const userLanguage = language || 'es';

        if (action === 'register') {
            if (!email || !password || !username) {
                return NextResponse.json({ error: "Missing fields" }, { status: 400 });
            }

            // 1. Registro en Supabase Auth (esto dispara el email de validación)
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `https://voz-admin-murex.vercel.app?lang=${userLanguage}`,
                    data: {
                        username: username,
                        language: userLanguage,
                    }
                }
            });

            if (authError) {
                console.error("Supabase Auth Error:", authError);
                if (authError.status === 409 || authError.message.includes("already registered")) {
                    return NextResponse.json({ error: "El usuario o email ya existe" }, { status: 409 });
                }
                return NextResponse.json({ error: authError.message }, { status: 400 });
            }

            // 2. Crear el registro en la tabla pública app_users (para el perfil y wallet)
            // Nota: El ID de app_users coincidirá con el ID de Supabase Auth
            const newUser: AppUser = {
                id: authData.user?.id || uuidv4(),
                handle: `@${username}`,
                name: username, // Inicializamos el nombre real con el nombre de usuario
                email,
                password: '', // No guardamos la password en la tabla pública por seguridad
                status: 'active',
                reputation: 10,
                walletBalance: 0,
                joinedAt: new Date().toISOString()
            };

            await addAppUser(newUser);

            return NextResponse.json({ 
                success: true, 
                message: "Registro iniciado. Por favor, verifica tu correo electrónico.",
                user: { id: newUser.id, handle: newUser.handle, email: newUser.email } 
            });

        } else if (action === 'verify_signup') {
            const { verificationToken } = body;
            const { data, error } = await supabase.auth.verifyOtp({
                email,
                token: verificationToken,
                type: 'signup'
            });

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 400 });
            }

            return NextResponse.json({ success: true });

        } else if (action === 'login') {
            // 1. Login en Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (authError) {
                console.error("Login Error:", authError);
                return NextResponse.json({ error: "Credenciales inválidas o email no verificado" }, { status: 401 });
            }

            // 2. Obtener datos del perfil de app_users
            const users = await getAppUsers();
            const userProfile = users.find(u => u.id === authData.user?.id || u.email === email);

            if (!userProfile) {
                return NextResponse.json({ error: "Perfil de usuario no encontrado" }, { status: 404 });
            }

            return NextResponse.json({ success: true, user: userProfile });

        } else if (action === 'forgot_password') {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
            
            if (resetError) {
                return NextResponse.json({ error: resetError.message }, { status: 400 });
            }

            return NextResponse.json({ success: true, message: "Instrucciones de recuperación enviadas a tu email" });

        } else if (action === 'reset_password') {
            const { newPassword } = body;
            
            // Esto requiere que el usuario esté en una sesión de recuperación o tenga un token
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (updateError) {
                return NextResponse.json({ error: updateError.message }, { status: 400 });
            }

            return NextResponse.json({ success: true, message: "Contraseña actualizada con éxito" });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error) {
        console.error("Auth error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
