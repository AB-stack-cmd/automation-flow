import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { uploadFileToStorage } from '../../../lib/storage.js';

const prisma = new PrismaClient();

export const config = {
  api: {
    bodyParser: false, // Disables default Next.js body parser to process file streams
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      return res.status(400).json({ error: 'Content-Type must be multipart/form-data' });
    }

    const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
    if (!boundaryMatch) {
      return res.status(400).json({ error: 'Missing boundary in multipart request' });
    }
    const boundary = boundaryMatch[1] || boundaryMatch[2];

    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    if (contentLength > MAX_FILE_SIZE) {
      return res.status(413).json({ error: 'File size exceeds maximum allowed limit of 50MB' });
    }

    // Read raw body buffer with accumulation limit safeguard
    const chunks = [];
    let totalSize = 0;
    for await (const chunk of req) {
      totalSize += chunk.length;
      if (totalSize > MAX_FILE_SIZE) {
        return res.status(413).json({ error: 'File size exceeds maximum allowed limit of 50MB' });
      }
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Parse boundary delimiter
    const boundaryBuffer = Buffer.from(`--${boundary}`);
    const boundaryIndex = buffer.indexOf(boundaryBuffer);
    if (boundaryIndex === -1) {
      return res.status(400).json({ error: 'Invalid multipart payload' });
    }

    // Split parts
    let pos = 0;
    let fileData = null;

    while (pos < buffer.length) {
      const nextBoundary = buffer.indexOf(boundaryBuffer, pos);
      if (nextBoundary === -1) break;

      const part = buffer.slice(pos, nextBoundary);
      pos = nextBoundary + boundaryBuffer.length;

      const headerEnd = part.indexOf('\r\n\r\n');
      if (headerEnd !== -1) {
        const headerText = part.slice(0, headerEnd).toString('utf8');
        const content = part.slice(headerEnd + 4, part.length - 2); // trim trailing \r\n

        const filenameMatch = headerText.match(/filename="([^"]+)"/i);
        const mimeMatch = headerText.match(/Content-Type:\s*([^\r\n]+)/i);

        if (filenameMatch) {
          const originalName = filenameMatch[1];
          const mimeType = mimeMatch ? mimeMatch[1].trim() : 'application/octet-stream';

          fileData = {
            originalName,
            mimeType,
            buffer: content,
          };
          break; // File part found
        }
      }
    }

    if (!fileData || !fileData.buffer || fileData.buffer.length === 0) {
      return res.status(400).json({ error: 'No file uploaded or file is empty' });
    }

    // Generate unique names and keys
    const accessKey = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(fileData.originalName) || '';
    const storedName = `file_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;

    // Upload to AWS S3 (or local fallback)
    const storageResult = await uploadFileToStorage({
      buffer: fileData.buffer,
      storedName,
      mimeType: fileData.mimeType,
      originalName: fileData.originalName,
    });

    // Create DB record
    const sharedFile = await prisma.sharedFile.create({
      data: {
        originalName: fileData.originalName,
        storedName,
        mimeType: fileData.mimeType,
        size: fileData.buffer.length,
        path: storageResult.path,
        accessKey,
        isPublic: true,
        downloads: 0,
        storageProvider: storageResult.storageProvider,
        s3Bucket: storageResult.s3Bucket,
        s3Key: storageResult.s3Key,
        s3Url: storageResult.s3Url,
      },
    });

    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host || 'localhost:3000';
    const shareUrl = `${protocol}://${host}/share/${accessKey}`;

    return res.status(200).json({
      success: true,
      file: sharedFile,
      shareUrl,
    });
  } catch (error) {
    console.error('File Upload Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to process file upload' });
  }
}
