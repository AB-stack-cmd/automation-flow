import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const execution = await prisma.execution.findUnique({
      where: { id },
      include: { executionData: true, workflow: true },
    });

    if (!execution) {
      return NextResponse.json({ error: 'Execution not found.' }, { status: 404 });
    }

    let steps = {};
    let logs: any[] = [];
    if (execution.executionData) {
      try {
        if (execution.executionData.steps) steps = JSON.parse(execution.executionData.steps);
        if (execution.executionData.logs) logs = JSON.parse(execution.executionData.logs);
      } catch (e) {
        // Fallback if parsing fails
      }
    }

    let triggerData = null;
    if (execution.triggerData) {
      try {
        triggerData = JSON.parse(execution.triggerData);
      } catch (e) {
        triggerData = execution.triggerData;
      }
    }

    return NextResponse.json({
      executionId: execution.id,
      workflowId: execution.workflowId,
      workflowName: execution.workflow?.name || 'Workflow Execution',
      status: execution.status,
      startedAt: execution.startedAt,
      finishedAt: execution.finishedAt,
      triggerData,
      steps,
      logs,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
