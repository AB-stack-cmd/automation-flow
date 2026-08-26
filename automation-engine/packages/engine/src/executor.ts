import { RuntimeGraph, buildGraph, topologicalOrderOrThrow } from './graph';
import { NodeRegistry } from 'nodes';
import { ItemData, IExecuteFunctions, evaluateExpression } from 'sdk';
import { PrismaClient } from '@prisma/client';
import { decrypt } from './crypto';

const prisma = new PrismaClient();

/**
 * Resolves template expressions recursively inside nested arrays and object parameter definitions.
 */
function resolveParameters(paramValue: any, item: ItemData): any {
  if (paramValue === null || paramValue === undefined) return paramValue;
  
  if (typeof paramValue === 'string') {
    return evaluateExpression(paramValue, item);
  }
  if (Array.isArray(paramValue)) {
    return paramValue.map(val => resolveParameters(val, item));
  }
  if (typeof paramValue === 'object') {
    const resObj: Record<string, any> = {};
    for (const [k, v] of Object.entries(paramValue)) {
      resObj[k] = resolveParameters(v, item);
    }
    return resObj;
  }
  return paramValue;
}

/**
 * Walks the compiled graph using a data-arrival work-queue,
 * executing matching INodeType actions and writing step reports.
 */
export async function executeWorkflow(
  workflowId: string,
  triggerNodeName: string,
  triggerPayload: Record<string, any>
) {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
  });
  if (!workflow) throw new Error("Workflow not found");

  const definition = JSON.parse(workflow.definition);
  const graph = buildGraph(definition);

  // Cycle check
  try {
    topologicalOrderOrThrow(graph);
  } catch (err: any) {
    throw new Error(`Invalid graph layout: ${err.message}`);
  }

  // Create Execution
  const execution = await prisma.execution.create({
    data: {
      workflowId,
      status: 'running',
      triggerData: JSON.stringify(triggerPayload),
    },
  });

  const executionId = execution.id;

  // Create associated ExecutionData container
  await prisma.executionData.create({
    data: {
      executionId,
      steps: '{}',
      logs: '[]',
    },
  });

  const stepLogs: Array<{ time: string; nodeId?: string; nodeName?: string; message: string }> = [
    { time: new Date().toISOString(), message: "Execution initialized." }
  ];

  const stepsData: Record<string, any> = {};

  const saveDbLogs = async (status: string, finished: boolean) => {
    await prisma.executionData.update({
      where: { executionId },
      data: {
        steps: JSON.stringify(stepsData),
        logs: JSON.stringify(stepLogs),
      },
    });
    
    if (finished) {
      await prisma.execution.update({
        where: { id: executionId },
        data: {
          status,
          finishedAt: new Date(),
        },
      });
    }
  };

  const nodeOutputs = new Map<string, ItemData[][]>();
  const pendingInputs = new Map<string, Map<number, ItemData[]>>();
  const readyQueue: string[] = [triggerNodeName];
  let webhookResponse: any = null;

  // Seed trigger node
  const initialTriggerItems: ItemData[] = [{ json: triggerPayload }];
  pendingInputs.set(triggerNodeName, new Map([[0, initialTriggerItems]]));

  try {
    while (readyQueue.length > 0) {
      const nodeName = readyQueue.shift()!;
      const node = graph.nodesByName.get(nodeName);
      if (!node) {
        throw new Error(`Node "${nodeName}" is declared in connections but not defined in nodes list.`);
      }
      
      stepLogs.push({
        time: new Date().toISOString(),
        nodeName,
        nodeId: node.id,
        message: `Executing node "${nodeName}" (${node.type})`,
      });
      await saveDbLogs('running', false);

      const nodePortsMap = pendingInputs.get(nodeName) || new Map<number, ItemData[]>();
      const inputItems: ItemData[] = [];
      for (const items of nodePortsMap.values()) {
        inputItems.push(...items);
      }

      const nodeType = NodeRegistry[node.type];
      if (!nodeType) {
        throw new Error(`Node type "${node.type}" not found in registry`);
      }

      const executeContext: IExecuteFunctions = {
        getInputData(portIndex?: number) {
          if (portIndex !== undefined) {
            return nodePortsMap.get(portIndex) || [];
          }
          return inputItems;
        },
        getNodeParameter(name: string, itemIndex: number, defaultValue?: any) {
          const rawVal = node.parameters?.[name];
          if (rawVal === undefined) return defaultValue;
          
          const currentItem = inputItems[itemIndex] || { json: {} };
          return resolveParameters(rawVal, currentItem);
        },
        async getCredentials(type: string) {
          const cred = await prisma.credential.findFirst({
            where: {
              projectId: workflow.projectId,
              type,
            },
          });
          if (!cred) {
            const fallbackCred = await prisma.credential.findFirst({
              where: { type },
            });
            if (!fallbackCred) {
              throw new Error(`Credentials of type "${type}" not found in project.`);
            }
            try {
              const decrypted = decrypt(fallbackCred.encryptedData, fallbackCred.iv, fallbackCred.authTag);
              return JSON.parse(decrypted);
            } catch (err: any) {
              throw new Error(`Failed to decrypt credentials: ${err.message}`);
            }
          }
          try {
            const decrypted = decrypt(cred.encryptedData, cred.iv, cred.authTag);
            return JSON.parse(decrypted);
          } catch (err: any) {
            throw new Error(`Failed to decrypt credentials: ${err.message}`);
          }
        },
        helpers: {
          async httpRequest(options: any) {
            try {
              const res = await fetch(options.url, {
                method: options.method || 'GET',
                headers: options.headers,
                body: options.body ? JSON.stringify(options.body) : undefined,
              });
              const contentType = res.headers.get('content-type') || '';
              if (contentType.includes('application/json')) {
                return await res.json();
              }
              return await res.text();
            } catch (err: any) {
              throw new Error(`HTTP Request helper failed: ${err.message}`);
            }
          },
          returnJsonArray(data: any | any[]): ItemData[] {
            const arr = Array.isArray(data) ? data : [data];
            return arr.map(json => ({ json }));
          }
        }
      };

      // Run NodeType execution hook
      let outputs: ItemData[][];
      try {
        outputs = await nodeType.execute.call(executeContext);
      } catch (err: any) {
        stepLogs.push({
          time: new Date().toISOString(),
          nodeName,
          nodeId: node.id,
          message: `Execution failed at step: ${err.message}`,
        });
        throw err;
      }

      nodeOutputs.set(nodeName, outputs);
      stepsData[nodeName] = outputs.map(portItems => portItems.map(item => item.json));

      if (node.type === 'action.respondToWebhook') {
        const responseMode = executeContext.getNodeParameter('responseMode', 0, 'json');
        const statusCode = Number(executeContext.getNodeParameter('statusCode', 0, 200));
        const responseBody = executeContext.getNodeParameter('responseBody', 0, '{"success": true}');
        const redirectUrl = executeContext.getNodeParameter('redirectUrl', 0, '');

        let body = responseBody;
        if (responseMode === 'json' && typeof responseBody === 'string') {
          try {
            body = JSON.parse(responseBody);
          } catch (e) {
            // Keep as string
          }
        }

        webhookResponse = {
          responseMode,
          statusCode,
          body,
          redirectUrl,
        };
      }

      stepLogs.push({
        time: new Date().toISOString(),
        nodeName,
        nodeId: node.id,
        message: `Node executed successfully. Outputs recorded.`,
      });

      // Traverse children paths
      const edges = graph.outgoing.get(nodeName) ?? [];
      for (const edge of edges) {
        const items = outputs[edge.fromPort] ?? [];
        if (items.length === 0) continue; // Skip empty output path

        if (!pendingInputs.has(edge.toNode)) {
          pendingInputs.set(edge.toNode, new Map());
        }
        
        const portMap = pendingInputs.get(edge.toNode)!;
        portMap.set(edge.toPort, items);

        const requiredInputs = graph.incomingCount.get(edge.toNode) ?? 1;
        if (portMap.size >= requiredInputs) {
          if (!readyQueue.includes(edge.toNode)) {
            readyQueue.push(edge.toNode);
          }
        }
      }
    }

    stepLogs.push({ time: new Date().toISOString(), message: "Pipeline execution completed successfully." });
    await saveDbLogs('success', true);
    return { success: true, executionId, webhookResponse };

  } catch (error: any) {
    console.error("Workflow Execution Aborted:", error);
    stepLogs.push({ time: new Date().toISOString(), message: `Pipeline aborted: ${error.message}` });
    await saveDbLogs('failed', true);
    return { success: false, executionId, error: error.message, webhookResponse: null };
  }
}
