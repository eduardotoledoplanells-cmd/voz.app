import { S3Client } from '@aws-sdk/client-s3';

const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
export const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'voz-videos';

if (!accountId || !accessKeyId || !secretAccessKey) {
  console.warn(
    'WARNING: Cloudflare R2 credentials/variables are missing in env configuration.',
    { accountId: !!accountId, accessKeyId: !!accessKeyId, secretAccessKey: !!secretAccessKey }
  );
}

// Config S3Client for Cloudflare R2
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId || '',
    secretAccessKey: secretAccessKey || '',
  },
});
