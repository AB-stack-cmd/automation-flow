import express from 'express';
import { env } from '../../env.js';
import { prisma } from './db.js';
import { executeWorkflow } from './engine.js';
import { startScheduler } from './scheduler.js';
import { connectRabbitMQ, publishToQueue, getRabbitMQStatus } from './rabbitmq.js';

const app = express();
app.use(express.json());

// Enable CORS for our frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Simple health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// RabbitMQ Connection & Queue Health Status Check
app.get('/api/rabbitmq/status', (req, res) => {
  res.json(getRabbitMQStatus());
});

// --- WORKFLOW CRUD ---

// List all workflows
app.get('/api/workflows', async (req, res) => {
  try {
    const workflows = await prisma.workflow.findMany({
      orderBy: { updatedAt: 'desc' }
    });
    res.json(workflows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get workflow
app.get('/api/workflows/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const workflow = await prisma.workflow.findUnique({
      where: { id: parseInt(id, 10) }
    });
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
    res.json(workflow);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create workflow
app.post('/api/workflows', async (req, res) => {
  try {
    const { name, definition } = req.body;
    const workflow = await prisma.workflow.create({
      data: {
        name: name || 'Unnamed Workflow',
        definition: typeof definition === 'string' ? definition : JSON.stringify(definition || { nodes: [], edges: [] }),
        isActive: true
      }
    });
    res.json(workflow);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update workflow
app.put('/api/workflows/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, definition, isActive } = req.body;

    const data = {};
    if (name !== undefined) data.name = name;
    if (definition !== undefined) {
      data.definition = typeof definition === 'string' ? definition : JSON.stringify(definition);
    }
    if (isActive !== undefined) data.isActive = isActive;

    const workflow = await prisma.workflow.update({
      where: { id: parseInt(id, 10) },
      data
    });
    res.json(workflow);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete workflow
app.delete('/api/workflows/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.workflow.delete({
      where: { id: parseInt(id, 10) }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- WORKFLOW RUNNERS & EXECUTIONS ---

// Manual Execution Trigger
app.post('/api/workflows/:id/execute', async (req, res) => {
  try {
    const { id } = req.params;
    const triggerData = req.body || {};

    const workflow = await prisma.workflow.findUnique({
      where: { id: parseInt(id, 10) }
    });

    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });

    // Create execution log entry
    const execution = await prisma.executionLog.create({
      data: {
        workflowId: workflow.id,
        status: 'running',
        logs: JSON.stringify([{ time: new Date().toISOString(), message: 'Triggered manually' }]),
        triggerData: JSON.stringify(triggerData)
      }
    });

    // Start background execution
    const context = { trigger: triggerData, steps: {} };
    executeWorkflow(workflow.id, execution.id, null, context);

    // Optionally publish event payload to RabbitMQ if connected
    publishToQueue(null, { event: 'workflow_execute', workflowId: workflow.id, executionId: execution.id, triggerData });

    res.json({ success: true, executionId: execution.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- VALIDATION & SANITIZATION HELPERS ---
function sanitizeValue(val, type) {
  if (typeof val !== 'string') return val;
  let cleaned = val.trim();
  cleaned = cleaned.replace(/\s+/g, ' ');
  if (type === 'email') {
    cleaned = cleaned.toLowerCase();
  } else if (type === 'phone') {
    cleaned = cleaned.replace(/[^\d+]/g, '');
  }
  // Remove scripts & escape HTML to shield against XSS/script injection
  cleaned = cleaned
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  return cleaned;
}

function validateAndSanitizePayload(body, nodeFields) {
  const sanitized = {};
  const errors = {};
  
  if (nodeFields && Array.isArray(nodeFields)) {
    for (const field of nodeFields) {
      const name = field.name || field.id;
      if (!name) continue;
      
      let val = body[name];
      if (field.required && (val === undefined || val === null || val === '')) {
        errors[name] = `${field.label || name} is required.`;
        continue;
      }
      
      if (val === undefined || val === null || val === '') {
        sanitized[name] = field.defaultValue || '';
        continue;
      }
      
      sanitized[name] = sanitizeValue(val, field.type);
    }
    return { success: Object.keys(errors).length === 0, errors, data: sanitized };
  }
  
  // Default: sanitize everything
  for (const [key, val] of Object.entries(body)) {
    if (typeof val === 'string') {
      let type = 'text';
      if (key.toLowerCase().includes('email')) type = 'email';
      else if (key.toLowerCase().includes('phone') || key.toLowerCase().includes('mobile')) type = 'phone';
      sanitized[key] = sanitizeValue(val, type);
    } else {
      sanitized[key] = val;
    }
  }
  return { success: true, errors: {}, data: sanitized };
}

// Google Form Webhook execution endpoint
app.post('/api/webhooks/google-form/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const triggerData = req.body || {};

    const workflow = await prisma.workflow.findUnique({
      where: { id: parseInt(workflowId, 10) }
    });

    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
    if (!workflow.isActive) return res.status(400).json({ error: 'Workflow is inactive' });

    const { nodes } = JSON.parse(workflow.definition);
    const formTriggerNode = nodes.find(n => n.type === 'google_form_trigger');

    // Run custom form validations if fields are declared in the trigger
    const fields = formTriggerNode?.data?.fields || null;
    const valResult = validateAndSanitizePayload(triggerData, fields);
    if (!valResult.success) {
      return res.status(400).json({
        error: 'Validation failed.',
        validationErrors: valResult.errors
      });
    }
    const sanitizedTriggerData = valResult.data;

    const execution = await prisma.executionLog.create({
      data: {
        workflowId: workflow.id,
        status: 'running',
        logs: JSON.stringify([{ time: new Date().toISOString(), message: 'Triggered via Google Form submission hook' }]),
        triggerData: JSON.stringify(sanitizedTriggerData)
      }
    });

    const context = { trigger: sanitizedTriggerData, steps: {} };
    const startNodeId = formTriggerNode ? formTriggerNode.id : null;

    const result = await executeWorkflow(workflow.id, execution.id, startNodeId, context);

    if (result && result.webhookResponse) {
      const resInfo = result.webhookResponse;
      if (resInfo.headers) {
        for (const [k, v] of Object.entries(resInfo.headers)) {
          res.setHeader(k, String(v));
        }
      }
      if (resInfo.responseMode === 'redirect') {
        return res.redirect(resInfo.statusCode || 302, resInfo.body);
      }
      return res.status(resInfo.statusCode || 200).send(resInfo.body);
    }

    res.json({ success: true, executionId: execution.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Webhook execution endpoint
app.post('/api/webhooks/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const triggerData = req.body || {};

    const workflow = await prisma.workflow.findUnique({
      where: { id: parseInt(workflowId, 10) }
    });

    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
    if (!workflow.isActive) return res.status(400).json({ error: 'Workflow is inactive' });

    // Validate and sanitize standard webhook payload
    const { nodes } = JSON.parse(workflow.definition);
    const triggerNode = nodes.find(n => n.type === 'webhook' || n.type === 'trigger');
    const fields = triggerNode?.data?.fields || null;
    
    const valResult = validateAndSanitizePayload(triggerData, fields);
    if (!valResult.success) {
      return res.status(400).json({
        error: 'Validation failed.',
        validationErrors: valResult.errors
      });
    }
    const sanitizedTriggerData = valResult.data;

    const execution = await prisma.executionLog.create({
      data: {
        workflowId: workflow.id,
        status: 'running',
        logs: JSON.stringify([{ time: new Date().toISOString(), message: 'Triggered via incoming Webhook' }]),
        triggerData: JSON.stringify(sanitizedTriggerData)
      }
    });

    const context = { trigger: sanitizedTriggerData, steps: {} };
    const result = await executeWorkflow(workflow.id, execution.id, null, context);

    if (result && result.webhookResponse) {
      const resInfo = result.webhookResponse;
      if (resInfo.headers) {
        for (const [k, v] of Object.entries(resInfo.headers)) {
          res.setHeader(k, String(v));
        }
      }
      if (resInfo.responseMode === 'redirect') {
        return res.redirect(resInfo.statusCode || 302, resInfo.body);
      }
      return res.status(resInfo.statusCode || 200).send(resInfo.body);
    }

    res.json({ success: true, executionId: execution.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get executions list for a workflow
app.get('/api/workflows/:id/executions', async (req, res) => {
  try {
    const { id } = req.params;
    const executions = await prisma.executionLog.findMany({
      where: { workflowId: parseInt(id, 10) },
      orderBy: { startedAt: 'desc' },
      take: 50
    });
    res.json(executions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all execution logs across all workflows
app.get('/api/executions', async (req, res) => {
  try {
    const executions = await prisma.executionLog.findMany({
      include: { workflow: true },
      orderBy: { startedAt: 'desc' },
      take: 100
    });
    res.json(executions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a specific execution log
app.get('/api/executions/:executionId', async (req, res) => {
  try {
    const { executionId } = req.params;
    const execution = await prisma.executionLog.findUnique({
      where: { id: parseInt(executionId, 10) },
      include: { workflow: true }
    });
    if (!execution) return res.status(404).json({ error: 'Execution log not found' });
    res.json(execution);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete an execution log
app.delete('/api/executions/:executionId', async (req, res) => {
  try {
    const { executionId } = req.params;
    await prisma.executionLog.delete({
      where: { id: parseInt(executionId, 10) }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rerun a specific execution log
app.post('/api/executions/:executionId/rerun', async (req, res) => {
  try {
    const { executionId } = req.params;
    const oldExecution = await prisma.executionLog.findUnique({
      where: { id: parseInt(executionId, 10) }
    });
    if (!oldExecution) {
      return res.status(404).json({ error: 'Execution not found' });
    }
    const triggerData = oldExecution.triggerData ? JSON.parse(oldExecution.triggerData) : {};
    
    // Create a new execution log entry
    const execution = await prisma.executionLog.create({
      data: {
        workflowId: oldExecution.workflowId,
        status: 'running',
        logs: JSON.stringify([{ time: new Date().toISOString(), message: `Rerun of execution #${oldExecution.id}` }]),
        triggerData: oldExecution.triggerData
      }
    });
    
    // Start background execution
    const context = { trigger: triggerData, steps: {} };
    executeWorkflow(oldExecution.workflowId, execution.id, null, context);
    
    res.json({ success: true, executionId: execution.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- MOCK INTEGRATIONS ---

// List mock CRM contacts
app.get('/api/crm/contacts', async (req, res) => {
  try {
    const contacts = await prisma.cRMContact.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create CRM contact (triggers any workflows with trigger node category containing CRM)
app.post('/api/crm/contacts', async (req, res) => {
  try {
    const { name, email, status, score } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    let contact = await prisma.cRMContact.findUnique({ where: { email } });
    if (contact) {
      contact = await prisma.cRMContact.update({
        where: { email },
        data: {
          name: name || contact.name,
          status: status || contact.status,
          score: score !== undefined ? parseInt(score, 10) : contact.score
        }
      });
    } else {
      contact = await prisma.cRMContact.create({
        data: {
          name: name || 'Anonymous Lead',
          email,
          status: status || 'lead',
          score: score !== undefined ? parseInt(score, 10) : 10
        }
      });
    }

    // TRIGGER ANY ACTIVE WORKFLOW THAT HAS A TRIGGER ON CRM
    const activeWorkflows = await prisma.workflow.findMany({ where: { isActive: true } });
    let latestExecutionId = null;
    for (const workflow of activeWorkflows) {
      try {
        const { nodes } = JSON.parse(workflow.definition);
        const crmTriggerNode = nodes.find(n => n.type === 'crm_lead_trigger');
        if (crmTriggerNode) {
          console.log(`📢 CRM event triggered workflow "${workflow.name}" for contact ${email}`);
          const execution = await prisma.executionLog.create({
            data: {
              workflowId: workflow.id,
              status: 'running',
              logs: JSON.stringify([{ time: new Date().toISOString(), message: `Triggered by CRM Contact event: ${email}` }]),
              triggerData: JSON.stringify(contact)
            }
          });
          latestExecutionId = execution.id;
          const context = { trigger: contact, steps: {} };
          executeWorkflow(workflow.id, execution.id, null, context);
        }
      } catch (e) {
        console.error('Error analyzing workflow triggers:', e);
      }
    }

    res.json({ ...contact, executionId: latestExecutionId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List sent simulated emails
app.get('/api/marketing/emails', async (req, res) => {
  try {
    const emails = await prisma.simulatedEmail.findMany({
      orderBy: { sentAt: 'desc' }
    });
    res.json(emails);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset mock database
app.post('/api/crm/reset', async (req, res) => {
  try {
    await prisma.cRMContact.deleteMany({});
    await prisma.simulatedEmail.deleteMany({});
    await prisma.delayedExecution.deleteMany({});
    await prisma.executionLog.deleteMany({});
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = env.PORT || 4000;
app.listen(PORT, async () => {
  console.log(`Backend listening on port ${PORT}`);
  // Connect to RabbitMQ broker (standby mode if RABBITMQ_URL not set)
  await connectRabbitMQ();
  // Start the background delay scheduler check loop
  startScheduler(2000);
});
