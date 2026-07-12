"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildGraph = buildGraph;
exports.topologicalOrderOrThrow = topologicalOrderOrThrow;
function buildGraph(workflow) {
    const nodesByName = new Map();
    for (const node of workflow.nodes) {
        nodesByName.set(node.name, node);
    }
    const outgoing = new Map();
    const incomingCount = new Map();
    for (const name of nodesByName.keys()) {
        incomingCount.set(name, 0);
    }
    if (workflow.connections) {
        for (const [sourceName, portsObj] of Object.entries(workflow.connections)) {
            if (!portsObj?.main)
                continue;
            portsObj.main.forEach((edgesForPort, fromPort) => {
                if (!edgesForPort)
                    return;
                for (const edge of edgesForPort) {
                    if (!outgoing.has(sourceName)) {
                        outgoing.set(sourceName, []);
                    }
                    outgoing.get(sourceName).push({
                        toNode: edge.node,
                        toPort: edge.index,
                        fromPort
                    });
                    incomingCount.set(edge.node, (incomingCount.get(edge.node) ?? 0) + 1);
                }
            });
        }
    }
    return { nodesByName, outgoing, incomingCount };
}
function topologicalOrderOrThrow(graph) {
    const inDegree = new Map(graph.incomingCount);
    const queue = [...graph.nodesByName.keys()].filter(n => !inDegree.get(n));
    const order = [];
    while (queue.length > 0) {
        const current = queue.shift();
        order.push(current);
        const edges = graph.outgoing.get(current) ?? [];
        for (const edge of edges) {
            const remaining = (inDegree.get(edge.toNode) ?? 1) - 1;
            inDegree.set(edge.toNode, remaining);
            if (remaining === 0) {
                queue.push(edge.toNode);
            }
        }
    }
    if (order.length !== graph.nodesByName.size) {
        throw new Error("Cycle detected in workflow graph");
    }
    return order;
}
