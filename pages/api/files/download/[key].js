import fs from 'fs';
import path from 'path';
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
      return res.status(404).json({ error: 'File not found or invalid share link' });
    }

    if (!file.isPublic) {
      return res.status(403).json({ error: 'This file is set to private by the owner' });
    }

    // Expiration check
    if (file.expiresAt && new Date(file.expiresAt) < new Date()) {
      return res.status(410).json({ error: 'This file share link has expired' });
    }

    // Limit check
    if (file.maxDownloads && file.downloads >= file.maxDownloads) {
      return res.status(410).json({ error: 'Download limit reached for this file' });
    }

    const filePath = path.join(process.cwd(), 'public', 'uploads', file.storedName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Physical file not found on server' });
    }

    // Increment download count asynchronously
    await prisma.sharedFile.update({
      where: { id: file.id },
      data: { downloads: { increment: 1 } },
    });

    const stat = fs.statSync(filePath);
    const safeFilename = file.originalName.replace(/"/g, '_');
    const encodedFilename = encodeURIComponent(file.originalName);

    res.writeHead(200, {
      'Content-Type': file.mimeType || 'application/octet-stream',
      'Content-Length': stat.size,
      'Content-Disposition': `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  } catch (error) {
    console.error('File Download Stream Error:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Failed to download file' });
    }
  }
}
