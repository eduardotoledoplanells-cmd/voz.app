import { NextRequest, NextResponse } from "next/server";
import { getUserById, getUserByEmail, addAppUser, updateAppUser, AppUser, supabase, supabaseAdmin, isBlacklisted } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import spainLocations from "@/lib/spainLocations.json";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, email, password, username, language, phone } = body;
        const countryId = body.countryId || body.country_id;
        const regionId = body.regionId || body.region_id;
        const municipalityId = body.municipalityId || body.municipality_id;
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

            // Resolve geographic text values
            const countryInput = body.country || body.nationality || '';
            const regionInput = body.region || body.pueblo || body.ciudad || '';
            let countryText = typeof countryInput === 'object' ? (countryInput.name || 'España') : (countryInput || '');
            let regionText = typeof regionInput === 'string' ? regionInput : '';

            if (countryId && parseInt(countryId.toString()) === 1) {
                countryText = 'España';
            }
            if (regionId) {
                const foundCcaa = spainLocations.find(ccaa => ccaa.id === parseInt(regionId.toString()));
                if (foundCcaa) {
                    regionText = foundCcaa.name;
                    if (municipalityId) {
                        const muniIndex = parseInt(municipalityId.toString()) % 10000;
                        const sortedMuni = [...foundCcaa.municipalities].sort((a, b) => a.localeCompare(b));
                        const foundMuniName = sortedMuni[muniIndex];
                        if (foundMuniName) {
                            regionText = `${foundCcaa.name} - ${foundMuniName}`;
                        }
                    }
                }
            }

            if (!countryText) countryText = 'España';

            // 2. Crear el registro en la tabla pública app_users (para el perfil y wallet)
            // Nota: El ID de app_users coincidirá con el ID de Supabase Auth
            const defaultPrivacySettings = { receive_pms: true, charge_pms: false, receive_gifts: true, receive_donations: true };

            const newUser: AppUser = {
                id: authData.user?.id || uuidv4(),
                handle: `@${username}`,
                name: username,
                email,
                password: '',
                status: 'unverified', // Nace bloqueado hasta poner el PIN
                walletBalance: 0,
                joinedAt: new Date().toISOString(),
                phone: phone || '',
                country: countryText || undefined,
                region: regionText || undefined,
                interests: [],
                privacySettings: defaultPrivacySettings
            };

            const dbResult = await addAppUser(newUser);
            if (!dbResult) {
                const { error: dbError } = await supabaseAdmin.from('app_users').insert([{
                    id: newUser.id,
                    name: newUser.name || newUser.handle.replace('@', ''),
                    handle: newUser.handle,
                    email: newUser.email,
                    password: newUser.password,
                    status: newUser.status,
                    wallet_balance: newUser.walletBalance || 0,
                    country: newUser.country,
                    region: newUser.region,
                    interests: newUser.interests || [],
                    country_id: newUser.country_id,
                    region_id: newUser.region_id,
                    municipality_id: newUser.municipality_id,
                    privacy_settings: defaultPrivacySettings
                }]);
                if (dbError) {
                    console.error("Error inserting app_user:", dbError);
                    return NextResponse.json({ error: `Database profile creation failed: ${dbError.message}` }, { status: 500 });
                }
            }

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

            // Buscar el perfil en app_users
            let targetUser = await getUserByEmail(email);

            if (targetUser) {
                // El perfil existe -> activarlo
                await updateAppUser(targetUser.id, { status: 'active' });
            } else {
                // El perfil NO existe (addAppUser falló durante el registro)
                // Lo creamos ahora usando los datos del usuario de Auth verificado
                const authUser = data.user;
                if (authUser) {
                    const username = authUser.user_metadata?.username || email.split('@')[0];
                    const newUser: AppUser = {
                        id: authUser.id,
                        handle: `@${username}`,
                        name: username,
                        email: authUser.email || email,
                        password: '',
                        status: 'active',
                        walletBalance: 0,
                        joinedAt: new Date().toISOString(),
                        phone: '',
                        interests: []
                    };
                    const dbResult = await addAppUser(newUser);
                    if (!dbResult) {
                        const { error: dbError } = await supabaseAdmin.from('app_users').insert([{
                            id: newUser.id,
                            name: newUser.name || newUser.handle.replace('@', ''),
                            handle: newUser.handle,
                            email: newUser.email,
                            password: newUser.password,
                            status: newUser.status,
                            wallet_balance: newUser.walletBalance || 0,
                            country: newUser.country,
                            region: newUser.region,
                            interests: newUser.interests || []
                        }]);
                        if (dbError) {
                            console.error('[verify_signup] Error creating missing profile:', dbError);
                            return NextResponse.json({ error: `Database profile creation failed on verification: ${dbError.message}` }, { status: 500 });
                        }
                    }
                }
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

            return NextResponse.json({ success: true, user: userProfile, token: authData.session?.access_token });

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
