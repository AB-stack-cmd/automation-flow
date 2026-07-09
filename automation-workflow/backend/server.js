import express from 'express';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { executeWorkflow } from './engine.js';
import { startScheduler } from './scheduler.js';

dotenv.config();

const app = express();
app.use(express.json());

const prisma = new PrismaClient();

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
        logs: JSON.stringify([{ time: new Date().toISOString(), message: 'Triggered manually' }])
      }
    });

    // Start background execution
    const context = { trigger: triggerData, steps: {} };
    executeWorkflow(workflow.id, execution.id, null, context);

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

    const execution = await prisma.executionLog.create({
      data: {
        workflowId: workflow.id,
        status: 'running',
        logs: JSON.stringify([{ time: new Date().toISOString(), message: 'Triggered via incoming Webhook' }])
      }
    });

    const context = { trigger: triggerData, steps: {} };
    executeWorkflow(workflow.id, execution.id, null, context);

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
      take: 20
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
      where: { id: parseInt(executionId, 10) }
    });
    if (!execution) return res.status(404).json({ error: 'Execution log not found' });
    res.json(execution);
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
              logs: JSON.stringify([{ time: new Date().toISOString(), message: `Triggered by CRM Contact event: ${email}` }])
            }
          });
          const context = { trigger: contact, steps: {} };
          executeWorkflow(workflow.id, execution.id, null, context);
        }
      } catch (e) {
        console.error('Error analyzing workflow triggers:', e);
      }
    }

    res.json(contact);
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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
  // Start the background delay scheduler check loop
  startScheduler(2000);
});
