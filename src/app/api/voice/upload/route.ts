import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("audio") as File;

        if (!file) {
            return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${uuidv4()}.m4a`; // Asumimos m4a desde Expo, ajustar si es necesario
        const uploadDir = path.join(process.cwd(), "public/uploads/voice");
        const filePath = path.join(uploadDir, filename);

        await writeFile(filePath, buffer);

        // URL pública para acceder al archivo
        const audioUrl = `/uploads/voice/${filename}`;

        return NextResponse.json({
            success: true,
            audioUrl: audioUrl,
            filename: filename
        });

    } catch (error) {
        console.error("Error uploading voice comment:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
