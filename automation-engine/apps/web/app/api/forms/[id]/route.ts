import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const form = await prisma.form.findUnique({
      where: { id },
      include: { workflow: true },
    });
    if (!form) {
      return NextResponse.json({ error: 'Form not found.' }, { status: 404 });
    }
    return NextResponse.json(form);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const { name, definition, workflowId, triggerNodeName } = await req.json();

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (definition !== undefined) {
      data.definition = typeof definition === 'string' ? definition : JSON.stringify(definition);
    }
    if (workflowId !== undefined) data.workflowId = workflowId || null;
    if (triggerNodeName !== undefined) data.triggerNodeName = triggerNodeName || null;

    const form = await prisma.form.update({
      where: { id },
      data,
    });

    return NextResponse.json(form);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    await prisma.form.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
