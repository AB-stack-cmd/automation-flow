import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { recipientEmail, shareUrl, fileName, message } = req.body || {};

    if (!recipientEmail || !shareUrl) {
      return res.status(400).json({ error: 'Recipient email and share URL are required' });
    }

    const emailSubject = `Shared File: ${fileName || 'File from Neuron Vault'}`;
    const emailBody = `Hello,\n\nYou have received a shared file: "${fileName || 'File'}" via NEURON_FLOW Vault.\n\nMessage: ${message || 'No additional note.'}\n\nAccess and download your file here:\n${shareUrl}\n\nThank you!`;

    const emailRecord = await prisma.simulatedEmail.create({
      data: {
        to: recipientEmail,
        subject: emailSubject,
        body: emailBody,
      },
    });

    return res.status(200).json({
      success: true,
      message: `File link sent successfully to ${recipientEmail}!`,
      email: emailRecord,
    });
  } catch (error) {
    console.error('Share Email Error:', error);
    return res.status(500).json({ error: 'Failed to send share email' });
  }
}
