import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const log = await prisma.execution.findUnique({
      where: { id },
      include: { executionData: true },
    });
    if (!log) {
      return NextResponse.json({ error: "Execution log not found." }, { status: 404 });
    }
    return NextResponse.json(log);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
