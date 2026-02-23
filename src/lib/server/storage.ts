import { env } from './env';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export async function uploadFile(file: File): Promise<string> {
  if (env.STORAGE_PROVIDER === 's3') {
    return uploadToS3(file);
  }
  return uploadToLocal(file);
}

export async function createPresignedUpload(params: {
  filename: string;
  contentType: string;
  sizeBytes: number;
}) {
  if (env.STORAGE_PROVIDER !== 's3') {
    return { directUpload: true, uploadUrl: '/api/upload' };
  }
  if (!env.S3_BUCKET || !(env.S3_REGION ?? process.env.AWS_REGION)) {
    throw new Error('S3 configuration is incomplete');
  }
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
  const ext = params.filename.split('.').pop() ?? 'bin';
  const key = `uploads/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const client = new S3Client({
    region: env.S3_REGION ?? process.env.AWS_REGION,
    endpoint: env.S3_ENDPOINT,
    forcePathStyle: env.S3_FORCE_PATH_STYLE
  });
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET!,
    Key: key,
    ContentType: params.contentType,
    ContentLength: params.sizeBytes
  });
  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 60 });
  const publicUrl = env.S3_ENDPOINT
    ? `${env.S3_ENDPOINT}/${env.S3_BUCKET}/${key}`
    : `https://${env.S3_BUCKET}.s3.${env.S3_REGION ?? process.env.AWS_REGION}.amazonaws.com/${key}`;

  return { directUpload: false, uploadUrl, key, publicUrl };
}

async function uploadToLocal(file: File): Promise<string> {
  const { writeFile, mkdir } = await import('fs/promises');
  const { join } = await import('path');
  const dir = join(process.cwd(), 'static', 'uploads');
  await mkdir(dir, { recursive: true });
  const ext = file.name.split('.').pop() ?? 'bin';
  const filename = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(join(dir, filename), buffer);
  return `/uploads/${filename}`;
}

async function uploadToS3(file: File): Promise<string> {
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  const client = new S3Client({
    region: env.S3_REGION ?? process.env.AWS_REGION,
    endpoint: env.S3_ENDPOINT,
    forcePathStyle: env.S3_FORCE_PATH_STYLE
  });
  const ext = file.name.split('.').pop() ?? 'bin';
  const key = `uploads/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  await client.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET!,
      Key: key,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type
    })
  );
  return env.S3_ENDPOINT
    ? `${env.S3_ENDPOINT}/${env.S3_BUCKET}/${key}`
    : `https://${env.S3_BUCKET}.s3.${env.S3_REGION ?? process.env.AWS_REGION}.amazonaws.com/${key}`;
}
