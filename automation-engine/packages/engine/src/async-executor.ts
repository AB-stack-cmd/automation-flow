import { RuntimeGraph, buildGraph, computeTopologicalWaves } from './graph';
import { validateWorkflowGraph } from './validation';
import { NodeRegistry } from 'nodes';
import { ItemData, IExecuteFunctions, evaluateExpression } from 'sdk';
import { PrismaClient } from '@prisma/client';
import { decrypt } from './crypto';
import { defaultExecutionQueue, ExecutionJobPayload } from './queue';

const prisma = new PrismaClient();

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

export interface AsyncExecutionResult {
  success: boolean;
  executionId: string;
  totalWavesProcessed: number;
  error?: string;
  webhookResponse?: any;
}

export async function executeWorkflowAsync(
  workflowId: string,
  triggerNodeName: string,
  triggerPayload: Record<string, any>
): Promise<AsyncExecutionResult> {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
  });
  if (!workflow) throw new Error(`Workflow "${workflowId}" not found`);

  const definition = JSON.parse(workflow.definition);
  const validation = validateWorkflowGraph(definition);
  if (!validation.valid) {
    throw new Error(`Invalid workflow schema: ${validation.errors.join('; ')}`);
  }

  const graph = buildGraph(definition);
  const waves = computeTopologicalWaves(graph);

  const execution = await prisma.execution.create({
    data: {
      workflowId,
      status: 'running',
      triggerData: JSON.stringify(triggerPayload),
    },
  });
  const executionId = execution.id;

  await prisma.executionData.create({
    data: {
      executionId,
      steps: '{}',
      logs: '[]',
    },
  });

  const stepLogs: Array<{ time: string; nodeId?: string; nodeName?: string; message: string }> = [
    { time: new Date().toISOString(), message: "Async Execution initialized across waves." }
  ];

  const stepsData: Record<string, any> = {};

  const updateLogs = async (status: string, finished: boolean) => {
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
  let webhookResponse: any = null;

  // Seed trigger
  const initialItems: ItemData[] = [{ json: triggerPayload }];
  pendingInputs.set(triggerNodeName, new Map([[0, initialItems]]));

  let wavesProcessed = 0;

  try {
    for (let waveIdx = 0; waveIdx < waves.length; waveIdx++) {
      const currentWave = waves[waveIdx];
      wavesProcessed++;

      // Enqueue job dispatch notifications to queue for audit monitoring
      for (const nodeName of currentWave) {
        const lockKey = `lock:execution:${executionId}:${nodeName}`;
        const locked = await defaultExecutionQueue.acquireLock(lockKey, 10000);
        if (!locked) {
          throw new Error(`Concurrent execution conflict on node "${nodeName}"`);
        }

        await defaultExecutionQueue.enqueueJob({
          executionId,
          workflowId,
          targetNodeName: nodeName,
          inputPayload: triggerPayload,
          waveIndex: waveIdx,
          attempt: 1,
          enqueuedAt: new Date().toISOString(),
        });
      }

      // Execute current wave nodes concurrently
      await Promise.all(currentWave.map(async (nodeName) => {
        const lockKey = `lock:execution:${executionId}:${nodeName}`;
        try {
          const node = graph.nodesByName.get(nodeName);
          if (!node) {
            throw new Error(`Node "${nodeName}" not defined in graph nodes.`);
          }

          stepLogs.push({
            time: new Date().toISOString(),
            nodeName,
            nodeId: node.id,
            message: `Executing node "${nodeName}" (${node.type}) in Wave ${waveIdx}`,
          });

          const nodePortsMap = pendingInputs.get(nodeName) || new Map<number, ItemData[]>();
          const inputItems: ItemData[] = [];
          for (const items of nodePortsMap.values()) {
            inputItems.push(...items);
          }

          const nodeType = NodeRegistry[node.type];
          if (!nodeType) {
            throw new Error(`Node type "${node.type}" not found in NodeRegistry`);
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
                const fallbackCred = await prisma.credential.findFirst({ where: { type } });
                if (!fallbackCred) {
                  throw new Error(`Credentials of type "${type}" not found.`);
                }
                const decrypted = decrypt(fallbackCred.encryptedData, fallbackCred.iv, fallbackCred.authTag);
                return JSON.parse(decrypted);
              }
              const decrypted = decrypt(cred.encryptedData, cred.iv, cred.authTag);
              return JSON.parse(decrypted);
            },
            helpers: {
              async httpRequest(options: any) {
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
              },
              returnJsonArray(data: any | any[]): ItemData[] {
                const arr = Array.isArray(data) ? data : [data];
                return arr.map(json => ({ json }));
              }
            }
          };

          const outputs = await nodeType.execute.call(executeContext);
          nodeOutputs.set(nodeName, outputs);
          stepsData[nodeName] = outputs.map(portItems => portItems.map(item => item.json));

          if (node.type === 'action.respondToWebhook') {
            const responseMode = executeContext.getNodeParameter('responseMode', 0, 'json');
            const statusCode = Number(executeContext.getNodeParameter('statusCode', 0, 200));
            const responseBody = executeContext.getNodeParameter('responseBody', 0, '{"success": true}');
            webhookResponse = { responseMode, statusCode, body: responseBody };
          }

          // Distribute outputs to downstream edges
          const edges = graph.outgoing.get(nodeName) ?? [];
          for (const edge of edges) {
            const items = outputs[edge.fromPort] ?? [];
            if (!pendingInputs.has(edge.toNode)) {
              pendingInputs.set(edge.toNode, new Map());
            }
            pendingInputs.get(edge.toNode)!.set(edge.toPort, items);
          }

        } finally {
          await defaultExecutionQueue.releaseLock(lockKey);
        }
      }));

      await updateLogs('running', false);
    }

    stepLogs.push({ time: new Date().toISOString(), message: "Async pipeline completed successfully." });
    await updateLogs('success', true);

    console.log('Completed Logs', JSON.stringify(stepLogs))
    return {
      success: true,
      executionId,
      totalWavesProcessed: wavesProcessed,
      webhookResponse,
    };

  } catch (error: any) {
    stepLogs.push({ time: new Date().toISOString(), message: `Pipeline failed: ${error.message}` });
    await updateLogs('failed', true);
    return {
      success: false,
      executionId,
      totalWavesProcessed: wavesProcessed,
      error: error.message,
    };
  }
}
