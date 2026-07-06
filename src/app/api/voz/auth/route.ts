import { NextRequest, NextResponse } from "next/server";
import { getUserById, getUserByEmail, addAppUser, updateAppUser, AppUser, supabase, supabaseAdmin, isBlacklisted } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, email, password, username, language, phone, country_id, region_id, municipality_id } = body;
        const userLanguage = language || 'es';

        if (action === 'register') {
            if (!email || !password || !username) {
                return NextResponse.json({ error: "Missing fields" }, { status: 400 });
            }

            // 0. Verificar si el email o teléfono están en la lista negra (baneado)
            const banned = await isBlacklisted(email, phone);
            if (banned) {
                return NextResponse.json({ error: "Este email o teléfono ha sido bloqueado permanentemente por infringir las normas de la comunidad" }, { status: 403 });
            }

            // 0.1 Verificar si el email o teléfono ya existen en app_users (evitar duplicados manuales de forma eficiente)
            const emailExists = await getUserByEmail(email);
            let phoneExists = null;
            if (phone) {
                const { data } = await supabaseAdmin.from('app_users').select('id').eq('phone', phone).maybeSingle();
                phoneExists = data;
            }
            
            if (emailExists) {
                return NextResponse.json({ error: "El email ya está registrado en otra cuenta" }, { status: 409 });
            }
            if (phoneExists) {
                return NextResponse.json({ error: "El teléfono ya está registrado en otra cuenta" }, { status: 409 });
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
                name: username,
                email,
                password: '',
                status: 'unverified', // Nace bloqueado hasta poner el PIN
                walletBalance: 0,
                joinedAt: new Date().toISOString(),
                phone: phone || ''
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

            // Desbloqueamos la cuenta en app_users de forma eficiente
            const targetUser = await getUserByEmail(email);
            if (targetUser) {
                await updateAppUser(targetUser.id, { status: 'active' });
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

            // 2. Obtener datos del perfil de app_users de forma eficiente
            let userProfile = null;
            if (authData.user?.id) {
                userProfile = await getUserById(authData.user.id);
            }
            if (!userProfile && email) {
                userProfile = await getUserByEmail(email);
            }
 
            if (!userProfile) {
                return NextResponse.json({ error: "Perfil de usuario no encontrado" }, { status: 404 });
            }

            if (userProfile.status === 'unverified') {
                return NextResponse.json({ error: "Tu cuenta no está verificada. Por favor introduce el código PIN de 6 dígitos que te enviamos por correo para poder entrar." }, { status: 403 });
            }

            if (userProfile.status === 'banned') {
                return NextResponse.json({ error: "Tu cuenta ha sido suspendida permanentemente" }, { status: 403 });
            }

            return NextResponse.json({ success: true, user: userProfile });

        } else if (action === 'forgot_password') {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
            
            if (resetError) {
                return NextResponse.json({ error: resetError.message }, { status: 400 });
            }

            return NextResponse.json({ success: true, message: "Instrucciones de recuperación enviadas a tu email" });

        } else if (action === 'reset_password') {
            const { email, newPassword, recoveryPin } = body;
            
            const { data, error: verifyError } = await supabase.auth.verifyOtp({
                email,
                token: recoveryPin,
                type: 'recovery'
            });

            if (verifyError || !data.user) {
                return NextResponse.json({ error: "El código PIN es incorrecto o ha expirado" }, { status: 400 });
            }

            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(data.user.id, {
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
