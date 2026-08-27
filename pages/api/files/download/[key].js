import db from '../../../../lib/db';
import { getFileFromStorage, getPresignedDownloadUrl } from '../../../../lib/storage.js';

export default async function handler(req, res) {
  const { key, presigned } = req.query;

  if (!key) {
    return res.status(400).json({ error: 'Access key is required' });
  }

  try {
    const file = await db.sharedFile.findUnique({
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

    // Atomic download limit check and increment (prevents TOCTOU race condition)
    if (file.maxDownloads !== null && file.maxDownloads !== undefined) {
      const updateResult = await db.sharedFile.updateMany({
        where: {
          id: file.id,
          downloads: { lt: file.maxDownloads }
        },
        data: {
          downloads: { increment: 1 }
        }
      });

      if (updateResult.count === 0) {
        return res.status(410).json({ error: 'Download limit reached for this file' });
      }
    } else {
      await db.sharedFile.update({
        where: { id: file.id },
        data: { downloads: { increment: 1 } },
      });
    }

    // Check if client requested presigned S3 URL
    if (presigned === 'true') {
      if (file.storageProvider !== 's3') {
        return res.status(400).json({ error: 'Presigned URL requested but file is not stored on AWS S3' });
      }
      const presignedUrl = await getPresignedDownloadUrl(file, 3600);
      if (!presignedUrl) {
        throw new Error('[S3 Error] Failed to generate presigned download URL for S3 stored file.');
      }
      return res.redirect(302, presignedUrl);
    }

    // Stream file contents from AWS S3 or Local Storage
    const storageItem = await getFileFromStorage(file);

    const safeFilename = file.originalName.replace(/"/g, '_');
    const encodedFilename = encodeURIComponent(file.originalName);

    res.writeHead(200, {
      'Content-Type': storageItem.contentType || file.mimeType || 'application/octet-stream',
      'Content-Length': storageItem.contentLength,
      'Content-Disposition': `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });

    if (storageItem.fromS3 && storageItem.stream?.pipe) {
      storageItem.stream.pipe(res);
    } else if (storageItem.stream && typeof storageItem.stream.pipe === 'function') {
      storageItem.stream.pipe(res);
    } else if (storageItem.stream) {
      // In case AWS S3 v3 returns a Web ReadableStream or async iterable
      for await (const chunk of storageItem.stream) {
        res.write(chunk);
      }
      res.end();
    }
  } catch (error) {
    console.error('File Download Stream Error:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: error.message || 'Failed to download file' });
    }
  }
}
