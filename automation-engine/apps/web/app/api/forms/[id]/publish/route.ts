import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const { workflowId } = await req.json();

    if (!workflowId) {
      return NextResponse.json({ error: 'Missing workflowId.' }, { status: 400 });
    }

    const form = await prisma.form.update({
      where: { id },
      data: {
        workflowId,
      },
    });

    return NextResponse.json(form);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
