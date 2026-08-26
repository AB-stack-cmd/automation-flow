import { PrismaClient } from '@prisma/client';
import { deleteFileFromStorage } from '../../../lib/storage.js';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'File ID is required' });
  }

  try {
    const file = await prisma.sharedFile.findUnique({
      where: { id: String(id) },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (req.method === 'GET') {
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers.host || 'localhost:3000';
      return res.status(200).json({
        success: true,
        file: {
          ...file,
          shareUrl: `${protocol}://${host}/share/${file.accessKey}`,
          downloadUrl: `${protocol}://${host}/api/files/download/${file.accessKey}`,
        },
      });
    }

    if (req.method === 'PATCH') {
      const { isPublic, expiresAt, maxDownloads, originalName } = req.body || {};

      const updateData = {};
      if (typeof isPublic === 'boolean') updateData.isPublic = isPublic;
      if (originalName && typeof originalName === 'string') updateData.originalName = originalName.trim();

      if (expiresAt !== undefined && expiresAt !== null) {
        const parsedDate = new Date(expiresAt);
        if (Number.isNaN(parsedDate.getTime())) {
          return res.status(400).json({ error: '[Validation Error] "expiresAt" must be a valid ISO date string.' });
        }
        updateData.expiresAt = parsedDate;
      } else if (expiresAt === null) {
        updateData.expiresAt = null;
      }

      if (maxDownloads !== undefined && maxDownloads !== null) {
        const parsedMax = parseInt(maxDownloads, 10);
        if (Number.isNaN(parsedMax) || parsedMax < 1) {
          return res.status(400).json({ error: '[Validation Error] "maxDownloads" must be a positive integer greater than 0.' });
        }
        updateData.maxDownloads = parsedMax;
      } else if (maxDownloads === null) {
        updateData.maxDownloads = null;
      }

      const updatedFile = await prisma.sharedFile.update({
        where: { id: String(id) },
        data: updateData,
      });

      return res.status(200).json({ success: true, file: updatedFile });
    }

    if (req.method === 'DELETE') {
      // Delete record from DB
      await prisma.sharedFile.delete({
        where: { id: String(id) },
      });

      // Remove file from AWS S3 bucket or local disk
      await deleteFileFromStorage(file);

      return res.status(200).json({ success: true, message: 'File deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('File Operations Error:', error);
    return res.status(500).json({ error: 'Server error processing file request' });
  }
}
