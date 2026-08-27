import db from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { clerkId, email, name, imageUrl } = req.body || {};

    if (!clerkId || typeof clerkId !== 'string' || !clerkId.trim()) {
      return res.status(400).json({ error: '[Auth Error] Valid "clerkId" string is required.' });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: '[Auth Error] Valid "email" address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanClerkId = clerkId.trim();

    // Search existing user by clerkId first to prevent account takeover via email collision
    const existingClerkUser = await db.user.findUnique({
      where: { clerkId: cleanClerkId }
    });

    let user;
    if (existingClerkUser) {
      user = await db.user.update({
        where: { clerkId: cleanClerkId },
        data: {
          email: cleanEmail,
          name: name ? String(name).trim() : existingClerkUser.name,
          imageUrl: imageUrl ? String(imageUrl).trim() : existingClerkUser.imageUrl,
          updatedAt: new Date(),
        },
      });
    } else {
      // Check if email is already registered to a different clerk ID
      const existingEmailUser = await db.user.findUnique({
        where: { email: cleanEmail }
      });
      if (existingEmailUser && existingEmailUser.clerkId && existingEmailUser.clerkId !== cleanClerkId) {
        return res.status(409).json({ error: '[Security Error] Email is already linked to another Clerk account.' });
      }

      user = await db.user.upsert({
        where: { email: cleanEmail },
        update: {
          clerkId: cleanClerkId,
          name: name ? String(name).trim() : undefined,
          imageUrl: imageUrl ? String(imageUrl).trim() : undefined,
          updatedAt: new Date(),
        },
        create: {
          clerkId: cleanClerkId,
          email: cleanEmail,
          name: name ? String(name).trim() : 'Clerk User',
          imageUrl: imageUrl ? String(imageUrl).trim() : null,
        },
      });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('User Prisma Sync Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
