import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const forms = await prisma.form.findMany({
      include: { workflow: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(forms);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, definition, workflowId, triggerNodeName } = await req.json();
    if (!name || !definition) {
      return NextResponse.json({ error: 'Missing name or definition.' }, { status: 400 });
    }

    const form = await prisma.form.create({
      data: {
        name,
        definition: typeof definition === 'string' ? definition : JSON.stringify(definition),
        workflowId: workflowId || null,
        triggerNodeName: triggerNodeName || null,
      },
    });

    return NextResponse.json(form);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
