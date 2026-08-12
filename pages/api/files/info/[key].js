import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { key } = req.query;

  if (!key) {
    return res.status(400).json({ error: 'Access key is required' });
  }

  try {
    const file = await prisma.sharedFile.findUnique({
      where: { accessKey: String(key) },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found or link expired' });
    }

    const isExpired = file.expiresAt ? new Date(file.expiresAt) < new Date() : false;
    const isLimitReached = file.maxDownloads ? file.downloads >= file.maxDownloads : false;

    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host || 'localhost:3000';

    return res.status(200).json({
      success: true,
      file: {
        id: file.id,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        createdAt: file.createdAt,
        downloads: file.downloads,
        maxDownloads: file.maxDownloads,
        isPublic: file.isPublic,
        isExpired,
        storageProvider: file.storageProvider,
        s3Bucket: file.s3Bucket,
        downloadUrl: `${protocol}://${host}/api/files/download/${file.accessKey}`,
        presignedUrl: `${protocol}://${host}/api/files/download/${file.accessKey}?presigned=true`,
      },
    });
  } catch (error) {
    console.error('File Info Fetch Error:', error);
    return res.status(500).json({ error: 'Failed to retrieve file info' });
  }
}
