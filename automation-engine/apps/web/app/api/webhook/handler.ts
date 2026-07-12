import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { executeWorkflow } from 'engine';
import { validateForm } from 'sdk';

const prisma = new PrismaClient();

// Simple in-memory rate limiter to prevent spam (100 requests/min per IP)
const rateLimitCache = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitCache.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitCache.set(ip, { count: 1, resetAt: now + 60 * 1000 });
    return false;
  }

  record.count += 1;
  if (record.count > 100) {
    return true;
  }
  return false;
}

export async function handleWebhookRequest(req: Request, workflowId: string) {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      },
    });
  }

  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';

  // 1. Rate Limiting Check
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests. Rate limit exceeded (100 requests/minute).' }, { status: 429 });
  }

  try {
    // 2. Fetch Workflow
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
    });
    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found.' }, { status: 404 });
    }

    const definitionObj = JSON.parse(workflow.definition);
    const webhookNode = definitionObj.nodes?.find((n: any) => n.type === 'trigger.webhook');

    if (!webhookNode) {
      return NextResponse.json({ error: 'Webhook Trigger node not found in this workflow.' }, { status: 400 });
    }

    // 3. Authentication Verification
    const authType = webhookNode.parameters?.authentication || 'none';
    if (authType === 'basicAuth') {
      const authHeader = req.headers.get('authorization') || '';
      if (!authHeader.startsWith('Basic ')) {
        return NextResponse.json({ error: 'Unauthorized. Basic Authentication credentials required.' }, { status: 401 });
      }
    } else if (authType === 'apiKey') {
      const apiKeyHeader = req.headers.get('x-api-key') || '';
      if (!apiKeyHeader) {
        return NextResponse.json({ error: 'Unauthorized. X-API-Key header required.' }, { status: 401 });
      }
    }

    // 4. Parse incoming Request Payload (Query, Body, Files, etc.)
    const query = Object.fromEntries(new URL(req.url).searchParams.entries());
    const headers = Object.fromEntries(req.headers.entries());

    let body: Record<string, any> = {};
    let files: any[] = [];
    const contentType = req.headers.get('content-type') || '';

    if (req.method === 'POST') {
      if (contentType.includes('application/json')) {
        try {
          body = await req.json();
        } catch (e) {}
      } else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
        try {
          const formData = await req.formData();
          for (const [key, val] of Array.from(formData.entries())) {
            if (val instanceof File) {
              files.push({
                name: val.name,
                type: val.type,
                size: val.size,
                content: Buffer.from(await val.arrayBuffer()).toString('base64'),
              });
            } else {
              body[key] = val;
            }
          }
        } catch (e) {}
      } else {
        try {
          const text = await req.text();
          body = { rawText: text };
        } catch (e) {}
      }
    }

    // 5. Validation & Sanitization from Form schema if linked
    const form = await prisma.form.findUnique({
      where: { workflowId },
    });
    if (form) {
      const fields = JSON.parse(form.definition);
      const validationResult = validateForm(fields, body);
      if (!validationResult.success) {
        return NextResponse.json({
          success: false,
          error: 'Validation failed.',
          validationErrors: validationResult.errors,
        }, { status: 400 });
      }
      body = validationResult.data;
    }

    const triggerPayload = {
      body,
      headers,
      query,
      files,
      timestamp: new Date().toISOString(),
      ip,
      userAgent: req.headers.get('user-agent') || '',
    };

    // 6. Execute Workflow synchronously in engine starting from selected trigger node connection
    const targetTriggerNodeName = form?.triggerNodeName || webhookNode.name;
    const executionResult = await executeWorkflow(workflowId, targetTriggerNodeName, triggerPayload);

    // 7. Dispatch Response (custom response node or default fallback)
    if (executionResult.success && executionResult.webhookResponse) {
      const resInfo = executionResult.webhookResponse;
      const responseHeaders = new Headers();
      if (resInfo.headers) {
        for (const [k, v] of Object.entries(resInfo.headers)) {
          responseHeaders.set(k, String(v));
        }
      }

      if (resInfo.responseMode === 'redirect') {
        return NextResponse.redirect(resInfo.redirectUrl || 'http://localhost:3000', 302);
      }
      if (resInfo.responseMode === 'html') {
        responseHeaders.set('content-type', 'text/html');
        return new Response(resInfo.body, { status: resInfo.statusCode, headers: responseHeaders });
      }
      if (resInfo.responseMode === 'text') {
        responseHeaders.set('content-type', 'text/plain');
        return new Response(resInfo.body, { status: resInfo.statusCode, headers: responseHeaders });
      }

      // JSON mode
      if (!responseHeaders.has('content-type')) {
        responseHeaders.set('content-type', 'application/json');
      }
      const serializedBody = typeof resInfo.body === 'object' ? JSON.stringify(resInfo.body) : String(resInfo.body);
      return new Response(serializedBody, {
        status: resInfo.statusCode,
        headers: responseHeaders,
      });
    }

    // Default fallback
    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully.',
      executionId: executionResult.executionId,
      data: body,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
