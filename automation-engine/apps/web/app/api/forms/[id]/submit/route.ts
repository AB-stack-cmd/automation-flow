import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { executeWorkflow } from 'engine';
import { inngest } from '../../../inngest/client';

const prisma = new PrismaClient();

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const payload = await req.json();

    // 1. Fetch form & associated workflow definition
    const form = await prisma.form.findUnique({
      where: { id },
      include: { workflow: true },
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found.' }, { status: 404 });
    }

    // 2. Validate form submission data against field definitions
    if (form.definition) {
      try {
        const fields = JSON.parse(form.definition);
        if (Array.isArray(fields)) {
          for (const field of fields) {
            if (field.required && (payload[field.name] === undefined || payload[field.name] === '')) {
              return NextResponse.json(
                { error: `Required field "${field.label || field.name}" is missing.` },
                { status: 400 }
              );
            }
          }
        }
      } catch (e) {
        // Skip validation if definition parsing fails
      }
    }

    const timestamp = new Date().toISOString();

    // 3. Dispatch background event to Inngest queue for reliable ingest processing
    try {
      await inngest.send({
        name: 'form/submitted',
        data: {
          formId: id,
          formName: form.name,
          workflowId: form.workflowId,
          triggerNodeName: form.triggerNodeName || 'trigger',
          payload,
          timestamp,
        },
      });
    } catch (err: any) {
      console.warn('⚠️ Inngest event dispatch skipped:', err.message);
    }

    // 4. Trigger synchronous graph execution if form is linked to a workflow
    let executionResult: any = { success: true, executionId: null, status: 'completed' };
    if (form.workflowId) {
      const triggerNodeName = form.triggerNodeName || 'trigger';
      executionResult = await executeWorkflow(form.workflowId, triggerNodeName, payload);
    }

    return NextResponse.json({
      success: true,
      formId: id,
      formName: form.name,
      executionId: executionResult.executionId || null,
      status: executionResult.status || 'success',
      timestamp,
      message: 'Form submission ingested and workflow execution triggered.',
      result: executionResult,
    });
  } catch (err: any) {
    console.error('Form submission error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
