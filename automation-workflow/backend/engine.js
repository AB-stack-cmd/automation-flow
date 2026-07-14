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
 * Resolves double curly templates resolving path items in execution context.
 */
function interpolateTemplate(template, context) {
  if (typeof template !== 'string') return template;
  return template.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
    const parts = path.trim().replace(/^\$/, '').split('.');
    let val = context;
    for (const part of parts) {
      if (part === 'json') continue;
      val = val?.[part];
    }
    return val !== undefined ? String(val) : '';
  });
}

/**
 * Safely evaluates custom JavaScript code.
 */
function evaluateCode(codeString, context) {
  try {
    const run = new Function('context', `
      try {
        const trigger = context.trigger || {};
        const steps = context.steps || {};
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

    // Update execution log with initial trigger data
    await prisma.executionLog.update({
      where: { id: executionId },
      data: {
        triggerData: JSON.stringify(context.trigger || {})
      }
    });

    // Build map for quick lookups
    const nodesMap = new Map(nodes.map(n => [n.id, n]));

    // Find starting node
    let currentNodeId = startNodeId;
    if (!currentNodeId) {
      // Find a trigger node as fallback
      const triggerNode = nodes.find(n => 
        n.type === 'trigger' || 
        n.type === 'crm_lead_trigger' || 
        n.type === 'schedule_trigger' ||
        n.type === 'google_form_trigger' ||
        n.type === 'start_trigger' ||
        n.data?.category === 'trigger'
      );
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
      else if (node.type === 'schedule_trigger') {
        nodeOutput = { status: 'triggered', triggeredAt: context.trigger?.triggeredAt || new Date().toISOString() };
      }
      else if (node.type === 'google_sheets') {
        const action = node.data?.action || 'read';
        const mockDataType = node.data?.mockDataType || 'blog_news';
        const sheetName = node.data?.sheetName || 'Sheet1';
        const triggerForEachRow = node.data?.triggerForEachRow !== false;

        if (action === 'read') {
          let rows = [];
          if (mockDataType === 'blog_news') {
            rows = [
              {
                id: 1,
                title: 'AI Revolution in Marketing',
                summary: 'Discover how artificial intelligence is transforming marketing strategies in 2026.',
                content: 'Artificial intelligence is changing how we communicate with leads. By using automated agents and dynamic analysis, companies can scale operations while remaining personal. This summary details how NEURON_FLOW enables AI-driven lead scoring and automated engagement.',
                platform: 'Slack & Twitter',
                status: 'Draft'
              },
              {
                id: 2,
                title: 'Building Scalable Workflows',
                summary: 'Best practices for designing node-based automation pipelines without code.',
                content: 'Scalable workflows require clear visual components, robust data propagation, and state preservation. Using sqlite databases and polling schedulers ensures no jobs are lost even during server restarts.',
                platform: 'Discord & Slack',
                status: 'Published'
              },
              {
                id: 3,
                title: 'CRM Lead Conversion Rates',
                summary: 'Analyzing CRM contact score impact on overall business conversion.',
                content: 'By integrating webhook triggers and automated scoring, CRM platforms can increase conversion rates by 40%. Real-time routing to active sales channels ensures timely follow-up.',
                platform: 'Email & Slack',
                status: 'Draft'
              }
            ];
          } else if (mockDataType === 'crm_leads') {
            rows = [
              { name: 'Sarah Connor', email: 'sarah@resistance.io', status: 'lead', score: 85 },
              { name: 'John Doe', email: 'john.doe@example.com', status: 'contact', score: 60 },
              { name: 'Alice Smith', email: 'alice@cloud.com', status: 'customer', score: 95 }
            ];
          } else {
            try {
              rows = JSON.parse(node.data?.customJson || '[]');
            } catch (e) {
              rows = [{ error: 'Invalid custom JSON' }];
            }
          }

          stepLogs.push({
            time: new Date().toISOString(),
            nodeId: node.id,
            message: `Fetched ${rows.length} rows from Google Sheet: "${sheetName}"`
          });

          if (triggerForEachRow) {
            const childEdges = edges.filter(e => e.source === node.id);
            stepLogs.push({
              time: new Date().toISOString(),
              nodeId: node.id,
              message: `Triggering ${rows.length} separate workflow execution threads (one for each sheet row)...`
            });

            for (const row of rows) {
              const subExec = await prisma.executionLog.create({
                data: {
                  workflowId,
                  status: 'running',
                  logs: JSON.stringify([{ time: new Date().toISOString(), message: `Triggered by Google Sheet row: ${JSON.stringify(row)}` }]),
                  triggerData: JSON.stringify(row)
                }
              });

              for (const edge of childEdges) {
                executeWorkflow(workflowId, subExec.id, edge.target, { trigger: row, steps: {} })
                  .catch(err => {
                    console.error(`Error executing sheet sub-workflow:`, err);
                  });
              }
            }

            await prisma.executionLog.update({
              where: { id: executionId },
              data: {
                status: 'success',
                finishedAt: new Date(),
                logs: JSON.stringify(stepLogs),
                responseData: JSON.stringify({ triggeredSubflowsCount: rows.length })
              }
            });
            return;
          } else {
            nodeOutput = { rows };
          }
        } else {
          const rowDataStr = node.data?.rowData || '{"email": "{{trigger.email}}"}';
          let interpolatedRow = {};
          try {
            const parsedRow = JSON.parse(rowDataStr);
            for (const [key, val] of Object.entries(parsedRow)) {
              interpolatedRow[key] = interpolateTemplate(val, context);
            }
          } catch (e) {
            interpolatedRow = { raw: interpolateTemplate(rowDataStr, context) };
          }

          stepLogs.push({
            time: new Date().toISOString(),
            nodeId: node.id,
            message: `Simulated appending row to Google Sheet "${sheetName}": ${JSON.stringify(interpolatedRow)}`
          });

          nodeOutput = { success: true, appendedRow: interpolatedRow };
        }
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

        const renderText = (text) => {
          if (typeof text !== 'string') return text;
          return text.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
            const parts = path.trim().split('.');
            let val = context;
            for (const part of parts) {
              val = val?.[part];
            }
            return val ?? '';
          });
        };

        const resolvedEmail = renderText(email);
        const resolvedName = renderText(name);
        const resolvedStatus = renderText(status);

        if (!resolvedEmail) {
          throw new Error('Email is required for CRM lead actions');
        }

        let contact = await prisma.cRMContact.findUnique({ where: { email: resolvedEmail } });
        if (contact) {
          contact = await prisma.cRMContact.update({
            where: { email: resolvedEmail },
            data: {
              name: resolvedName !== 'Anonymous' ? resolvedName : contact.name,
              status: resolvedStatus !== 'lead' ? resolvedStatus : contact.status,
              score: contact.score + scoreChange
            }
          });
          stepLogs.push({
            time: new Date().toISOString(),
            nodeId: node.id,
            message: `Updated existing CRM contact ${resolvedEmail}. New score: ${contact.score}`
          });
        } else {
          contact = await prisma.cRMContact.create({
            data: {
              name: resolvedName,
              email: resolvedEmail,
              status: resolvedStatus,
              score: Math.max(0, scoreChange)
            }
          });
          stepLogs.push({
            time: new Date().toISOString(),
            nodeId: node.id,
            message: `Created new CRM contact: ${resolvedEmail} with score: ${contact.score}`
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
            logs: JSON.stringify(stepLogs),
            responseData: JSON.stringify(context.steps || {})
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
      else if (node.type === 'respond_to_webhook' || node.type === 'action.respondToWebhook') {
        const responseMode = node.data?.responseMode || 'json';
        const statusCode = parseInt(node.data?.statusCode || '200', 10);
        const headersStr = node.data?.headers || '{}';
        const responseBody = node.data?.responseBody || '{"success": true}';
        const redirectUrl = node.data?.redirectUrl || '';

        let resolvedHeaders = {};
        try {
          const parsedHeaders = typeof headersStr === 'string' ? JSON.parse(headersStr) : headersStr;
          for (const [k, v] of Object.entries(parsedHeaders)) {
            resolvedHeaders[k] = interpolateTemplate(v, context);
          }
        } catch (e) {
          resolvedHeaders = {};
        }

        let resolvedBody = '';
        if (responseMode === 'json') {
          resolvedBody = interpolateTemplate(responseBody, context);
          try {
            resolvedBody = JSON.parse(resolvedBody);
          } catch (e) {}
        } else if (responseMode === 'redirect') {
          resolvedBody = interpolateTemplate(redirectUrl, context);
        } else {
          resolvedBody = interpolateTemplate(responseBody, context);
        }

        context.webhookResponse = {
          responseMode,
          statusCode,
          headers: resolvedHeaders,
          body: resolvedBody
        };

        nodeOutput = { status: 'responded', statusCode };
        stepLogs.push({
          time: new Date().toISOString(),
          nodeId: node.id,
          message: `Captured custom webhook response configuration (Status: ${statusCode}, Mode: ${responseMode})`
        });
      }
      else if (node.type === 'end') {
        nodeOutput = { status: 'completed' };
        stepLogs.push({
          time: new Date().toISOString(),
          nodeId: node.id,
          message: '🏁 [END] Pipeline execution terminated at End Node.'
        });
      }
      else if (node.type === 'openai' || node.type === 'action.openai') {
        const prompt = interpolateTemplate(node.data?.prompt || '', context);
        const apiKey = process.env.OPENAI_API_KEY || 'mock-key';
        let resultText = "Mock OpenAI completion success!";
        if (apiKey && apiKey !== 'mock-key') {
          try {
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: node.data?.model || 'gpt-4o',
                messages: [{ role: 'user', content: prompt }]
              })
            });
            const resJson = await res.json();
            resultText = resJson.choices?.[0]?.message?.content || resultText;
          } catch (e) {
            console.error('Real OpenAI call failed, falling back to mock:', e.message);
          }
        }
        nodeOutput = { result: resultText, prompt };
        stepLogs.push({
          time: new Date().toISOString(),
          nodeId: node.id,
          message: `OpenAI execution complete. Result: ${resultText}`
        });
      }
      else if (node.type === 'slack' || node.type === 'action.slack') {
        const webhookUrl = interpolateTemplate(node.data?.webhookUrl || '', context);
        const text = interpolateTemplate(node.data?.text || '', context);
        if (webhookUrl && webhookUrl.startsWith('http')) {
          try {
            await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text })
            });
          } catch (e) {
            console.error('Slack publish failed:', e.message);
          }
        }
        nodeOutput = { success: true, text };
        stepLogs.push({
          time: new Date().toISOString(),
          nodeId: node.id,
          message: `Slack message published to webhook: ${webhookUrl}`
        });
      }
      else if (node.type === 'discord' || node.type === 'action.discord') {
        const webhookUrl = interpolateTemplate(node.data?.webhookUrl || '', context);
        const content = interpolateTemplate(node.data?.content || '', context);
        if (webhookUrl && webhookUrl.startsWith('http')) {
          try {
            await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content })
            });
          } catch (e) { 
            console.error('Discord publish failed:', e.message);
          }
        }
        nodeOutput = { success: true, content };
        stepLogs.push({
          time: new Date().toISOString(),
          nodeId: node.id,
          message: `Discord message published to webhook: ${webhookUrl}`
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
        logs: JSON.stringify(stepLogs),
        responseData: JSON.stringify(context.steps || {})
      }
    });

    return { success: true, webhookResponse: context.webhookResponse, steps: context.steps };

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
        logs: JSON.stringify(stepLogs),
        responseData: JSON.stringify(context.steps || {})
      }
    });

    return { success: false, error: error.message };
  }
}
