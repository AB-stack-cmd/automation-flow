import { NextResponse } from 'next/server';
import { executeWorkflow } from 'engine';
import { inngest } from '../../../inngest/client';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await req.json();
    const { triggerNodeName, payload } = body;

    if (!triggerNodeName || !payload) {
      return NextResponse.json({ error: "Missing required parameters." }, { status: 400 });
    }

    try {
      await inngest.send({
        name: 'workflow/run',
        data: {
          workflowId: id,
          triggerNodeName,
          payload,
        },
      });
    } catch (err: any) {
      console.warn("⚠️ Inngest event dispatch skipped (daemon or event key offline):", err.message);
    }

    const result = await executeWorkflow(id, triggerNodeName, payload);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
