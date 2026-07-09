import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Safely evaluates a simple condition script or expression using current context.
 * Supporting template placeholders: {{trigger.email}}, {{steps.nodeId.score}}, etc.
 */
function evaluateCondition(expression, context) {
  try {
    // 1. Replace double-curly bracket placeholders: e.g. {{trigger.score}}
    let resolvedExpr = expression.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
      const parts = path.trim().split('.');
      let val = context;
      for (const part of parts) {
        val = val?.[part];
      }
      return typeof val === 'string' ? `"${val.replace(/"/g, '\\"')}"` : val ?? 'undefined';
    });

    // 2. Safely evaluate simple JS expression
    // Create a safe runner
    const run = new Function('context', `
      try {
        const trigger = context.trigger || {};
        const steps = context.steps || {};
        return Boolean(${resolvedExpr});
      } catch(e) {
        return false;
      }
    `);
    return run(context);
  } catch (err) {
    console.error('Error evaluating condition:', err);
    return false;
  }
}

/**
 * Safely evaluates custom JavaScript code.
 */
function evaluateCode(codeString, context) {
  try {
    const run = new Function('context', `
      try {
        ${codeString}
      } catch(e) {
        return { error: e.message };
      }
    `);
    return run(context) || {};
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Core engine execution loop.
 * Starts from startNodeId and runs until end, delay, or failure.
 */
export async function executeWorkflow(workflowId, executionId, startNodeId, context, stepLogs = []) {
  try {
    // Load Workflow
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId }
    });

    if (!workflow) {
      throw new Error(`Workflow with ID ${workflowId} not found`);
    }

    const { nodes, edges } = JSON.parse(workflow.definition);

    // Build map for quick lookups
    const nodesMap = new Map(nodes.map(n => [n.id, n]));

    // Find starting node
    let currentNodeId = startNodeId;
    if (!currentNodeId) {
      // Find a trigger node as fallback
      const triggerNode = nodes.find(n => n.type === 'trigger' || n.data?.category === 'trigger');
      if (!triggerNode) {
        throw new Error('No starting node or trigger node found in workflow.');
      }
      currentNodeId = triggerNode.id;
    }

    stepLogs.push({
      time: new Date().toISOString(),
      message: `Starting execution sequence from node: ${currentNodeId}`
    });

    let queue = [currentNodeId];

    while (queue.length > 0) {
      const activeNodeId = queue.shift();
      const node = nodesMap.get(activeNodeId);

      if (!node) {
        stepLogs.push({
          time: new Date().toISOString(),
          message: `Warning: Node ${activeNodeId} not found in definition`
        });
        continue;
      }

      stepLogs.push({
        time: new Date().toISOString(),
        nodeId: node.id,
        nodeType: node.type,
        message: `Executing node "${node.data?.label || node.id}" (${node.type})`
      });

      // Save execution outputs inside context.steps
      if (!context.steps) context.steps = {};
      let nodeOutput = {};

      // Process Node Types
      if (node.type === 'trigger' || node.type === 'webhook' || node.type === 'crm_lead_trigger') {
        nodeOutput = { status: 'triggered', data: context.trigger };
      } 
      else if (node.type === 'email_marketing' || node.type === 'marketing_email') {
        const to = node.data?.to || context.trigger?.email || 'test@example.com';
        const subject = node.data?.subject || 'Welcome to Our Service';
        const body = node.data?.body || 'Hello! Thank you for connecting with us.';

        // Replace templates in subject/body
        const renderText = (text) => {
          return text.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
            const parts = path.trim().split('.');
            let val = context;
            for (const part of parts) {
              val = val?.[part];
            }
            return val ?? '';
          });
        };

        const resolvedTo = renderText(to);
        const resolvedSubject = renderText(subject);
        const resolvedBody = renderText(body);

        const email = await prisma.simulatedEmail.create({
          data: {
            to: resolvedTo,
            subject: resolvedSubject,
            body: resolvedBody
          }
        });

        nodeOutput = { status: 'sent', emailId: email.id, to: resolvedTo };
        stepLogs.push({
          time: new Date().toISOString(),
          nodeId: node.id,
          message: `Successfully simulated sent email to ${resolvedTo}`
        });
      } 
      else if (node.type === 'crm_action' || node.type === 'crm_update') {
        const actionType = node.data?.actionType || 'create_or_update'; // create_or_update, update_score
        const name = node.data?.name || context.trigger?.name || 'Anonymous';
        const email = node.data?.email || context.trigger?.email;
        const status = node.data?.status || 'lead';
        const scoreChange = parseInt(node.data?.scoreChange || '0', 10);

        if (!email) {
          throw new Error('Email is required for CRM lead actions');
        }

        let contact = await prisma.cRMContact.findUnique({ where: { email } });
        if (contact) {
          contact = await prisma.cRMContact.update({
            where: { email },
            data: {
              name: name !== 'Anonymous' ? name : contact.name,
              status: status !== 'lead' ? status : contact.status,
              score: contact.score + scoreChange
            }
          });
          stepLogs.push({
            time: new Date().toISOString(),
            nodeId: node.id,
            message: `Updated existing CRM contact ${email}. New score: ${contact.score}`
          });
        } else {
          contact = await prisma.cRMContact.create({
            data: {
              name,
              email,
              status,
              score: Math.max(0, scoreChange)
            }
          });
          stepLogs.push({
            time: new Date().toISOString(),
            nodeId: node.id,
            message: `Created new CRM contact: ${email} with score: ${contact.score}`
          });
        }

        nodeOutput = contact;
      } 
      else if (node.type === 'delay') {
        const seconds = parseInt(node.data?.seconds || '10', 10);
        const resumeTime = new Date(Date.now() + seconds * 1000);

        // Find child node(s) connected to this delay
        const childEdges = edges.filter(e => e.source === node.id);
        if (childEdges.length === 0) {
          stepLogs.push({
            time: new Date().toISOString(),
            nodeId: node.id,
            message: `Delay complete, but no downstream nodes connected.`
          });
          continue; // End execution
        }

        // Save progress to database so scheduler can pick it up
        for (const edge of childEdges) {
          await prisma.delayedExecution.create({
            data: {
              workflowId,
              executionId,
              nodeId: edge.target,
              resumeTime,
              contextData: JSON.stringify(context)
            }
          });
        }

        stepLogs.push({
          time: new Date().toISOString(),
          nodeId: node.id,
          message: `Suspended execution. Will resume in ${seconds} seconds (at ${resumeTime.toISOString()})`
        });

        // Persist execution logs
        await prisma.executionLog.update({
          where: { id: executionId },
          data: {
            logs: JSON.stringify(stepLogs)
          }
        });

        return; // Terminate execution run thread (scheduler will resume)
      } 
      else if (node.type === 'ifelse' || node.type === 'logic') {
        const condition = node.data?.condition || 'true';
        const evaluationResult = evaluateCondition(condition, context);

        stepLogs.push({
          time: new Date().toISOString(),
          nodeId: node.id,
          message: `Condition [ ${condition} ] evaluated to: ${evaluationResult}`
        });

        nodeOutput = { result: evaluationResult };
        context.steps[node.id] = nodeOutput;

        // Find edge for True or False branch
        const targetHandle = evaluationResult ? 'true' : 'false';
        const branchingEdges = edges.filter(e => e.source === node.id && e.sourceHandle === targetHandle);

        for (const edge of branchingEdges) {
          queue.push(edge.target);
        }
        continue; // Avoid standard children push
      } 
      else if (node.type === 'code' || node.type === 'run_code') {
        const codeString = node.data?.code || 'return { success: true };';
        const codeResult = evaluateCode(codeString, context);

        nodeOutput = codeResult;
        stepLogs.push({
          time: new Date().toISOString(),
          nodeId: node.id,
          message: `Custom script execution complete. Result: ${JSON.stringify(codeResult)}`
        });
      }

      // Record output in context
      context.steps[node.id] = nodeOutput;

      // Queue standard children nodes (for nodes without custom branching handles)
      const outgoingEdges = edges.filter(e => e.source === node.id);
      for (const edge of outgoingEdges) {
        queue.push(edge.target);
      }
    }

    // Mark log execution as complete
    stepLogs.push({
      time: new Date().toISOString(),
      message: 'Workflow execution successfully completed.'
    });

    await prisma.executionLog.update({
      where: { id: executionId },
      data: {
        status: 'success',
        finishedAt: new Date(),
        logs: JSON.stringify(stepLogs)
      }
    });

  } catch (error) {
    console.error('Workflow Execution Error:', error);
    stepLogs.push({
      time: new Date().toISOString(),
      message: `Execution Failed: ${error.message}`
    });

    await prisma.executionLog.update({
      where: { id: executionId },
      data: {
        status: 'failed',
        finishedAt: new Date(),
        logs: JSON.stringify(stepLogs)
      }
    });
  }
}
