import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

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

    // Read full raw body buffer
    const chunks = [];
    for await (const chunk of req) {
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

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique names and keys
    const accessKey = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(fileData.originalName) || '';
    const storedName = `file_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;
    const filePath = path.join(uploadsDir, storedName);

    // Save to disk
    fs.writeFileSync(filePath, fileData.buffer);

    const relativePath = `/uploads/${storedName}`;

    // Create DB record
    const sharedFile = await prisma.sharedFile.create({
      data: {
        originalName: fileData.originalName,
        storedName,
        mimeType: fileData.mimeType,
        size: fileData.buffer.length,
        path: relativePath,
        accessKey,
        isPublic: true,
        downloads: 0,
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
