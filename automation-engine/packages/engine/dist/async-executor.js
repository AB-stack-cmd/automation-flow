"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeWorkflowAsync = executeWorkflowAsync;
const graph_1 = require("./graph");
const validation_1 = require("./validation");
const nodes_1 = require("nodes");
const sdk_1 = require("sdk");
const client_1 = require("@prisma/client");
const crypto_1 = require("./crypto");
const queue_1 = require("./queue");
const prisma = new client_1.PrismaClient();
function resolveParameters(paramValue, item) {
    if (paramValue === null || paramValue === undefined)
        return paramValue;
    if (typeof paramValue === 'string') {
        return (0, sdk_1.evaluateExpression)(paramValue, item);
    }
    if (Array.isArray(paramValue)) {
        return paramValue.map(val => resolveParameters(val, item));
    }
    if (typeof paramValue === 'object') {
        const resObj = {};
        for (const [k, v] of Object.entries(paramValue)) {
            resObj[k] = resolveParameters(v, item);
        }
        return resObj;
    }
    return paramValue;
}
async function executeWorkflowAsync(workflowId, triggerNodeName, triggerPayload) {
    const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
    });
    if (!workflow)
        throw new Error(`Workflow "${workflowId}" not found`);
    const definition = JSON.parse(workflow.definition);
    const validation = (0, validation_1.validateWorkflowGraph)(definition);
    if (!validation.valid) {
        throw new Error(`Invalid workflow schema: ${validation.errors.join('; ')}`);
    }
    const graph = (0, graph_1.buildGraph)(definition);
    const waves = (0, graph_1.computeTopologicalWaves)(graph);
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
    const stepLogs = [
        { time: new Date().toISOString(), message: "Async Execution initialized across waves." }
    ];
    const stepsData = {};
    const updateLogs = async (status, finished) => {
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
    const nodeOutputs = new Map();
    const pendingInputs = new Map();
    let webhookResponse = null;
    // Seed trigger
    const initialItems = [{ json: triggerPayload }];
    pendingInputs.set(triggerNodeName, new Map([[0, initialItems]]));
    let wavesProcessed = 0;
    try {
        for (let waveIdx = 0; waveIdx < waves.length; waveIdx++) {
            const currentWave = waves[waveIdx];
            wavesProcessed++;
            // Enqueue job dispatch notifications to queue for audit monitoring
            for (const nodeName of currentWave) {
                const lockKey = `lock:execution:${executionId}:${nodeName}`;
                const locked = await queue_1.defaultExecutionQueue.acquireLock(lockKey, 10000);
                if (!locked) {
                    throw new Error(`Concurrent execution conflict on node "${nodeName}"`);
                }
                await queue_1.defaultExecutionQueue.enqueueJob({
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
                    const nodePortsMap = pendingInputs.get(nodeName) || new Map();
                    const inputItems = [];
                    for (const items of nodePortsMap.values()) {
                        inputItems.push(...items);
                    }
                    const nodeType = nodes_1.NodeRegistry[node.type];
                    if (!nodeType) {
                        throw new Error(`Node type "${node.type}" not found in NodeRegistry`);
                    }
                    const executeContext = {
                        getInputData(portIndex) {
                            if (portIndex !== undefined) {
                                return nodePortsMap.get(portIndex) || [];
                            }
                            return inputItems;
                        },
                        getNodeParameter(name, itemIndex, defaultValue) {
                            const rawVal = node.parameters?.[name];
                            if (rawVal === undefined)
                                return defaultValue;
                            const currentItem = inputItems[itemIndex] || { json: {} };
                            return resolveParameters(rawVal, currentItem);
                        },
                        async getCredentials(type) {
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
                                const decrypted = (0, crypto_1.decrypt)(fallbackCred.encryptedData, fallbackCred.iv, fallbackCred.authTag);
                                return JSON.parse(decrypted);
                            }
                            const decrypted = (0, crypto_1.decrypt)(cred.encryptedData, cred.iv, cred.authTag);
                            return JSON.parse(decrypted);
                        },
                        helpers: {
                            async httpRequest(options) {
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
                            returnJsonArray(data) {
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
                        pendingInputs.get(edge.toNode).set(edge.toPort, items);
                    }
                }
                finally {
                    await queue_1.defaultExecutionQueue.releaseLock(lockKey);
                }
            }));
            await updateLogs('running', false);
        }
        stepLogs.push({ time: new Date().toISOString(), message: "Async pipeline completed successfully." });
        await updateLogs('success', true);
        console.log('Completed Logs', JSON.stringify(stepLogs));
        return {
            success: true,
            executionId,
            totalWavesProcessed: wavesProcessed,
            webhookResponse,
        };
    }
    catch (error) {
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
