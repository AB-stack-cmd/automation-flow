import { handleWebhookRequest } from '../../webhook/handler';

export async function POST(req: Request, { params }: { params: Promise<{ workflowId: string }> }) {
  const resolvedParams = await params;
  return handleWebhookRequest(req, resolvedParams.workflowId);
}

export async function GET(req: Request, { params }: { params: Promise<{ workflowId: string }> }) {
  const resolvedParams = await params;
  return handleWebhookRequest(req, resolvedParams.workflowId);
}

export async function OPTIONS(req: Request, { params }: { params: Promise<{ workflowId: string }> }) {
  const resolvedParams = await params;
  return handleWebhookRequest(req, resolvedParams.workflowId);
}
