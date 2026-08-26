import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const workflows = await prisma.workflow.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(workflows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, projectId, definition } = await req.json();
    if (!name || !projectId || !definition) {
      return NextResponse.json({ error: "Missing required parameters." }, { status: 400 });
    }
    const workflow = await prisma.workflow.create({
      data: {
        name,
        projectId,
        definition,
        isActive: true,
      },
    });
    return NextResponse.json(workflow);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
