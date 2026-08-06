import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { r2Client, R2_BUCKET_NAME } from "@/lib/r2";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const filename = body.filename || body.fileName || "video.mp4";
    const contentType = body.contentType || body.fileType || "video/mp4";

    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `videos/${uniqueSuffix}-${sanitizedFilename}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    // Generar URL firmada con validez de 15 minutos
    const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn: 900 });

    // URL pública final con la que se accederá al vídeo
    const publicBaseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
    let publicUrl = "";
    if (publicBaseUrl) {
      const formattedBase = publicBaseUrl.endsWith("/") ? publicBaseUrl.slice(0, -1) : publicBaseUrl;
      publicUrl = `${formattedBase}/${key}`;
    } else {
      const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
      publicUrl = `https://${R2_BUCKET_NAME}.${accountId}.r2.cloudflarestorage.com/${key}`;
    }

    return NextResponse.json({ success: true, presignedUrl, publicUrl, key });
  } catch (error: any) {
    console.error("[R2 Presign API Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
