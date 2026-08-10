import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, category } = req.query;

    let whereClause = {};

    if (query) {
      whereClause.originalName = {
        contains: query,
      };
    }

    if (category && category !== 'all') {
      if (category === 'images') {
        whereClause.mimeType = { startsWith: 'image/' };
      } else if (category === 'documents') {
        whereClause.OR = [
          { mimeType: { contains: 'pdf' } },
          { mimeType: { contains: 'word' } },
          { mimeType: { contains: 'text' } },
        ];
      } else if (category === 'spreadsheets') {
        whereClause.OR = [
          { mimeType: { contains: 'sheet' } },
          { mimeType: { contains: 'excel' } },
          { mimeType: { contains: 'csv' } },
        ];
      } else if (category === 'archives') {
        whereClause.OR = [
          { mimeType: { contains: 'zip' } },
          { mimeType: { contains: 'tar' } },
          { mimeType: { contains: 'rar' } },
          { mimeType: { contains: 'compressed' } },
        ];
      }
    }

    const files = await prisma.sharedFile.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    // Compute stats
    const allFiles = await prisma.sharedFile.findMany();
    const stats = {
      totalFiles: allFiles.length,
      totalBytes: allFiles.reduce((acc, f) => acc + (f.size || 0), 0),
      totalDownloads: allFiles.reduce((acc, f) => acc + (f.downloads || 0), 0),
      publicCount: allFiles.filter(f => f.isPublic).length,
      privateCount: allFiles.filter(f => !f.isPublic).length,
    };

    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host || 'localhost:3000';

    const enrichedFiles = files.map(file => ({
      ...file,
      shareUrl: `${protocol}://${host}/share/${file.accessKey}`,
      downloadUrl: `${protocol}://${host}/api/files/download/${file.accessKey}`,
      isExpired: file.expiresAt ? new Date(file.expiresAt) < new Date() : false,
      isLimitReached: file.maxDownloads ? file.downloads >= file.maxDownloads : false,
    }));

    return res.status(200).json({
      success: true,
      files: enrichedFiles,
      stats,
    });
  } catch (error) {
    console.error('List Files Error:', error);
    return res.status(500).json({ error: 'Failed to retrieve files' });
  }
}
