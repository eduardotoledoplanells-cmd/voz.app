import { NextRequest, NextResponse } from "next/server";
import { getAppUsers, addAppUser, updateAppUser, AppUser } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

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
            const user = users.find(u => u.email === email);
            if (!user) {
                return NextResponse.json({ error: "No account found with that email" }, { status: 404 });
            }

            const resetPin = Math.floor(1000 + Math.random() * 9000).toString();
            console.log(`[PASSWORD RESET PIN] Sent to ${email}: ${resetPin}`);

            return NextResponse.json({ success: true, message: "Recuperación iniciada", simuladoToken: resetPin });

        } else if (action === 'reset_password') {
            const { newPassword } = body;
            const user = users.find(u => u.email === email);

            if (!user) {
                return NextResponse.json({ error: "Invalid user" }, { status: 400 });
            }

            await updateAppUser(user.id, { password: newPassword });

            return NextResponse.json({ success: true, message: "Contraseña actualizada con éxito" });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error: any) {
        console.error("Auth error:", error);
        return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 });
    }
}
