import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { r2Client, R2_BUCKET_NAME } from "@/lib/r2";
import { supabaseAdmin } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const filename = body.filename || body.fileName || "video.mp4";
    const contentType = body.contentType || body.fileType || "video/mp4";

    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `videos/${uniqueSuffix}-${sanitizedFilename}`;

    // 1. Generate Supabase Storage Signed Upload URL (100% Guaranteed CORS for web browsers)
    let supabaseSignedUrl = "";
    let supabasePublicUrl = "";
    try {
      const { data: supaData, error: supaErr } = await supabaseAdmin.storage
        .from('media')
        .createSignedUploadUrl(key);
      if (supaData && !supaErr) {
        supabaseSignedUrl = supaData.signedUrl;
        const { data: pubData } = supabaseAdmin.storage.from('media').getPublicUrl(key);
        supabasePublicUrl = pubData?.publicUrl || "";
      }
    } catch (e) {
      console.warn("[Presign API] Supabase signed URL generation warning:", e);
    }

    // 2. Generate Cloudflare R2 Presigned Upload URL
    let presignedUrl = "";
    let publicUrl = "";
    try {
      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
      });
      presignedUrl = await getSignedUrl(r2Client, command, { expiresIn: 900 });

      const publicBaseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
      if (publicBaseUrl) {
        const formattedBase = publicBaseUrl.endsWith("/") ? publicBaseUrl.slice(0, -1) : publicBaseUrl;
        publicUrl = `${formattedBase}/${key}`;
      } else {
        const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
        publicUrl = `https://${R2_BUCKET_NAME}.${accountId}.r2.cloudflarestorage.com/${key}`;
      }
    } catch (e) {
      console.warn("[Presign API] R2 presigned URL generation warning:", e);
    }

    return NextResponse.json({
      success: true,
      supabaseSignedUrl,
      supabasePublicUrl,
      presignedUrl,
      publicUrl: publicUrl || supabasePublicUrl,
      key
    });
  } catch (error: any) {
    console.error("[R2 Presign API Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
