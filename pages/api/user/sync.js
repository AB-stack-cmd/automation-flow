import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { clerkId, email, name, imageUrl } = req.body || {};

    if (!clerkId || !email) {
      return res.status(400).json({ error: 'Missing required user parameters (clerkId, email).' });
    }

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        clerkId,
        name: name || undefined,
        imageUrl: imageUrl || undefined,
        updatedAt: new Date(),
      },
      create: {
        clerkId,
        email,
        name: name || 'Clerk User',
        imageUrl: imageUrl || null,
      },
    });

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('User Prisma Sync Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
