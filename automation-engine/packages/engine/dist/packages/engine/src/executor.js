"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeWorkflow = executeWorkflow;
const graph_1 = require("./graph");
const nodes_1 = require("nodes");
const sdk_1 = require("sdk");
const client_1 = require("@prisma/client");
const crypto_1 = require("./crypto");
const prisma = new client_1.PrismaClient();
/**
 * Resolves template expressions recursively inside nested arrays and object parameter definitions.
 */
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
/**
 * Walks the compiled graph using a data-arrival work-queue,
 * executing matching INodeType actions and writing step reports.
 */
async function executeWorkflow(workflowId, triggerNodeName, triggerPayload) {
    const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
    });
    if (!workflow)
        throw new Error("Workflow not found");
    const definition = JSON.parse(workflow.definition);
    const graph = (0, graph_1.buildGraph)(definition);
    // Cycle check
    try {
        (0, graph_1.topologicalOrderOrThrow)(graph);
    }
    catch (err) {
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
    const stepLogs = [
        { time: new Date().toISOString(), message: "Execution initialized." }
    ];
    const stepsData = {};
    const saveDbLogs = async (status, finished) => {
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
    const readyQueue = [triggerNodeName];
    // Seed trigger node
    const initialTriggerItems = [{ json: triggerPayload }];
    pendingInputs.set(triggerNodeName, new Map([[0, initialTriggerItems]]));
    try {
        while (readyQueue.length > 0) {
            const nodeName = readyQueue.shift();
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
            const nodePortsMap = pendingInputs.get(nodeName) || new Map();
            const inputItems = [];
            for (const items of nodePortsMap.values()) {
                inputItems.push(...items);
            }
            const nodeType = nodes_1.NodeRegistry[node.type];
            if (!nodeType) {
                throw new Error(`Node type "${node.type}" not found in registry`);
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
                        const fallbackCred = await prisma.credential.findFirst({
                            where: { type },
                        });
                        if (!fallbackCred) {
                            throw new Error(`Credentials of type "${type}" not found in project.`);
                        }
                        try {
                            const decrypted = (0, crypto_1.decrypt)(fallbackCred.encryptedData, fallbackCred.iv, fallbackCred.authTag);
                            return JSON.parse(decrypted);
                        }
                        catch (err) {
                            throw new Error(`Failed to decrypt credentials: ${err.message}`);
                        }
                    }
                    try {
                        const decrypted = (0, crypto_1.decrypt)(cred.encryptedData, cred.iv, cred.authTag);
                        return JSON.parse(decrypted);
                    }
                    catch (err) {
                        throw new Error(`Failed to decrypt credentials: ${err.message}`);
                    }
                },
                helpers: {
                    async httpRequest(options) {
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
                        }
                        catch (err) {
                            throw new Error(`HTTP Request helper failed: ${err.message}`);
                        }
                    },
                    returnJsonArray(data) {
                        const arr = Array.isArray(data) ? data : [data];
                        return arr.map(json => ({ json }));
                    }
                }
            };
            // Run NodeType execution hook
            let outputs;
            try {
                outputs = await nodeType.execute.call(executeContext);
            }
            catch (err) {
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
                if (items.length === 0)
                    continue; // Skip empty output path
                if (!pendingInputs.has(edge.toNode)) {
                    pendingInputs.set(edge.toNode, new Map());
                }
                const portMap = pendingInputs.get(edge.toNode);
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
        return { success: true, executionId };
    }
    catch (error) {
        console.error("Workflow Execution Aborted:", error);
        stepLogs.push({ time: new Date().toISOString(), message: `Pipeline aborted: ${error.message}` });
        await saveDbLogs('failed', true);
        return { success: false, executionId, error: error.message };
    }
}
