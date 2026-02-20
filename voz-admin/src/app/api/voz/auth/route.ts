import { NextRequest, NextResponse } from "next/server";
import { getAppUsers, addAppUser, AppUser } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, email, password, username } = body;

        const users = getAppUsers();

        if (action === 'register') {
            if (!email || !password || !username) {
                return NextResponse.json({ error: "Missing fields" }, { status: 400 });
            }

            if (users.some((u: any) => u.email === email || u.handle === `@${username}`)) {
                return NextResponse.json({ error: "User already exists" }, { status: 409 });
            }

            const newUser: AppUser = {
                id: uuidv4(),
                handle: `@${username}`,
                name: username,
                email,
                password,
                status: 'active',
                reputation: 10,
                walletBalance: 0,
                joinedAt: new Date().toISOString()
            };

            addAppUser(newUser);

            const { password: _, ...userWithoutPassword } = newUser;
            return NextResponse.json({ success: true, user: userWithoutPassword });

        } else if (action === 'login') {
            const user = users.find((u: any) => u.email === email && u.password === password);

            if (!user) {
                return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
            }

            const { password: _, ...userWithoutPassword } = user;
            return NextResponse.json({ success: true, user: userWithoutPassword });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error) {
        console.error("Auth error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
