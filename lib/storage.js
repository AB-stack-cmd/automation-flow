import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import env from '../env.js';

let s3ClientInstance = null;

export function isS3Configured() {
  const hasCreds = Boolean(
    env.AWS_ACCESS_KEY_ID &&
    env.AWS_SECRET_ACCESS_KEY &&
    env.AWS_S3_BUCKET_NAME
  );
  return hasCreds && env.STORAGE_PROVIDER !== 'local';
}

export function getStorageConfig() {
  const s3Active = isS3Configured();
  return {
    provider: s3Active ? 's3' : 'local',
    isS3Configured: s3Active,
    region: env.AWS_REGION || 'us-east-1',
    bucket: env.AWS_S3_BUCKET_NAME || 'neuron-vault-shares',
    customDomain: env.AWS_S3_CUSTOM_DOMAIN || '',
  };
}

export function getS3Client() {
  if (!isS3Configured()) {
    return null;
  }
  if (!s3ClientInstance) {
    const config = {
      region: env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    };
    if (env.AWS_S3_ENDPOINT) {
      config.endpoint = env.AWS_S3_ENDPOINT;
      config.forcePathStyle = true;
    }
    s3ClientInstance = new S3Client(config);
  }
  return s3ClientInstance;
}

/**
 * Uploads file to AWS S3 (if configured) or local disk.
 */
export async function uploadFileToStorage({ buffer, storedName, mimeType, originalName }) {
  const s3Client = getS3Client();

  if (s3Client) {
    try {
      const bucket = env.AWS_S3_BUCKET_NAME || 'neuron-vault-shares';
      const s3Key = `vault/${storedName}`;

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: s3Key,
        Body: buffer,
        ContentType: mimeType || 'application/octet-stream',
        Metadata: {
          originalName: encodeURIComponent(originalName || storedName),
        },
      });

      await s3Client.send(command);

      const region = env.AWS_REGION || 'us-east-1';
      const s3Url = env.AWS_S3_CUSTOM_DOMAIN
        ? `${env.AWS_S3_CUSTOM_DOMAIN.replace(/\/$/, '')}/${s3Key}`
        : `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;

      return {
        storageProvider: 's3',
        s3Bucket: bucket,
        s3Key,
        s3Url,
        path: s3Url,
      };
    } catch (err) {
      console.warn('AWS S3 Upload failed, falling back to local storage:', err.message);
    }
  }

  // Local storage fallback
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filePath = path.join(uploadsDir, storedName);
  fs.writeFileSync(filePath, buffer);

  return {
    storageProvider: 'local',
    s3Bucket: null,
    s3Key: null,
    s3Url: null,
    path: `/uploads/${storedName}`,
  };
}

/**
 * Retrieves file stream and properties from AWS S3 or Local storage.
 */
export async function getFileFromStorage(fileRecord) {
  if (fileRecord.storageProvider === 's3' && isS3Configured()) {
    const s3Client = getS3Client();
    if (s3Client) {
      try {
        const command = new GetObjectCommand({
          Bucket: fileRecord.s3Bucket || env.AWS_S3_BUCKET_NAME,
          Key: fileRecord.s3Key,
        });
        const response = await s3Client.send(command);
        return {
          stream: response.Body,
          contentLength: response.ContentLength || fileRecord.size,
          contentType: response.ContentType || fileRecord.mimeType,
          fromS3: true,
        };
      } catch (err) {
        console.error('Error fetching from AWS S3:', err);
      }
    }
  }

  // Fallback to local file system
  const filePath = path.join(process.cwd(), 'public', 'uploads', fileRecord.storedName);
  if (!fs.existsSync(filePath)) {
    throw new Error('File not found on server storage');
  }

  const stat = fs.statSync(filePath);
  return {
    stream: fs.createReadStream(filePath),
    contentLength: stat.size,
    contentType: fileRecord.mimeType || 'application/octet-stream',
    fromS3: false,
  };
}

/**
 * Generates an AWS S3 presigned URL for direct secure download.
 */
export async function getPresignedDownloadUrl(fileRecord, expiresInSeconds = 3600) {
  if (fileRecord.storageProvider !== 's3' || !isS3Configured()) {
    return null;
  }

  const s3Client = getS3Client();
  if (!s3Client) return null;

  try {
    const safeFilename = (fileRecord.originalName || 'download').replace(/"/g, '_');
    const encodedFilename = encodeURIComponent(fileRecord.originalName || 'download');

    const command = new GetObjectCommand({
      Bucket: fileRecord.s3Bucket || env.AWS_S3_BUCKET_NAME,
      Key: fileRecord.s3Key,
      ResponseContentDisposition: `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`,
    });

    return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
  } catch (err) {
    console.error('Failed to generate AWS S3 Presigned URL:', err);
    return null;
  }
}

/**
 * Deletes file object from AWS S3 and/or local disk.
 */
export async function deleteFileFromStorage(fileRecord) {
  if (fileRecord.storageProvider === 's3' && isS3Configured()) {
    const s3Client = getS3Client();
    if (s3Client && fileRecord.s3Key) {
      try {
        const command = new DeleteObjectCommand({
          Bucket: fileRecord.s3Bucket || env.AWS_S3_BUCKET_NAME,
          Key: fileRecord.s3Key,
        });
        await s3Client.send(command);
      } catch (err) {
        console.warn('Could not delete file from AWS S3:', err.message);
      }
    }
  }

  // Remove local file if present
  const filePath = path.join(process.cwd(), 'public', 'uploads', fileRecord.storedName);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.warn('Could not remove physical local file:', err.message);
    }
  }
}
